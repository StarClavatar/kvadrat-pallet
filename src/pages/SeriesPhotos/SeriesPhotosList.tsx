import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BackspaceIcon from "../../assets/backspaceIcon";
import { PinContext } from "../../context/PinAuthContext";
import { getTransferProducts, TransferDocumentData } from "../../api/seriesPhotos";
import Popup from "../../components/Popup/Popup";
import styles from "./SeriesPhotos.module.css";

const PhotoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
// ---------------------------------

const SeriesPhotosList = () => {
  const navigate = useNavigate();
  const { docNumber } = useParams<{ docNumber: string }>();
  const location = useLocation();
  const { pinAuthData } = useContext(PinContext);

  const [documentData, setDocumentData] = useState<TransferDocumentData | null>(
    location.state?.documentData || null
  );
  const [isLoading, setIsLoading] = useState(!documentData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentData && docNumber) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const pinCode = String(pinAuthData?.pinCode ?? "");
          const tsdUUID = String(pinAuthData?.tsdUUID ?? "");
          const userName = String(pinAuthData?.workerName ?? "");
          const response = await getTransferProducts(docNumber, pinCode, tsdUUID, userName);
          if (response.data) {
            setDocumentData(response.data);
          } else {
            const errMsg = typeof response.error === "string" && response.error ? response.error : response.error?.message;
            setError(errMsg || "Ошибка загрузки документа");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Ошибка сети");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [docNumber, documentData, pinAuthData]);

  const formatDate = (dateString?: string, timeAlso = true) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit", month: "2-digit", year: "numeric",
    };
    if (timeAlso) {
      options.hour = "2-digit"; options.minute = "2-digit"; options.second = "2-digit";
    }
    return date.toLocaleString("ru-RU", options);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/series-photoes")}
          aria-label="Назад"
        >
          <BackspaceIcon color="#ffffff" />
        </button>
        <h1 className={styles.title}>Выбор товара</h1>
      </header>

      <main className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Загрузка документа...</div>
        ) : documentData ? (
          <div className={styles.docContainer}>
            <div className={styles.docHeaderCompact}>
              <h3 className={styles.detailNomenclature}>Реализация №{documentData.documentNumber}</h3>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>От:</span>
                <span className={styles.detailValue}>{formatDate(documentData.documentDate, false)}</span>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Товаров:</span>
              <span className={styles.detailValue}>{documentData.products.length}</span>
            </div>

            <div className={styles.productsList}>
              {documentData.products.map((product, index) => {
                const photoCount = product.photos?.length || 0;
                
                return (
                  <div 
                    key={`${product.seriesUUID}-${index}`} 
                    className={styles.productCard}
                    onClick={() => navigate(`/series-photoes/${encodeURIComponent(documentData.documentNumber)}/${encodeURIComponent(product.seriesUUID)}`, {
                      state: { product, documentData }
                    })}
                  >
                    <div className={styles.productIndex}>{index + 1}</div>
                    
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productMeta}>
                        <span>{product.series}</span>
                        <span className={styles.metaDot}>●</span>
                        <span>до {formatDate(product.expirationDate, false)}</span>
                      </div>
                    </div>
                    
                    <div className={styles.productStatus}>
                      <div className={photoCount > 0 ? styles.badgeSuccess : styles.badgeNeutral}>
                        <PhotoIcon /> <span>{photoCount}</span>
                      </div>
                      <ChevronRight />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
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

export default SeriesPhotosList;
