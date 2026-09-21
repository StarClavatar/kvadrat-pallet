import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import BackspaceIcon from "../../assets/backspaceIcon";
import { PinContext } from "../../context/PinAuthContext";
import Popup from "../../components/Popup/Popup";
import { getTransferProducts } from "../../api/seriesPhotos";
import styles from "./SeriesPhotos.module.css";

const SeriesPhotosEntry = () => {
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const [docNumber, setDocNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const pinCode = String(pinAuthData?.pinCode ?? "");
      const tsdUUID = String(pinAuthData?.tsdUUID ?? "");
      const userName = String(pinAuthData?.workerName ?? "");
      
      const response = await getTransferProducts(docNumber.trim(), pinCode, tsdUUID, userName);
      if (response.data) {
        navigate(`/series-photoes/${encodeURIComponent(docNumber.trim())}`, { 
          state: { documentData: response.data } 
        });
      } else {
        const errMsg = typeof response.error === "string" && response.error ? response.error : response.error?.message;
        setError(errMsg || "Документ не найден или произошла ошибка");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/workmode")}
          aria-label="Назад"
        >
          <BackspaceIcon color="#ffffff" />
        </button>
        <h1 className={styles.title}>Фото серий</h1>
      </header>

      <main className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.entryForm}>
          <label className={styles.inputLabel}>
            Номер перемещения
            <input
              type="text"
              className={styles.inputField}
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="0000-000123"
              disabled={isLoading}
              autoFocus
            />
          </label>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || !docNumber.trim()}
          >
            {isLoading ? "Поиск..." : "Отправить"}
          </button>
        </form>
      </main>

      {error && (
        <Popup
          isOpen={!!error}
          onClose={() => setError(null)}
          title=""
          containerClassName={styles.errorPopup}
        >
          <div className={styles.errorInner}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.errorButton} onClick={() => setError(null)}>
              OK
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default SeriesPhotosEntry;
