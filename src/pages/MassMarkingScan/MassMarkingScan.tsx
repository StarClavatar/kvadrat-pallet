import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraScanner, {
  type CameraScannerHandle,
} from "../../components/CameraScanner/CameraScanner";
import Popup from "../../components/Popup/Popup";
import BackspaceIcon from "../../assets/backspaceIcon";
import { PinContext } from "../../context/PinAuthContext";
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

type MassMarkingDraftPayload = {
  pinCode: string;
  tsdUUID: string;
  returnDate: string;
  returnDescription: string;
  returnNumber: string;
  boxes: Record<string, string[]>;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          boxes?: ScanBox[];
          activeBoxId?: string;
          returnInfo?: Partial<ReturnInfo>;
        };
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
      JSON.stringify({ boxes, activeBoxId, returnInfo })
    );
  }, [boxes, activeBoxId, returnInfo]);

  const activeBox = useMemo(
    () => boxes.find((b) => b.id === activeBoxId) ?? boxes[0],
    [boxes, activeBoxId]
  );

  const totalCodes = useMemo(
    () => boxes.reduce((n, b) => n + b.codes.length, 0),
    [boxes]
  );

  /** Все коды по всем коробкам — для подсветки «уже есть» в камере. */
  const allCodesFlat = useMemo(
    () => dedupeCodeList(boxes.flatMap((b) => b.codes)),
    [boxes]
  );

  const handleLiveScan = useCallback(
    (results: string[]) => {
      const batch = dedupeCodeList(results);
      if (batch.length === 0) return;

      setBoxes((prev) => {
        const idx = prev.findIndex((b) => b.id === activeBoxId);
        if (idx < 0) return prev;

        const takenElsewhere = keysInOtherBoxes(prev, activeBoxId);
        const batchNew = batch.filter((c) => !takenElsewhere.has(normalizeCode(c)));
        if (batchNew.length === 0) return prev;

        const box = prev[idx];
        const base = dedupeCodeList(box.codes);
        const merged = dedupeCodeList([...base, ...batchNew]);
        if (merged.length === base.length) return prev;

        const next = [...prev];
        next[idx] = { ...box, codes: merged };
        return next;
      });
    },
    [activeBoxId]
  );

  const sessionAddedCount = useMemo(() => {
    if (scanSessionStartLen === null) return undefined;
    return Math.max(0, activeBox.codes.length - scanSessionStartLen);
  }, [activeBox.codes.length, scanSessionStartLen]);

  const codesModalBox = useMemo(
    () => (codesModalBoxId ? boxes.find((b) => b.id === codesModalBoxId) : undefined),
    [boxes, codesModalBoxId]
  );

  const modalCodes = useMemo(() => {
    if (!codesModalBox) return [];
    const raw = codesModalBox.codes;
    const tail = raw.length > MAX_CODES_IN_MODAL ? raw.slice(-MAX_CODES_IN_MODAL) : raw;
    return [...tail].reverse();
  }, [codesModalBox]);

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
      const b = createBox(prev.length + 1);
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  useEffect(() => {
    if (codesModalBoxId && !boxes.some((b) => b.id === codesModalBoxId)) {
      setCodesModalBoxId(null);
    }
  }, [boxes, codesModalBoxId]);

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

  const submitDraft = () => {
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
    const payload: MassMarkingDraftPayload = {
      pinCode: String(pinAuthData?.pinCode ?? ""),
      tsdUUID: String(pinAuthData?.tsdUUID ?? ""),
      returnDate: returnInfo.returnDate,
      returnDescription: description,
      returnNumber: returnInfo.returnNumber,
      boxes: nonEmptyBoxes.reduce<Record<string, string[]>>((acc, box, index) => {
        acc[`box${index + 1}`] = [...box.codes];
        return acc;
      }, {}),
    };

    // TODO: заменить на API вызов, когда endpoint будет готов.
    console.log("[MassMarkingScan] submit payload:", payload);
  };

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
          onClick={submitDraft}
          disabled={!returnInfo}
          aria-label="Отправить данные"
        >
          <svg
            className={styles.submitIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
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
      onClose={() => setCodesModalBoxId(null)}
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
            {modalCodes.map((code) => (
              <li key={code} className={styles.codeItem}>
                {code}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Popup>
    </>
  );
};

export default MassMarkingScan;
