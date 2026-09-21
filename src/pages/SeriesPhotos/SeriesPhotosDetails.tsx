import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

import BackspaceIcon from "../../assets/backspaceIcon";
import { PinContext } from "../../context/PinAuthContext";
import { getPhotos, editSeriesPhotos, TransferProduct, TransferDocumentData, PhotoData } from "../../api/seriesPhotos";
import Popup from "../../components/Popup/Popup";
import styles from "./SeriesPhotos.module.css";

const SeriesPhotosDetails = () => {
  const navigate = useNavigate();
  const { docNumber, seriesUUID } = useParams<{ docNumber: string; seriesUUID: string }>();
  const location = useLocation();
  const { pinAuthData } = useContext(PinContext);

  const [documentData, setDocumentData] = useState<TransferDocumentData | null>(location.state?.documentData || null);
  const [product, setProduct] = useState<TransferProduct | null>(location.state?.product || null);

  const [photosData, setPhotosData] = useState<Record<string, string>>({}); // photoUUID -> base64
  const [isLoading, setIsLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const retakeFileInputRef = useRef<HTMLInputElement>(null);
  const retakeTargetUuidRef = useRef<string | null>(null);

  const loadPhotos = useCallback(async () => {
    if (!product) return;
    const uuids = product.photos?.map(p => p.photoUUID).filter(Boolean) || [];
    if (uuids.length === 0) return;

    setIsLoading(true);
    setPhotosError(null);
    try {
      const pinCode = String(pinAuthData?.pinCode ?? "");
      const tsdUUID = String(pinAuthData?.tsdUUID ?? "");
      const userName = String(pinAuthData?.workerName ?? "");

      const response = await getPhotos(uuids, pinCode, tsdUUID, userName);
      if (response.data) {
        const newMap: Record<string, string> = {};
        response.data.forEach((p: PhotoData) => {
          newMap[p.photoUUID] = p.base64.startsWith("data:")
            ? p.base64
            : `data:image/jpeg;base64,${p.base64}`;
        });
        setPhotosData(newMap);
      } else {
        const errMsg = typeof response.error === "string" && response.error
          ? response.error
          : response.error?.message;
        setPhotosError(errMsg || "Ошибка загрузки фото");
      }
    } catch (err) {
      console.error("Failed to load photos", err);
      setPhotosError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setIsLoading(false);
    }
  }, [product, pinAuthData]);

  useEffect(() => {
    if (!product) {
      navigate(`/series-photoes/${docNumber}`, { replace: true });
      return;
    }

    loadPhotos();
  }, [product, docNumber, navigate, loadPhotos]);

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("ru-RU");
  };

  const processAndUploadFile = (file: File, targetUUID?: string) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          uploadPhoto(compressedBase64, file, targetUUID);
        } else {
          uploadPhoto(ev.target?.result as string, file, targetUUID);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndUploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRetakeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndUploadFile(file, retakeTargetUuidRef.current || undefined);
    if (retakeFileInputRef.current) {
      retakeFileInputRef.current.value = "";
    }
  };

  const handleRetakeClick = (uuid: string) => {
    retakeTargetUuidRef.current = uuid;
    retakeFileInputRef.current?.click();
  };

  const uploadPhoto = async (base64Data: string, file: File, targetUUID?: string) => {
    if (!product || !seriesUUID) return;

    setIsUploading(true);
    try {
      const pinCode = String(pinAuthData?.pinCode ?? "");
      const tsdUUID = String(pinAuthData?.tsdUUID ?? "");
      const userName = String(pinAuthData?.workerName ?? "");

      let cleanBase64 = base64Data;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      
      const currentTime = `${new Date().toLocaleDateString("ru-RU").replaceAll(".", "")}_${new Date().toLocaleTimeString("ru-RU").replaceAll(":", "").replaceAll(".", "")}`;

      console.log(currentTime);

      const payload = [{
        ...(targetUUID ? { photoUUID: targetUUID } : {}),
        fileName: `${product.name}_${product.series}_${currentTime}.jpg`,
        base64: cleanBase64
      }];

      const response = await editSeriesPhotos(seriesUUID, payload, docNumber || "", pinCode, tsdUUID, userName);

      if (response.data) {
        if (targetUUID) {
          setPhotosData(prev => ({ ...prev, [targetUUID]: base64Data }));
          setSuccessMsg("Фото успешно переснято!");
          setTimeout(() => setSuccessMsg(null), 2000);
        }

        setDocumentData(response.data);
        const updatedProduct = response.data.products.find(p => p.seriesUUID === seriesUUID);
        if (updatedProduct) {
          setProduct(updatedProduct);
        }
      } else {
        const errMsg = typeof response.error === "string" && response.error ? response.error : response.error?.message;
        setError(errMsg || "Ошибка сохранения фото");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети");
    } finally {
      setIsUploading(false);
    }
  };

  if (!product) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate(`/series-photoes/${encodeURIComponent(docNumber || "")}`, {
            state: { documentData }
          })}
          aria-label="Назад"
        >
          <BackspaceIcon color="#ffffff" />
        </button>
        <h1 className={styles.title}>Детали серии</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.detailsGroup}>
          <h3 className={styles.detailNomenclature}>{product.name}</h3>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Серия:</span>
            <span className={styles.detailValue}>{product.series} от {formatDateOnly(product.productionDate)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>До:</span>
            <span className={styles.detailValue}>{formatDateOnly(product.expirationDate)}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.gallerySection}>
          {product.photos?.length > 0 ? (
            <h2 className={styles.galleryTitle}>Фотографии ({product.photos?.length})</h2>
          ) : (
            <h2 className={styles.galleryTitleEmpty}>Нет фотографий</h2>
          )}

          {isLoading && <div className={styles.loading}>Загрузка фото...</div>}

          {photosError && !isLoading ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>Ошибка загрузки фото: {photosError}</p>
              <button type="button" className={styles.reloadButton} onClick={loadPhotos}>
                Перезагрузить
              </button>
            </div>
          ) : (
            <div className={styles.galleryGrid}>
              <PhotoProvider
                toolbarRender={({ index }) => {
                  const photo = product.photos?.[index];
                  if (!photo) return null;
                  return (
                    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      style={{ cursor: 'pointer', marginRight: '16px' }}
                      onClick={() => handleRetakeClick(photo.photoUUID)}
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                    </svg>
                  );
                }}
              >
                {product.photos?.map((photo) => {
                  const src = photosData[photo.photoUUID];
                  if (!src) return (
                    <div key={photo.photoUUID} className={styles.photoPlaceholder}>
                      <span>Загрузка...</span>
                    </div>
                  );

                  return (
                    <PhotoView key={photo.photoUUID} src={src}>
                      <img src={src} alt={photo.fileName} className={styles.galleryThumbnail} />
                    </PhotoView>
                  );
                })}
              </PhotoProvider>
            </div>
          )}
        </div>
      </main>

      <div className={styles.actions}>
        {isUploading ? (
          <div className={`${styles.primaryButton} ${styles.buttonDisabled}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 4V2M12 22V20M4 12H2M22 12H20M17.6569 6.34315L19.0711 4.92893M4.92893 19.0711L6.34315 17.6569M17.6569 17.6569L19.0711 19.0711M4.92893 4.92893L6.34315 6.34315" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="environment"
              ref={fileInputRef}
              onChange={handleCapture}
              className={styles.hiddenInput}
              id="cameraInput"
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="environment"
              ref={retakeFileInputRef}
              onChange={handleRetakeCapture}
              className={styles.hiddenInput}
              id="retakeInput"
            />
            <label htmlFor="cameraInput" className={styles.primaryButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 20h-7a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v3.5" />
                <path d="M16 19h6" />
                <path d="M19 16v6" />
                <path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              </svg>
            </label>
          </>
        )}
      </div>

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

      {successMsg && (
        <Popup
          isOpen={!!successMsg}
          onClose={() => setSuccessMsg(null)}
          title=""
          containerClassName={styles.successPopup}
        >
          <p className={styles.successText}>{successMsg}</p>
        </Popup>
      )}

      {isUploading && (
        <div className={styles.globalOverlay}>
          <div className={styles.spinnerLarge} />
          <div>Сохранение...</div>
        </div>
      )}
    </div>
  );
};

export default SeriesPhotosDetails;
