import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BackspaceIcon from "../../assets/backspaceIcon";
import CameraScanner, {
  type CameraScannerHandle,
} from "../../components/CameraScanner/CameraScanner";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import { generateDatamatrixTspl, GeneratedTsplResult } from "../../utils/tspl";
import { sendCupsPrintJob, checkCupsPrinter } from "../../utils/cupsIpp";
import successSound from "../../assets/scanSuccess.mp3";
import styles from "./PrintDatamatrix.module.css";

interface PrinterSettings {
  cupsUrl: string;
  printerName: string;
  gapMm: number;
  autoPrint: boolean;
  offsetXmm: number;
  offsetYmm: number;
  direction: 0 | 1;
  /** Ширина DataMatrix в мм (этикетка при этом остаётся LABEL_* ) */
  codeWidthMm: number;
  /** Высота DataMatrix в мм (для квадрата = codeWidthMm) */
  codeHeightMm: number;
}

const SETTINGS_STORAGE_KEY = "datamatrix_printer_settings_v3";

/** Этикетка 58×40 мм — размер БУМАГИ для принтера (SIZE) */
const LABEL_WIDTH_MM = 58;
const LABEL_HEIGHT_MM = 40;

/**
 * Код для печати как есть (с криптохвостом 91/92/93).
 * Только нормализация: HRI `<GS>` → настоящий GS `\x1d`.
 */
function toPrintCode(raw: string): string {
  return raw.replace(/<GS>/gi, "\x1d").trim();
}

const DEFAULT_SETTINGS: PrinterSettings = {
  cupsUrl: "/cups",
  printerName: "TSC_TE310",
  gapMm: 2,
  autoPrint: true,
  offsetXmm: 0,
  offsetYmm: 0,
  direction: 0,
  // Размер КОДА на этикетке (не размер бумаги!)
  codeWidthMm: 20,
  codeHeightMm: 20,
};

export const PrintDatamatrix: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<CameraScannerHandle>(null);
  const successAudio = useMemo(() => new Audio(successSound), []);

  const [settings, setSettings] = useState<PrinterSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [editSettings, setEditSettings] = useState<PrinterSettings>(settings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [scannedCode, setScannedCode] = useState<string>("");
  const [svgPreview, setSvgPreview] = useState<string>("");
  const [tsplResult, setTsplResult] = useState<GeneratedTsplResult | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "printing";
    text: string;
  } | null>(null);
  const [printerOnline, setPrinterOnline] = useState<boolean>(true);

  const handleSaveSettings = () => {
    setSettings(editSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(editSettings));
    setIsSettingsOpen(false);
    verifyPrinter(editSettings.cupsUrl, editSettings.printerName);
  };

  const verifyPrinter = useCallback(
    async (cupsUrl?: string, printerName?: string) => {
      const url = cupsUrl || settings.cupsUrl;
      const name = printerName || settings.printerName;
      const res = await checkCupsPrinter(url, name);
      setPrinterOnline(res.online);
    },
    [settings.cupsUrl, settings.printerName]
  );

  useEffect(() => {
    verifyPrinter();
  }, [verifyPrinter]);

  const handlePrint = useCallback(
    async (codeToPrint?: string, printCopies?: number) => {
      const code = toPrintCode(codeToPrint || scannedCode);
      const numCopies = printCopies ?? copies;
      if (!code || isPrinting) return;

      // На экране всегда то же, что уходит в принтер
      setScannedCode(code);

      setIsPrinting(true);
      setStatusMessage({ type: "printing", text: "Отправка на принтер TSC TE310..." });

      try {
        const genResult = await generateDatamatrixTspl(code, {
          widthMm: LABEL_WIDTH_MM,
          heightMm: LABEL_HEIGHT_MM,
          dpi: 300,
          gapMm: settings.gapMm,
          copies: numCopies,
          offsetXmm: settings.offsetXmm,
          offsetYmm: settings.offsetYmm,
          direction: settings.direction,
          codeWidthMm: settings.codeWidthMm,
          codeHeightMm: settings.codeHeightMm,
        });
        setTsplResult(genResult);
        setSvgPreview(genResult.svg);

        const res = await sendCupsPrintJob({
          cupsUrl: settings.cupsUrl,
          printerName: settings.printerName,
          rawDocument: genResult.data,
          jobName: `dmatrix-58x40-${Date.now()}`,
        });

        if (res.success) {
          setPrinterOnline(true);
          setStatusMessage({
            type: "success",
            text: `Напечатано: ${numCopies} ${numCopies === 1 ? "этикетка" : "этикетки"}${
              res.jobId ? ` (задание #${res.jobId})` : ""
            }`,
          });
        } else {
          setStatusMessage({
            type: "error",
            text: `Ошибка печати: ${res.error || "Неизвестная ошибка"}`,
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: `Ошибка формирования: ${err?.message || "Ошибка генерации"}`,
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [
      scannedCode,
      copies,
      isPrinting,
      settings.gapMm,
      settings.cupsUrl,
      settings.printerName,
      settings.offsetXmm,
      settings.offsetYmm,
      settings.direction,
      settings.codeWidthMm,
      settings.codeHeightMm,
    ]
  );

  const processScannedCode = useCallback(
    async (rawCode: string) => {
      if (!rawCode || !rawCode.trim()) return;

      // Один и тот же payload: экран = SVG-превью = печать
      const code = toPrintCode(rawCode);
      if (!code) return;

      successAudio.play().catch(() => {});
      setScannedCode(code);
      setStatusMessage(null);

      try {
        const res = await generateDatamatrixTspl(code, {
          widthMm: LABEL_WIDTH_MM,
          heightMm: LABEL_HEIGHT_MM,
          dpi: 300,
          gapMm: settings.gapMm,
          copies: 1,
          offsetXmm: settings.offsetXmm,
          offsetYmm: settings.offsetYmm,
          direction: settings.direction,
          codeWidthMm: settings.codeWidthMm,
          codeHeightMm: settings.codeHeightMm,
        });
        setTsplResult(res);
        setSvgPreview(res.svg);

        if (settings.autoPrint) {
          handlePrint(code, copies);
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: `Ошибка ZXing: ${err?.message}`,
        });
      }
    },
    [
      handlePrint,
      copies,
      settings.autoPrint,
      settings.gapMm,
      settings.offsetXmm,
      settings.offsetYmm,
      settings.direction,
      settings.codeWidthMm,
      settings.codeHeightMm,
      successAudio,
    ]
  );

  useCustomScanner((code) => {
    processScannedCode(code);
  }, true);

  const handleCameraScan = (codes: string[]) => {
    if (codes && codes.length > 0) {
      processScannedCode(codes[0]);
    }
  };

  const renderFormattedCode = (code: string) => {
    if (!code) return null;
    const parts = code.split("\x1d");
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {index > 0 && <span className={styles.gsSymbol}>&lt;GS&gt;</span>}
        <span>{part}</span>
      </React.Fragment>
    ));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/workmode")}
            aria-label="Назад"
          >
            <BackspaceIcon color="#ffffff" />
          </button>
          <h1 className={styles.title}>Печать DataMatrix</h1>
        </div>

        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => {
            setEditSettings(settings);
            setIsSettingsOpen(true);
          }}
          aria-label="Настройки принтера"
        >
          ⚙️
        </button>
      </header>

      <main className={styles.content}>
        <div className={styles.printerBar}>
          <div className={styles.printerInfo}>
            <span
              className={`${styles.statusIndicator} ${
                !printerOnline ? styles.statusIndicatorOffline : ""
              }`}
            />
            <span>TSC TE310 (192.168.79.133)</span>
          </div>
          <span className={styles.printerMeta}>
            {LABEL_WIDTH_MM}×{LABEL_HEIGHT_MM} мм • {printerOnline ? "Готов" : "Нет связи"}
          </span>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.labelContainer}>
            <span className={styles.labelBadge}>
              {LABEL_WIDTH_MM}×{LABEL_HEIGHT_MM} мм
            </span>
            <div className={styles.labelPreview}>
              {svgPreview ? (
                <div
                  className={styles.barcodeSvgWrapper}
                  dangerouslySetInnerHTML={{ __html: svgPreview }}
                />
              ) : (
                <div className={styles.placeholderText}>
                  Отсканируйте код лазером ТСД или камерой
                </div>
              )}
            </div>
          </div>

          {scannedCode && (
            <div className={styles.codeDetailsCard}>
              <div className={styles.codeMetaRow} style={{ marginTop: 0, marginBottom: 4 }}>
                <span>В печать (как на этикетке):</span>
              </div>
              <div className={styles.codeText}>{renderFormattedCode(scannedCode)}</div>
              <div className={styles.codeMetaRow}>
                <span>Длина: {scannedCode.length} симв.</span>
                {tsplResult && (
                  <span>
                    Матрица: {tsplResult.matrixSize.width}×{tsplResult.matrixSize.height} (~
                    {tsplResult.codeSizeMm} мм)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {statusMessage && (
          <div
            className={`${styles.statusMessage} ${
              statusMessage.type === "success"
                ? styles.statusSuccess
                : statusMessage.type === "error"
                ? styles.statusError
                : styles.statusPrinting
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className={styles.optionsRow}>
          <div className={styles.copiesControl}>
            <span>Копии:</span>
            <button
              type="button"
              className={styles.copiesButton}
              onClick={() => setCopies((c) => Math.max(1, c - 1))}
              disabled={copies <= 1}
            >
              -
            </button>
            <span className={styles.copiesValue}>{copies}</span>
            <button
              type="button"
              className={styles.copiesButton}
              onClick={() => setCopies((c) => Math.min(99, c + 1))}
            >
              +
            </button>
          </div>

          <label className={styles.autoPrintToggle}>
            <input
              type="checkbox"
              checked={settings.autoPrint}
              onChange={(e) => {
                const nextSettings = { ...settings, autoPrint: e.target.checked };
                setSettings(nextSettings);
                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
              }}
            />
            <span>при скане</span>
          </label>
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.scanCameraBtn}
          onClick={() => scannerRef.current?.open()}
        >
          📷 Камера
        </button>

        <button
          type="button"
          className={styles.printBtn}
          onClick={() => handlePrint()}
          disabled={!scannedCode || isPrinting}
        >
          🖨️ {isPrinting ? "Печать..." : "Печать"}
        </button>
      </footer>

      {/* className скрывает только кнопку; модалка камеры остаётся видимой */}
      <CameraScanner
        ref={scannerRef}
        onScan={handleCameraScan}
        formats={["DataMatrix"]}
        closeOnScan={true}
        rawOutput={true}
        forceZXing={true}
        fullscreen={true}
        className={styles.hiddenScanButton}
      />

      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Параметры печати</h3>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Размер кода (мм) — этикетка остаётся {LABEL_WIDTH_MM}×{LABEL_HEIGHT_MM}
              </label>
              <div className={styles.offsetRow}>
                <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Шир.</span>
                <input
                  type="number"
                  step="1"
                  min={5}
                  max={Math.min(LABEL_WIDTH_MM, LABEL_HEIGHT_MM)}
                  className={styles.formInput}
                  style={{ flex: 1, textAlign: "center" }}
                  value={editSettings.codeWidthMm}
                  onChange={(e) => {
                    const v = Math.max(5, Number(e.target.value) || 5);
                    setEditSettings({
                      ...editSettings,
                      codeWidthMm: v,
                      codeHeightMm: v, // DataMatrix — квадрат
                    });
                  }}
                />
                <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Выс.</span>
                <input
                  type="number"
                  step="1"
                  min={5}
                  max={Math.min(LABEL_WIDTH_MM, LABEL_HEIGHT_MM)}
                  className={styles.formInput}
                  style={{ flex: 1, textAlign: "center" }}
                  value={editSettings.codeHeightMm}
                  onChange={(e) => {
                    const v = Math.max(5, Number(e.target.value) || 5);
                    setEditSettings({
                      ...editSettings,
                      codeWidthMm: v,
                      codeHeightMm: v,
                    });
                  }}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Смещение по X (мм) [+ вправо / - влево]</label>
              <div className={styles.offsetRow}>
                <button
                  type="button"
                  className={styles.offsetBtn}
                  onClick={() =>
                    setEditSettings((s) => ({
                      ...s,
                      offsetXmm: Number((s.offsetXmm - 0.5).toFixed(1)),
                    }))
                  }
                >
                  -0.5
                </button>
                <input
                  type="number"
                  step="0.1"
                  className={styles.formInput}
                  style={{ flex: 1, textAlign: "center" }}
                  value={editSettings.offsetXmm}
                  onChange={(e) =>
                    setEditSettings({ ...editSettings, offsetXmm: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  className={styles.offsetBtn}
                  onClick={() =>
                    setEditSettings((s) => ({
                      ...s,
                      offsetXmm: Number((s.offsetXmm + 0.5).toFixed(1)),
                    }))
                  }
                >
                  +0.5
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Смещение по Y (мм) [+ вниз / - вверх]</label>
              <div className={styles.offsetRow}>
                <button
                  type="button"
                  className={styles.offsetBtn}
                  onClick={() =>
                    setEditSettings((s) => ({
                      ...s,
                      offsetYmm: Number((s.offsetYmm - 0.5).toFixed(1)),
                    }))
                  }
                >
                  -0.5
                </button>
                <input
                  type="number"
                  step="0.1"
                  className={styles.formInput}
                  style={{ flex: 1, textAlign: "center" }}
                  value={editSettings.offsetYmm}
                  onChange={(e) =>
                    setEditSettings({ ...editSettings, offsetYmm: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  className={styles.offsetBtn}
                  onClick={() =>
                    setEditSettings((s) => ({
                      ...s,
                      offsetYmm: Number((s.offsetYmm + 0.5).toFixed(1)),
                    }))
                  }
                >
                  +0.5
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Направление подачи (DIRECTION)</label>
              <select
                className={styles.formInput}
                value={editSettings.direction}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    direction: Number(e.target.value) as 0 | 1,
                  })
                }
              >
                <option value={0}>0 — Прямое (по умолчанию)</option>
                <option value={1}>1 — Поворот 180°</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Зазор между этикетками (GAP в мм)</label>
              <input
                type="number"
                className={styles.formInput}
                value={editSettings.gapMm}
                onChange={(e) =>
                  setEditSettings({
                    ...editSettings,
                    gapMm: Math.max(0, Number(e.target.value)),
                  })
                }
                min={0}
                max={10}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>CUPS Сервер (URL или прокси)</label>
              <input
                className={styles.formInput}
                value={editSettings.cupsUrl}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, cupsUrl: e.target.value })
                }
                placeholder="/cups или https://ts4:631"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Имя принтера в CUPS</label>
              <input
                className={styles.formInput}
                value={editSettings.printerName}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, printerName: e.target.value })
                }
                placeholder="TSC_TE310"
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsSettingsOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.modalSaveBtn}
                onClick={handleSaveSettings}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintDatamatrix;
