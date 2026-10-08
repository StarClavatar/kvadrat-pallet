/**
 * Легковесный IPP-клиент (RFC 8010) для CUPS без сторонних зависимостей.
 */

const IPP_VERSION_2_0 = 0x0200;
const OP_PRINT_JOB = 0x0002;
const OP_GET_PRINTER_ATTRIBUTES = 0x000b;

const TAG_OPERATION_ATTRIBUTES = 0x01;
const TAG_END_OF_ATTRIBUTES = 0x03;

const TAG_CHARSET = 0x47;
const TAG_NATURAL_LANGUAGE = 0x48;
const TAG_URI = 0x45;
const TAG_NAME = 0x42;
const TAG_MIME_TYPE = 0x49;

function createAttribute(tag: number, name: string, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name);
  const valBytes = encoder.encode(value);

  const buf = new Uint8Array(1 + 2 + nameBytes.length + 2 + valBytes.length);
  const view = new DataView(buf.buffer);

  let offset = 0;
  view.setUint8(offset++, tag);
  view.setUint16(offset, nameBytes.length);
  offset += 2;
  buf.set(nameBytes, offset);
  offset += nameBytes.length;
  view.setUint16(offset, valBytes.length);
  offset += 2;
  buf.set(valBytes, offset);

  return buf;
}

export function buildIppPrintJob(
  printerUri: string,
  rawDocument: Uint8Array,
  jobName: string = "datamatrix-20mm"
): Uint8Array {
  const header = new Uint8Array(9);
  const view = new DataView(header.buffer);
  view.setUint16(0, IPP_VERSION_2_0);
  view.setUint16(2, OP_PRINT_JOB);
  view.setUint32(4, 1);
  header[8] = TAG_OPERATION_ATTRIBUTES;

  const attrs = [
    createAttribute(TAG_CHARSET, "attributes-charset", "utf-8"),
    createAttribute(TAG_NATURAL_LANGUAGE, "attributes-natural-language", "ru"),
    createAttribute(TAG_URI, "printer-uri", printerUri),
    createAttribute(TAG_NAME, "requesting-user-name", "pwa"),
    createAttribute(TAG_NAME, "job-name", jobName),
    createAttribute(TAG_MIME_TYPE, "document-format", "application/vnd.cups-raw"),
    new Uint8Array([TAG_END_OF_ATTRIBUTES]),
  ];

  const totalAttrsLen = attrs.reduce((acc, a) => acc + a.length, 0);
  const packet = new Uint8Array(header.length + totalAttrsLen + rawDocument.length);
  packet.set(header, 0);

  let offset = header.length;
  for (const attr of attrs) {
    packet.set(attr, offset);
    offset += attr.length;
  }
  packet.set(rawDocument, offset);
  return packet;
}

export function buildIppGetPrinterAttributes(printerUri: string): Uint8Array {
  const header = new Uint8Array(9);
  const view = new DataView(header.buffer);
  view.setUint16(0, IPP_VERSION_2_0);
  view.setUint16(2, OP_GET_PRINTER_ATTRIBUTES);
  view.setUint32(4, 1);
  header[8] = TAG_OPERATION_ATTRIBUTES;

  const attrs = [
    createAttribute(TAG_CHARSET, "attributes-charset", "utf-8"),
    createAttribute(TAG_NATURAL_LANGUAGE, "attributes-natural-language", "ru"),
    createAttribute(TAG_URI, "printer-uri", printerUri),
    new Uint8Array([TAG_END_OF_ATTRIBUTES]),
  ];

  const totalAttrsLen = attrs.reduce((acc, a) => acc + a.length, 0);
  const packet = new Uint8Array(header.length + totalAttrsLen);
  packet.set(header, 0);

  let offset = header.length;
  for (const attr of attrs) {
    packet.set(attr, offset);
    offset += attr.length;
  }
  return packet;
}

export interface CupsPrintOptions {
  cupsUrl?: string;
  printerName?: string;
  rawDocument: Uint8Array;
  jobName?: string;
}

export interface CupsPrintResult {
  success: boolean;
  jobId?: number;
  statusCode?: number;
  error?: string;
}

export function getPrinterEndpoints(
  cupsUrl: string = "/cups",
  printerName: string = "TSC_TE310"
) {
  const cleanBase = cupsUrl.replace(/\/+$/, "");
  const httpUrl = `${cleanBase}/printers/${printerName}`;
  const ippUri = `ipp://ts4:631/printers/${printerName}`;
  return { httpUrl, ippUri };
}

export async function sendCupsPrintJob(
  options: CupsPrintOptions
): Promise<CupsPrintResult> {
  const {
    cupsUrl = "/cups",
    printerName = "TSC_TE310",
    rawDocument,
    jobName = "datamatrix-20mm",
  } = options;

  const { httpUrl, ippUri } = getPrinterEndpoints(cupsUrl, printerName);
  const packet = buildIppPrintJob(ippUri, rawDocument, jobName);

  try {
    const response = await fetch(httpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/ipp" },
      body: packet,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ошибка CUPS: ${response.status} ${response.statusText}`,
      };
    }

    const responseBuffer = await response.arrayBuffer();
    if (responseBuffer.byteLength < 4) {
      return { success: false, error: "CUPS вернул пустой ответ" };
    }

    const view = new DataView(responseBuffer);
    const ippStatus = view.getUint16(2);

    if (ippStatus === 0x0000 || ippStatus === 0x0001) {
      let jobId: number | undefined;
      try {
        const u8 = new Uint8Array(responseBuffer);
        const marker = new TextEncoder().encode("job-id");
        for (let i = 0; i <= u8.length - marker.length - 6; i++) {
          let match = true;
          for (let m = 0; m < marker.length; m++) {
            if (u8[i + m] !== marker[m]) {
              match = false;
              break;
            }
          }
          if (match && u8[i - 3] === 0x21) {
            jobId = view.getUint32(i + marker.length + 2);
            break;
          }
        }
      } catch {
        // jobId optional
      }

      return { success: true, statusCode: ippStatus, jobId };
    }

    return {
      success: false,
      statusCode: ippStatus,
      error: `Ошибка IPP: 0x${ippStatus.toString(16).padStart(4, "0")}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Сетевая ошибка при обращении к CUPS",
    };
  }
}

export async function checkCupsPrinter(
  cupsUrl: string = "/cups",
  printerName: string = "TSC_TE310"
): Promise<{ online: boolean; message: string }> {
  const { httpUrl, ippUri } = getPrinterEndpoints(cupsUrl, printerName);
  const packet = buildIppGetPrinterAttributes(ippUri);

  try {
    const response = await fetch(httpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/ipp" },
      body: packet,
    });

    if (!response.ok) {
      return { online: false, message: `CUPS ответил HTTP ${response.status}` };
    }

    const responseBuffer = await response.arrayBuffer();
    if (responseBuffer.byteLength >= 4) {
      const view = new DataView(responseBuffer);
      const ippStatus = view.getUint16(2);
      if (ippStatus === 0x0000) {
        return { online: true, message: "Принтер готов к печати" };
      }
    }

    return { online: true, message: "CUPS доступен" };
  } catch (err: any) {
    return {
      online: false,
      message: err?.message || "Нет связи с CUPS",
    };
  }
}
