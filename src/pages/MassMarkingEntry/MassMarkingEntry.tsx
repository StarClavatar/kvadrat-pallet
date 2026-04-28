import { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraScanner from "../../components/CameraScanner/CameraScanner";
import Popup from "../../components/Popup/Popup";
import BackspaceIcon from "../../assets/backspaceIcon";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import { PinContext } from "../../context/PinAuthContext";
import { postRefundInfo } from "../../api/refundInfo";
import styles from "./MassMarkingEntry.module.css";

const STORAGE_KEY = "mass-marking-dm-codes-v2";

type RestoredReturnResponse = {
  guidDoc?: string | null;
  returnDate?: string;
  returnDescription?: string;
  returnNumber?: string;
  boxes?: Record<string, string[]>;
  error?: string;
  info?: string;
};

type PersistedMassMarkingData = {
  boxes: { id: string; name: string; codes: string[] }[];
  activeBoxId?: string;
  returnInfo: {
    returnDate: string;
    returnDescription: string;
    returnNumber: string;
  };
  guidDoc?: string | null;
};

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `box-${Date.now()}-${Math.random()}`;
}

function normalizeCode(text: string) {
  let s = text.replace(/[\x00-\x1F\x7F]+/g, "").trim();
  s = s.replace(/\((00|01|21|93)\)/g, "$1");
  return s;
}

function toPersistedPayload(data: RestoredReturnResponse): PersistedMassMarkingData | null {
  const returnDate = String(data.returnDate ?? "").trim();
  const returnDescription = String(data.returnDescription ?? "").trim();
  const returnNumber = String(data.returnNumber ?? "").trim();
  if (!returnDate || !returnDescription || !returnNumber) return null;

  const sourceBoxes = data.boxes && typeof data.boxes === "object" ? data.boxes : {};
  const entries = Object.entries(sourceBoxes);
  const boxes = (entries.length ? entries : [["box1", [] as string[]]]).map(([key, list], idx) => {
    const n = idx + 1;
    const safeCodes = Array.isArray(list)
      ? Array.from(new Set(list.map((item) => normalizeCode(String(item))).filter(Boolean)))
      : [];
    return {
      id: `${key}-${createId()}`,
      name: `Коробка ${n}`,
      codes: safeCodes,
    };
  });

  return {
    boxes,
    activeBoxId: boxes[0]?.id,
    returnInfo: { returnDate, returnDescription, returnNumber },
    guidDoc: data.guidDoc ?? null,
  };
}

const MassMarkingEntry = () => {
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const successAudio = useMemo(() => new Audio(successSound), []);
  const errorAudio = useMemo(() => new Audio(errorSound), []);

  const handleFindScan = useCallback(
    async (results: string[]) => {
      const code = normalizeCode(results[0] ?? "");
      if (!code || isRestoring) return;

      setIsRestoring(true);
      try {
        const response = (await postRefundInfo(
          String(pinAuthData?.pinCode),
          String(pinAuthData?.tsdUUID),
          code
        )) as RestoredReturnResponse;

        if (response?.error?.trim()) {
          void errorAudio.play().catch(() => {});
          setErrorText(response.error.trim());
          return;
        }

        const payload = toPersistedPayload(response);
        if (!payload) {
          void errorAudio.play().catch(() => {});
          setErrorText("Возврат не найден или пришел неполный ответ.");
          return;
        }

        const existing = localStorage.getItem(STORAGE_KEY);
        if (
          existing &&
          existing.trim().length > 0 &&
          !window.confirm("В хранилище есть незавершенный возврат. Заменить его найденным?")
        ) {
          return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        void successAudio.play().catch(() => {});
        navigate("/mass-marking-scan/editor");
      } catch (e) {
        void errorAudio.play().catch(() => {});
        const msg = e instanceof Error ? e.message : "Сеть недоступна";
        setErrorText(msg);
      } finally {
        setIsRestoring(false);
      }
    },
    [errorAudio, isRestoring, navigate, pinAuthData?.pinCode, pinAuthData?.tsdUUID, successAudio]
  );

  return (
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
        <h1 className={styles.title}>Возврат товаров</h1>
      </header>

      <main className={styles.content}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => navigate("/mass-marking-scan/editor")}
        >
          Создать возврат
        </button>

        <div className={styles.findSection}>
          <CameraScanner
            forceZXing
            expectedCount={1}
            closeOnScan
            formats={["DataMatrix"]}
            textButton={isRestoring ? "Поиск..." : "Найти возврат по DataMatrix"}
            className={styles.findButton}
            buttonDisabled={isRestoring}
            onScan={handleFindScan}
            muteDetectorSuccessSound
          />
        </div>
      </main>

      {errorText && (
        <Popup
          isOpen={!!errorText}
          onClose={() => setErrorText(null)}
          title="Ошибка"
          containerClassName={styles.errorPopup}
        >
          <div className={styles.errorInner}>
            <p className={styles.errorText}>{errorText}</p>
            <button
              type="button"
              className={styles.errorButton}
              onClick={() => setErrorText(null)}
            >
              OK
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default MassMarkingEntry;
