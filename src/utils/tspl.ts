import { writeBarcode } from "zxing-wasm";

/**
 * Сырой КМ → формат GS1 с скобками для zxing `options: "gs1"`.
 * Именно так в DataMatrix попадает лидирующий FNC1 (символика ]d2).
 *
 * Пример:
 *   01046…215HsH…\x1d93+mWh
 *   → (01)046…(21)5HsH…(93)+mWh
 */
export function toGs1Parenthetical(raw: string): string {
  let s = raw.replace(/<GS>/gi, "\x1d").trim();

  // Сканер мог отдать FNC1 (0xE8) или лишний GS в начале — убираем
  while (s.length && (s.charCodeAt(0) === 0xe8 || s.charCodeAt(0) === 0x1d)) {
    s = s.slice(1);
  }

  if (!s.startsWith("01") || s.length < 18) {
    throw new Error("КМ должен начинаться с AI 01 + GTIN (14 цифр)");
  }

  const parts: string[] = [];
  parts.push(`(01)${s.slice(2, 16)}`);
  let i = 16;

  if (s.slice(i, i + 2) !== "21") {
    throw new Error("После GTIN ожидается AI 21 (серийный номер)");
  }
  i += 2;

  const rest = s.slice(i);
  const gsAt = rest.indexOf("\x1d");

  let serial: string;
  let tail: string;

  if (gsAt !== -1) {
    serial = rest.slice(0, gsAt);
    tail = rest.slice(gsAt + 1); // после первого GS: 91… / 92… / 93…
  } else {
    // GS нет — серийник до крипто-AI 91/92/93
    const m = rest.match(/^(.*?)((?:91|92|93)[\s\S]*)$/);
    if (m && m[1].length > 0) {
      serial = m[1];
      tail = m[2];
    } else {
      serial = rest;
      tail = "";
    }
  }

  if (!serial) {
    throw new Error("Пустой серийный номер (AI 21)");
  }
  parts.push(`(21)${serial}`);

  // Хвост: AI, разделённые GS (или один AI без разделителей)
  let t = tail;
  while (t.length) {
    if (t.charCodeAt(0) === 0x1d) {
      t = t.slice(1);
      continue;
    }
    const ai = t.slice(0, 2);
    if (!/^\d{2}$/.test(ai)) break;
    t = t.slice(2);
    const nextGs = t.indexOf("\x1d");
    const value = nextGs === -1 ? t : t.slice(0, nextGs);
    parts.push(`(${ai})${value}`);
    t = nextGs === -1 ? "" : t.slice(nextGs + 1);
  }

  return parts.join("");
}

export interface TsplLabelOptions {
  /** Ширина этикетки в мм (по умолчанию 58) */
  widthMm?: number;
  /** Высота этикетки в мм (по умолчанию 40) */
  heightMm?: number;
  /** Разрешение принтера в DPI (у TSC TE310 = 300) */
  dpi?: number;
  /** Зазор между этикетками в мм (по умолчанию 2) */
  gapMm?: number;
  /** Количество копий (по умолчанию 1) */
  copies?: number;
  /** Смещение по горизонтали (X) в мм (+ вправо, - влево) */
  offsetXmm?: number;
  /** Смещение по вертикали (Y) в мм (+ вниз, - вверх) */
  offsetYmm?: number;
  /** Направление печати: 0 — прямое (по умолчанию), 1 — поворот 180° */
  direction?: 0 | 1;
  /** Отступ кода от краёв этикетки в мм (по умолчанию 2) — если code* не заданы */
  marginMm?: number;
  /**
   * Желаемая ширина кода в мм (DataMatrix — квадрат: берётся min(codeWidthMm, codeHeightMm)).
   * Если не задано — код растягивается почти на всю этикетку (минус marginMm).
   */
  codeWidthMm?: number;
  /** Желаемая высота кода в мм (см. codeWidthMm) */
  codeHeightMm?: number;
}

export interface GeneratedTsplResult {
  /** Бинарный буфер готовых TSPL команд для отправки в принтер */
  data: Uint8Array;
  /** Сгенерированный векторный SVG для предпросмотра на экране */
  svg: string;
  /** Размер матрицы модулей DataMatrix (например, 24x24) */
  matrixSize: { width: number; height: number };
  /** Физический размер кода на этикетке в мм */
  codeSizeMm: number;
}

/**
 * TSPL BITMAP (TSPL II): бит 0 = чёрная точка, бит 1 = белая бумага.
 * Буфер инициализируется 0xFF (белый), чёрные модули сбрасывают бит в 0.
 */
export async function generateDatamatrixTspl(
  rawCode: string,
  options: TsplLabelOptions = {}
): Promise<GeneratedTsplResult> {
  const {
    widthMm = 58,
    heightMm = 40,
    dpi = 300,
    gapMm = 2,
    copies = 1,
    offsetXmm = 0,
    offsetYmm = 0,
    direction = 0,
    marginMm = 2,
    codeWidthMm,
    codeHeightMm,
  } = options;

  const gs1Input = toGs1Parenthetical(rawCode);
  const zxingResult = await writeBarcode(gs1Input, {
    format: "DataMatrix",
    forceSquareDataMatrix: true,
    options: "gs1",
  });

  if (zxingResult.error) {
    throw new Error(`Ошибка ZXing GS1 DataMatrix: ${zxingResult.error}`);
  }

  const { symbol, svg } = zxingResult;
  if (!symbol || !symbol.width || !symbol.height || !symbol.data) {
    throw new Error("ZXing не вернул данные матрицы DataMatrix");
  }

  const dotsPerMm = dpi / 25.4;
  const labelWidthDots = Math.round(widthMm * dotsPerMm);
  const labelHeightDots = Math.round(heightMm * dotsPerMm);

  // Максимум, который физически влезает в этикетку
  const fitMaxMm = Math.min(widthMm, heightMm) - marginMm * 2;

  // Явный размер кода (квадрат) или «почти на всю этикетку»
  let targetSideMm = fitMaxMm;
  if (codeWidthMm != null || codeHeightMm != null) {
    const w = codeWidthMm ?? codeHeightMm ?? fitMaxMm;
    const h = codeHeightMm ?? codeWidthMm ?? fitMaxMm;
    targetSideMm = Math.min(w, h, fitMaxMm);
  }

  const maxCodeDots = Math.max(1, Math.floor(targetSideMm * dotsPerMm));
  const scale = Math.max(1, Math.floor(maxCodeDots / symbol.width));

  const codeWidthDots = symbol.width * scale;
  const codeHeightDots = symbol.height * scale;
  const widthBytes = Math.ceil(codeWidthDots / 8);
  const paddedWidthDots = widthBytes * 8;

  const basePosX = Math.floor((labelWidthDots - paddedWidthDots) / 2);
  const basePosY = Math.floor((labelHeightDots - codeHeightDots) / 2);
  const posX = Math.max(0, basePosX + Math.round(offsetXmm * dotsPerMm));
  const posY = Math.max(0, basePosY + Math.round(offsetYmm * dotsPerMm));

  const bitmapLength = widthBytes * codeHeightDots;
  const bitmapBuffer = new Uint8Array(bitmapLength).fill(0xff);

  for (let row = 0; row < symbol.height; row++) {
    for (let col = 0; col < symbol.width; col++) {
      const isBlack = symbol.data[row * symbol.width + col] === 0;
      if (!isBlack) continue;

      for (let dy = 0; dy < scale; dy++) {
        const py = row * scale + dy;
        const rowOffset = py * widthBytes;
        for (let dx = 0; dx < scale; dx++) {
          const px = col * scale + dx;
          const byteIdx = rowOffset + Math.floor(px / 8);
          const bitIdx = 7 - (px % 8);
          bitmapBuffer[byteIdx] &= ~(1 << bitIdx);
        }
      }
    }
  }

  const headerText =
    `SIZE ${widthMm} mm, ${heightMm} mm\r\n` +
    `GAP ${gapMm} mm, 0 mm\r\n` +
    `DIRECTION ${direction}\r\n` +
    `CLS\r\n` +
    `BITMAP ${posX},${posY},${widthBytes},${codeHeightDots},0,`;

  const footerText = `\r\nPRINT ${copies},1\r\n`;

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(headerText);
  const footerBytes = encoder.encode(footerText);

  const fullPayload = new Uint8Array(
    headerBytes.length + bitmapBuffer.length + footerBytes.length
  );
  fullPayload.set(headerBytes, 0);
  fullPayload.set(bitmapBuffer, headerBytes.length);
  fullPayload.set(footerBytes, headerBytes.length + bitmapBuffer.length);

  return {
    data: fullPayload,
    svg,
    matrixSize: { width: symbol.width, height: symbol.height },
    codeSizeMm: Number((codeWidthDots / dotsPerMm).toFixed(1)),
  };
}
