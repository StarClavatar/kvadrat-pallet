import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraScanner, {
  type CameraScannerHandle,
} from "../../components/CameraScanner/CameraScanner";
import Popup from "../../components/Popup/Popup";
import BackspaceIcon from "../../assets/backspaceIcon";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import { PinContext } from "../../context/PinAuthContext";
import { postRefundGoods } from "../../api/refundGoods";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import styles from "./MassMarkingScan.module.css";

const STORAGE_KEY = "mass-marking-dm-codes-v2";
const LEGACY_STORAGE_KEY = "mass-marking-dm-codes-v1";

/** Макс. кодов в модалке (остальное не рендерим, чтобы не повесить UI). */
const MAX_CODES_IN_MODAL = 2000;

/** Защита от сотен коробок в localStorage / по памяти. */
const MAX_BOXES = 50;

function capBoxesToLimit(list: ScanBox[]): ScanBox[] {
  if (list.length <= MAX_BOXES) return list;
  return list.slice(0, MAX_BOXES).map((b, i) => ({
    ...b,
    name: newBoxName(i + 1),
  }));
}

/**
 * Вторая и следующие коробки — только если последняя уже не пустая
 * (иначе накликивают десятки пустых). Первую «вторую» разрешаем всегда.
 */
function canAddMoreBox(list: ScanBox[]): boolean {
  if (list.length >= MAX_BOXES) return false;
  if (list.length <= 1) return true;
  const last = list[list.length - 1];
  return last.codes.length > 0;
}

export type ScanBox = {
  id: string;
  name: string;
  codes: string[];
};

type ReturnInfo = {
  returnDate: string;
  returnDescription: string;
  returnNumber: string;
};

type StoredMassMarkingData = {
  boxes?: ScanBox[];
  activeBoxId?: string;
  returnInfo?: Partial<ReturnInfo>;
  guidDoc?: string | null;
};

function newBoxName(index: number) {
  return `Коробка ${index}`;
}

function createBox(index: number): ScanBox {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `box-${Date.now()}-${Math.random()}`,
    name: newBoxName(index),
    codes: []
  };
}

function extractBoxNumber(name: string): number | null {
  const m = name.match(/Коробка\s+(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function nextFreeBoxNumber(list: ScanBox[]): number {
  const used = new Set<number>();
  for (const b of list) {
    const n = extractBoxNumber(b.name);
    if (n !== null) used.add(n);
  }
  let candidate = 1;
  while (used.has(candidate)) candidate += 1;
  return candidate;
}

function codesCountLabel(n: number) {
  if (n === 0) return "нет кодов";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} код`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} кода`;
  return `${n} кодов`;
}

/** Как в CameraScanner + убираем все управляющие символы — иначе дубли с разным GS. */
function normalizeCode(text: string) {
  let s = text.replace(/[\x00-\x1F\x7F]+/g, "").trim();
  s = s.replace(/\((00|01|21|93)\)/g, "$1");
  return s;
}

function dedupeCodeList(codes: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of codes) {
    const k = normalizeCode(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/** Ключи кодов, уже лежащих в других коробках (не в `exceptBoxId`). */
function keysInOtherBoxes(boxes: ScanBox[], exceptBoxId: string) {
  const keys = new Set<string>();
  for (const b of boxes) {
    if (b.id === exceptBoxId) continue;
    for (const c of b.codes) {
      const k = normalizeCode(c);
      if (k) keys.add(k);
    }
  }
  return keys;
}

type AddCodesOutcome = "noop" | "duplicate" | "added";

function addCodesToActiveScanBox(
  prev: ScanBox[],
  activeBoxId: string,
  results: string[]
): { outcome: AddCodesOutcome; next: ScanBox[] } {
  const batch = dedupeCodeList(results);
  if (batch.length === 0) return { outcome: "noop", next: prev };

  const idx = prev.findIndex((b) => b.id === activeBoxId);
  if (idx < 0) return { outcome: "noop", next: prev };

  const takenElsewhere = keysInOtherBoxes(prev, activeBoxId);
  const batchNew = batch.filter((c) => !takenElsewhere.has(normalizeCode(c)));
  if (batchNew.length === 0) return { outcome: "duplicate", next: prev };

  const box = prev[idx];
  const base = dedupeCodeList(box.codes);
  const merged = dedupeCodeList([...base, ...batchNew]);
  if (merged.length === base.length) return { outcome: "duplicate", next: prev };

  const next = [...prev];
  next[idx] = { ...box, codes: merged };
  return { outcome: "added", next };
}

const MassMarkingScan = () => {
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();
  const firstBoxIdRef = useRef<string | null>(null);
  const [boxes, setBoxes] = useState<ScanBox[]>(() => {
    const b = createBox(1);
    firstBoxIdRef.current = b.id;
    return [b];
  });
  const [activeBoxId, setActiveBoxId] = useState(() => firstBoxIdRef.current!);
  /** Длина кодов активной коробки в момент открытия камеры (счётчик «Добавлено» = сейчас − это). */
  const [scanSessionStartLen, setScanSessionStartLen] = useState<number | null>(null);
  const [codesModalBoxId, setCodesModalBoxId] = useState<string | null>(null);
  /** Нормализованный код, найденный сканом для удаления из открытой коробки. */
  const [highlightedDeleteCode, setHighlightedDeleteCode] = useState<string | null>(null);
  const [deleteScanError, setDeleteScanError] = useState<string | null>(null);
  const highlightedCodeRef = useRef<HTMLLIElement | null>(null);
  const scannerRef = useRef<CameraScannerHandle>(null);
  /** undefined = еще загружаем из localStorage, null = данных нет, object = данные есть */
  const [returnInfo, setReturnInfo] = useState<ReturnInfo | null | undefined>(undefined);
  const [isReturnPopupOpen, setIsReturnPopupOpen] = useState(false);
  const [submitDescriptionError, setSubmitDescriptionError] = useState(false);
  const [returnDraft, setReturnDraft] = useState<ReturnInfo>({
    returnDate: "",
    returnDescription: "",
    returnNumber: "",
  });
  const [submitSuccessText, setSubmitSuccessText] = useState<string | null>(null);
  const [submitErrorText, setSubmitErrorText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guidDoc, setGuidDoc] = useState<string | null>(null);

  const successAudio = useMemo(() => new Audio(successSound), []);
  const errorAudio = useMemo(() => new Audio(errorSound), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredMassMarkingData;
        if (parsed?.boxes && Array.isArray(parsed.boxes) && parsed.boxes.length > 0) {
          const cleaned = capBoxesToLimit(
            parsed.boxes.map((b, i) => ({
              id: typeof b.id === "string" ? b.id : `box-${i}`,
              name: typeof b.name === "string" && b.name ? b.name : newBoxName(i + 1),
              codes: Array.isArray(b.codes)
                ? dedupeCodeList(
                    b.codes.filter((c): c is string => typeof c === "string")
                  )
                : []
            }))
          );
          setBoxes(cleaned);
          const aid = parsed.activeBoxId;
          setActiveBoxId(
            aid && cleaned.some((b) => b.id === aid) ? aid : cleaned[0].id
          );
          setGuidDoc(typeof parsed.guidDoc === "string" ? parsed.guidDoc : null);

          const savedReturnInfo = parsed.returnInfo;
          if (
            savedReturnInfo &&
            typeof savedReturnInfo.returnDate === "string" &&
            typeof savedReturnInfo.returnDescription === "string" &&
            typeof savedReturnInfo.returnNumber === "string" &&
            savedReturnInfo.returnDate &&
            savedReturnInfo.returnDescription.trim() &&
            savedReturnInfo.returnNumber.trim()
          ) {
            const normalized: ReturnInfo = {
              returnDate: savedReturnInfo.returnDate,
              returnDescription: savedReturnInfo.returnDescription.trim(),
              returnNumber: savedReturnInfo.returnNumber.trim(),
            };
            setReturnInfo(normalized);
            setReturnDraft(normalized);
          } else {
            setReturnInfo(null);
          }
          return;
        }
      }

      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          const codes = dedupeCodeList(
            parsed.filter((item): item is string => typeof item === "string")
          );
          const b = createBox(1);
          b.codes = codes;
          setBoxes([b]);
          setActiveBoxId(b.id);
        }
      }
      setReturnInfo(null);
    } catch (error) {
      console.error("Failed to restore boxes:", error);
      setReturnInfo(null);
    }
  }, []);

  useEffect(() => {
    if (boxes.length === 0) return;
    if (!boxes.some((b) => b.id === activeBoxId)) {
      setActiveBoxId(boxes[0].id);
    }
  }, [boxes, activeBoxId]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ boxes, activeBoxId, returnInfo, guidDoc })
    );
  }, [boxes, activeBoxId, returnInfo, guidDoc]);

  const activeBox = useMemo(
    () => boxes.find((b) => b.id === activeBoxId) ?? boxes[0],
    [boxes, activeBoxId]
  );

  const totalCodes = useMemo(
    () => boxes.reduce((n, b) => n + b.codes.length, 0),
    [boxes]
  );
  const isSubmitDisabled = !returnInfo || totalCodes === 0 || isSubmitting;

  /** Все коды по всем коробкам — для подсветки «уже есть» в камере. */
  const allCodesFlat = useMemo(
    () => dedupeCodeList(boxes.flatMap((b) => b.codes)),
    [boxes]
  );

  const handleLiveScan = useCallback(
    (results: string[]) => {
      let playSuccess = false;
      let playError = false;
      setBoxes((prev) => {
        const r = addCodesToActiveScanBox(prev, activeBoxId, results);
        if (r.outcome === "added") {
          playSuccess = true;
          return r.next;
        }
        if (r.outcome === "duplicate") playError = true;
        return prev;
      });
      if (playSuccess) void successAudio.play().catch(() => {});
      else if (playError) void errorAudio.play().catch(() => {});
    },
    [activeBoxId, successAudio, errorAudio]
  );

  const codesModalBox = useMemo(
    () => (codesModalBoxId ? boxes.find((b) => b.id === codesModalBoxId) : undefined),
    [boxes, codesModalBoxId]
  );

  const clearDeleteSelection = useCallback(() => {
    setHighlightedDeleteCode(null);
    setDeleteScanError(null);
  }, []);

  const handleDeleteScan = useCallback(
    (rawSymbol: string) => {
      if (!codesModalBoxId || !codesModalBox) {
        setDeleteScanError("Сначала откройте коробку.");
        void errorAudio.play().catch(() => {});
        return;
      }

      const code = normalizeCode(rawSymbol);
      if (!code) {
        setDeleteScanError("Пустой или некорректный код.");
        setHighlightedDeleteCode(null);
        void errorAudio.play().catch(() => {});
        return;
      }

      const inThisBox = codesModalBox.codes.find((c) => normalizeCode(c) === code);
      if (inThisBox) {
        setDeleteScanError(null);
        setHighlightedDeleteCode(normalizeCode(inThisBox));
        void successAudio.play().catch(() => {});
        return;
      }

      const otherBox = boxes.find(
        (b) =>
          b.id !== codesModalBoxId &&
          b.codes.some((c) => normalizeCode(c) === code)
      );
      setHighlightedDeleteCode(null);
      if (otherBox) {
        setDeleteScanError(`Код есть, но в другой коробке: ${otherBox.name}.`);
      } else {
        setDeleteScanError("Этого кода нет среди отсканированных.");
      }
      void errorAudio.play().catch(() => {});
    },
    [boxes, codesModalBox, codesModalBoxId, errorAudio, successAudio]
  );

  const confirmDeleteHighlightedCode = useCallback(() => {
    if (!codesModalBoxId || !highlightedDeleteCode) return;
    const key = normalizeCode(highlightedDeleteCode);
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== codesModalBoxId) return b;
        return {
          ...b,
          codes: b.codes.filter((c) => normalizeCode(c) !== key),
        };
      })
    );
    clearDeleteSelection();
    void successAudio.play().catch(() => {});
  }, [clearDeleteSelection, codesModalBoxId, highlightedDeleteCode, successAudio]);

  const handleHardwareScan = useCallback(
    (symbol: string) => {
      if (codesModalBoxId) {
        handleDeleteScan(symbol);
        return;
      }
      handleLiveScan([symbol]);
    },
    [codesModalBoxId, handleDeleteScan, handleLiveScan]
  );

  const hardwareScannerEnabled =
    returnInfo != null &&
    !isReturnPopupOpen &&
    !isSubmitting &&
    !submitSuccessText &&
    !submitErrorText;

  useCustomScanner(handleHardwareScan, hardwareScannerEnabled);

  const sessionAddedCount = useMemo(() => {
    if (scanSessionStartLen === null) return undefined;
    return Math.max(0, activeBox.codes.length - scanSessionStartLen);
  }, [activeBox.codes.length, scanSessionStartLen]);

  const modalCodes = useMemo(() => {
    if (!codesModalBox) return [];
    const raw = codesModalBox.codes;
    const tail = raw.length > MAX_CODES_IN_MODAL ? raw.slice(-MAX_CODES_IN_MODAL) : raw;
    const list = [...tail].reverse();
    if (!highlightedDeleteCode) return list;
    const key = normalizeCode(highlightedDeleteCode);
    if (list.some((c) => normalizeCode(c) === key)) return list;
    // Код есть в коробке, но вне «хвоста» модалки — всё равно показываем для рамки.
    return [highlightedDeleteCode, ...list];
  }, [codesModalBox, highlightedDeleteCode]);

  useEffect(() => {
    if (!highlightedDeleteCode || !highlightedCodeRef.current) return;
    highlightedCodeRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [highlightedDeleteCode, modalCodes]);

  const handleScannerOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        const len =
          boxes.find((b) => b.id === activeBoxId)?.codes.length ?? 0;
        setScanSessionStartLen(len);
      } else {
        setScanSessionStartLen(null);
      }
    },
    [boxes, activeBoxId]
  );

  const addBox = () => {
    setBoxes((prev) => {
      if (!canAddMoreBox(prev)) return prev;
      const b = createBox(nextFreeBoxNumber(prev));
      setActiveBoxId(b.id);
      queueMicrotask(() => scannerRef.current?.open());
      return [...prev, b];
    });
  };

  const canAddBox = useMemo(() => canAddMoreBox(boxes), [boxes]);

  const addBoxDisabledTitle = useMemo(() => {
    if (canAddBox) return "Добавить коробку";
    if (boxes.length >= MAX_BOXES) return `Не больше ${MAX_BOXES} коробок`;
    return "Сначала отсканируйте хотя бы один код в последнюю коробку";
  }, [canAddBox, boxes.length]);

  const removeBox = (id: string) => {
    setBoxes((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== id);
    });
  };

  const clearAll = () => {
    if (
      !window.confirm(
        "Очистить все коробки и все отсканированные коды? Это действие нельзя отменить."
      )
    ) {
      return;
    }
    setCodesModalBoxId(null);
    const b = createBox(1);
    setBoxes([b]);
    setActiveBoxId(b.id);
    setGuidDoc(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  useEffect(() => {
    if (codesModalBoxId && !boxes.some((b) => b.id === codesModalBoxId)) {
      setCodesModalBoxId(null);
      clearDeleteSelection();
    }
  }, [boxes, codesModalBoxId, clearDeleteSelection]);

  useEffect(() => {
    clearDeleteSelection();
  }, [codesModalBoxId, clearDeleteSelection]);

  const canSubmitReturnDraft = useMemo(() => {
    return (
      returnDraft.returnDate.trim().length > 0 &&
      returnDraft.returnDescription.trim().length > 0 &&
      returnDraft.returnNumber.trim().length > 0
    );
  }, [returnDraft]);

  const saveReturnInfo = () => {
    if (!canSubmitReturnDraft) return;
    setReturnInfo({
      returnDate: returnDraft.returnDate.trim(),
      returnDescription: returnDraft.returnDescription.trim(),
      returnNumber: returnDraft.returnNumber.trim(),
    });
    setSubmitDescriptionError(false);
    setIsReturnPopupOpen(false);
  };

  const returnInfoShortText = useMemo(() => {
    if (!returnInfo || returnInfo === undefined) return "";
    return returnInfo.returnDescription;
  }, [returnInfo]);

  const submitDraft = async () => {
    if (!returnInfo) return;
    const description = returnInfo.returnDescription.trim();
    if (!description) {
      setSubmitDescriptionError(true);
      setReturnDraft((prev) => ({
        ...prev,
        returnDescription: returnInfo.returnDescription,
      }));
      setIsReturnPopupOpen(true);
      return;
    }
    if (!window.confirm("Отправить данные возврата и коды?")) return;

    const nonEmptyBoxes = boxes.filter((box) => box.codes.length > 0);
    const payload = {
      pinCode: String(pinAuthData?.pinCode),
      tsdUUID: String(pinAuthData?.tsdUUID),
      returnDate: returnInfo.returnDate,
      returnDescription: description,
      returnNumber: returnInfo.returnNumber,
      boxes: nonEmptyBoxes.reduce<Record<string, string[]>>((acc, box, index) => {
        acc[`box${index + 1}`] = [...box.codes];
        return acc;
      }, {}),
    };

    setIsSubmitting(true);
    try {
      const response = await postRefundGoods(
        payload.pinCode,
        payload.tsdUUID,
        payload.returnDate,
        payload.returnDescription,
        payload.returnNumber,
        payload.boxes,
        guidDoc
      ) as { error?: string; info?: string; infotype?: string };

      if (!response.error?.trim()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        setSubmitSuccessText(
          response.info?.trim() || "Данные возврата успешно отправлены."
        );
      } else {
        setSubmitErrorText(
          response.error.trim() || response.info?.trim() || "Ошибка запроса"
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Сеть недоступна";
      setSubmitErrorText(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessCloseAndExit = useCallback(() => {
    setSubmitSuccessText(null);
    navigate("/workmode");
  }, [navigate]);

  return (
    <>
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/workmode")}
          aria-label="Назад в режим работы"
        >
          <BackspaceIcon color="#ffffff" />
        </button>
        <h1 className={styles.title}>Массовое сканирование</h1>
        <div className={styles.counter} title="Всего кодов">
          {totalCodes}
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.topBar} aria-label="Действия">
          {returnInfo && (
            <button
              type="button"
              className={`${styles.returnInfoCard} ${styles.returnInfoCardButton} ${submitDescriptionError ? styles.returnInfoCardError : ""}`}
              title={`${returnInfo.returnDate} | ${returnInfo.returnNumber} | ${returnInfo.returnDescription}`}
              onClick={() => {
                setReturnDraft(returnInfo);
                setSubmitDescriptionError(false);
                setIsReturnPopupOpen(true);
              }}
            >
              <div className={styles.returnInfoMeta}>
                <span className={styles.returnInfoTag}>{returnInfo.returnDate}</span>
                <span className={styles.returnInfoTag}>{returnInfo.returnNumber}</span>
              </div>
              <p className={styles.returnInfoShort}>{returnInfoShortText}</p>
            </button>
          )}
          <button type="button" className={styles.clearButton} onClick={clearAll}>
            Очистить всё
          </button>
        </section>

        <section className={styles.boxListSection} aria-label="Коробки">
          <div className={styles.boxListScroll}>
            <ul className={styles.boxList}>
              {boxes.map((b) => {
                const isActive = b.id === activeBoxId;
                const n = b.codes.length;
                const countLabel = codesCountLabel(n);
                return (
                  <li key={b.id} className={styles.boxListItem}>
                    <div
                      className={`${styles.boxCard} ${isActive ? styles.boxCardActive : ""}`}
                    >
                      <button
                        type="button"
                        className={styles.boxCardSelect}
                        onClick={() => setActiveBoxId(b.id)}
                        aria-pressed={isActive}
                      >
                        <span className={styles.boxCardName}>{b.name}</span>
                        <span className={styles.boxCardHint}>
                          {isActive ? "сканирование сюда" : "нажмите, чтобы выбрать"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.boxCardCodesBtn}
                        onClick={() => setCodesModalBoxId(b.id)}
                        disabled={n === 0}
                      >
                        {countLabel}
                      </button>
                      {boxes.length > 1 && (
                        <button
                          type="button"
                          className={styles.boxDelete}
                          aria-label={`Удалить ${b.name}`}
                          onClick={() => removeBox(b.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className={styles.boxToolbar}>
              <button
                type="button"
                className={styles.addBoxButton}
                onClick={addBox}
                disabled={!canAddBox}
                title={addBoxDisabledTitle}
              >
                + Коробка
              </button>
            </div>
          </div>
        </section>
      </main>
      <div className={styles.scanDock}>
        <CameraScanner
          ref={scannerRef}
          forceZXing
          muteDetectorSuccessSound
          onScan={handleLiveScan}
          className={`${styles.scanButton} ${styles.scanButtonDock}`}
          textButton="Сканировать"
          buttonHeight={44}
          iconWidth={22}
          iconHeight={22}
          formats={["DataMatrix"]}
          closeOnScan={false}
          existingCodes={allCodesFlat}
          fullscreen={true}
          modalSessionCount={sessionAddedCount}
          onModalOpenChange={handleScannerOpenChange}
        />
        <button
          type="button"
          className={styles.submitButton}
          onClick={() => submitDraft()}
          disabled={isSubmitDisabled}
          aria-label="Отправить данные"
        >
          {isSubmitting ? (
            <span className={styles.submitLoader} aria-hidden="true" />
          ) : (
            <svg
              className={styles.submitIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </div>
    </div>

    <Popup
      title="Данные возврата"
      isOpen={returnInfo === null || isReturnPopupOpen}
      onClose={() => {
        if (returnInfo) setIsReturnPopupOpen(false);
      }}
      containerClassName="popup_massMarkingReturn"
    >
      <div className={styles.returnModalInner}>
        <label className={styles.returnField}>
          <span className={styles.returnFieldLabel}>Дата возврата</span>
          <input
            type="date"
            className={styles.returnInput}
            value={returnDraft.returnDate}
            onChange={(e) =>
              setReturnDraft((prev) => ({ ...prev, returnDate: e.target.value }))
            }
          />
        </label>

        <label className={styles.returnField}>
          <span className={styles.returnFieldLabel}>Что за возврат</span>
          <input
            type="text"
            className={styles.returnInput}
            placeholder="Например: возврат от клиента"
            value={returnDraft.returnDescription}
            onChange={(e) =>
              setReturnDraft((prev) => ({
                ...prev,
                returnDescription: e.target.value,
              }))
            }
            onFocus={() => setSubmitDescriptionError(false)}
            aria-invalid={submitDescriptionError}
            style={submitDescriptionError ? { borderColor: "#dc2626" } : undefined}
          />
          {submitDescriptionError && (
            <span className={styles.returnFieldError}>Заполните описание возврата</span>
          )}
        </label>

        <label className={styles.returnField}>
          <span className={styles.returnFieldLabel}>Номер возврата</span>
          <input
            type="text"
            className={styles.returnInput}
            placeholder="Например: RV-2026-00421"
            value={returnDraft.returnNumber}
            onChange={(e) =>
              setReturnDraft((prev) => ({ ...prev, returnNumber: e.target.value }))
            }
          />
        </label>

        <button
          type="button"
          className={styles.returnSubmit}
          onClick={saveReturnInfo}
          disabled={!canSubmitReturnDraft}
        >
          {returnInfo ? "Сохранить" : "Продолжить"}
        </button>
      </div>
    </Popup>

    <Popup
      title={codesModalBox ? `Коды: ${codesModalBox.name}` : "Коды"}
      isOpen={codesModalBoxId !== null}
      onClose={() => {
        clearDeleteSelection();
        setCodesModalBoxId(null);
      }}
      containerClassName="popup_massMarkingCodes"
    >
      <div className={styles.codesModalInner}>
        {codesModalBox && codesModalBox.codes.length > MAX_CODES_IN_MODAL && (
          <p className={styles.codesModalNote}>
            Показаны последние {MAX_CODES_IN_MODAL} из {codesModalBox.codes.length}.
          </p>
        )}
        {modalCodes.length === 0 ? (
          <p className={styles.codesModalEmpty}>В этой коробке пока нет кодов.</p>
        ) : (
          <ul className={styles.codesModalList}>
            {modalCodes.map((code) => {
              const isHighlighted =
                !!highlightedDeleteCode &&
                normalizeCode(code) === normalizeCode(highlightedDeleteCode);
              return (
                <li
                  key={code}
                  ref={isHighlighted ? highlightedCodeRef : undefined}
                  className={`${styles.codeItem} ${
                    isHighlighted ? styles.codeItemHighlighted : ""
                  }`}
                >
                  {code}
                </li>
              );
            })}
          </ul>
        )}

        {codesModalBox && codesModalBox.codes.length > 0 && (
          <div className={styles.codesDeleteBar}>
            {highlightedDeleteCode ? (
              <>
                <p className={styles.codesDeleteHint}>
                  Код найден и выделен. Удалить эту банку из коробки?
                </p>
                <div className={styles.codesDeleteActions}>
                  <button
                    type="button"
                    className={styles.codesDeleteConfirm}
                    onClick={confirmDeleteHighlightedCode}
                  >
                    Удалить
                  </button>
                  <button
                    type="button"
                    className={styles.codesDeleteCancel}
                    onClick={clearDeleteSelection}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.codesDeleteHint}>
                  Чтобы удалить банку — отсканируйте её DataMatrix (камера или ТСД).
                </p>
                <CameraScanner
                  forceZXing
                  muteDetectorSuccessSound
                  expectedCount={1}
                  closeOnScan
                  formats={["DataMatrix"]}
                  textButton="Скан для удаления"
                  buttonHeight={40}
                  iconWidth={18}
                  iconHeight={18}
                  className={styles.codesDeleteScanButton}
                  onScan={(results) => handleDeleteScan(results[0] ?? "")}
                />
              </>
            )}
            {deleteScanError && (
              <p className={styles.codesDeleteError}>{deleteScanError}</p>
            )}
          </div>
        )}
      </div>
    </Popup>

    {submitErrorText && (
      <Popup
        isOpen={!!submitErrorText}
        onClose={() => setSubmitErrorText(null)}
        title="Внимание"
        containerClassName={styles.submitErrorPopup}
      >
        <div className={styles.submitErrorInner}>
          <p className={styles.submitErrorText}>{submitErrorText}</p>
          <button
            type="button"
            className={styles.submitErrorButton}
            onClick={() => setSubmitErrorText(null)}
          >
            OK
          </button>
        </div>
      </Popup>
    )}

    {submitSuccessText && (
      <Popup
        isOpen={!!submitSuccessText}
        onClose={handleSuccessCloseAndExit}
        title=""
        containerClassName={styles.submitSuccessPopup}
      >
        <div className={styles.submitSuccessContainer}>
          <div className={styles.submitSuccessIcon}>✓</div>
          <h2 className={styles.submitSuccessTitle}>Успешно!</h2>
          <p className={styles.submitSuccessMessage}>{submitSuccessText}</p>
          <button
            type="button"
            className={styles.submitSuccessButton}
            onClick={handleSuccessCloseAndExit}
          >
            Продолжить
          </button>
        </div>
      </Popup>
    )}
    </>
  );
};

export default MassMarkingScan;
