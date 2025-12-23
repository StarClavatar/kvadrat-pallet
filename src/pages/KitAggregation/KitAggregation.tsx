import React, { useRef, useState } from 'react';
import styles from './KitAggregation.module.css';
import Loader from '../../components/Loader/Loader';
import Popup from '../../components/Popup/Popup';
import ReviewModal from './components/ReviewModal';
import CameraScanner from '../../components/CameraScanner/CameraScanner';
import PrintIcon from '../../assets/printIcon';
import { useKitActions } from './hooks/useKitActions';
import { processScanImage, ScanResultData } from './utils/imageProcessing';

const KitAggregation = () => {
  const {
    docData,
    codes,
    setCodes,
    isLoading,
    errorText,
    setErrorText,
    successText,
    setSuccessText,
    SET_SIZE,
    validateCode,
    actions
  } = useKitActions();

  // Review Modal State (for file upload)
  const [reviewData, setReviewData] = useState<ScanResultData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  // Hidden inputs refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handlers for File Upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    try {
      // Show loader manually here since this is local processing
      const result = await processScanImage(file, codes, SET_SIZE, docData);
      if (result.totalFound === 0) {
        setErrorText("На изображении не найдено штрих-кодов.");
      } else {
        setReviewData(result);
        setIsReviewOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || String(err));
    }
  };

  const handleReviewConfirm = () => {
    if (reviewData && reviewData.newCodes.length > 0) {
        // Just add codes, validation happens in processScanImage or API
        const newCodes = [...codes, ...reviewData.newCodes].slice(0, SET_SIZE);
        setCodes(newCodes);
        if (newCodes.length === SET_SIZE) {
             actions.createKit(newCodes);
        }
    }
    closeReview();
  };

  const closeReview = () => {
    setIsReviewOpen(false);
    setReviewData(null);
  };

  // Live Scan Handlers
  const handleLiveScan = (scannedCodes: string[]) => {
    // Take exactly SET_SIZE codes or however many found
    const validCodes: string[] = [];
    for (const cleanCode of scannedCodes) {
      if (validCodes.length >= SET_SIZE) break; 
      if (validateCode(cleanCode)) {
          validCodes.push(cleanCode);
      }
    }

    if (validCodes.length > 0) {
       setCodes(validCodes);
       if (validCodes.length === SET_SIZE) {
           actions.createKit(validCodes);
       }
    }
  };
  
  const handleChangeKitScan = (scannedCodes: string[]) => {
      const validCodes: string[] = [];
       for (const cleanCode of scannedCodes) {
        if (validCodes.length >= SET_SIZE) break; 
        if (validateCode(cleanCode)) {
            validCodes.push(cleanCode);
        }
      }
      if (validCodes.length > 0) {
          setCodes(validCodes);
          actions.changeKit(validCodes);
      }
  };


  // UI Helpers
  const packsCollected = docData?.collectedCount || 0;
  const packsTotal = docData?.packCount || 1;
  const packsProgressPercent = Math.min(100, (packsCollected / packsTotal) * 100);

  if (isLoading) return <Loader />;

  return (
    <div className={styles.container}>
      {/* Header */}
      {docData?.KitNum && <h4 className={styles.kitNum} style={{ backgroundColor: docData?.collectedCount == docData?.packCount ? "rgba(76, 175, 80, 0.4)" : "rgb(255,221,3)" }}>Набор {docData.KitNum}</h4>}
      
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className={styles.docNum}>Заказ №{docData?.docNum}</p>
          {docData?.docState && (
            <div className={styles.docState} style={{ backgroundColor: docData.docState === 'собран' ? 'rgb(76, 175, 79)' : 'rgb(255,221,3)', marginBottom: 0 }}>
              {docData.docState}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {docData?.KitNum ? (
              <>
                <CameraScanner
                  onScan={handleChangeKitScan}
                  expectedCount={SET_SIZE}
                  targetTotal={SET_SIZE}
                  className={`${styles.button} ${styles.buttonEdit}`}
                  textButton='Изменить'
                  scannerText='Сканируйте набор для изменения'
                  buttonHeight={20}
                  validateCode={validateCode}
                  closeOnScan={true}
                  buttonDisabled={docData.collectedCount == docData.packCount}
                />
                <button
                  className={`${styles.button} ${styles.buttonDelete}`}
                  onClick={actions.deleteKit}
                  // disabled={docData.collectedCount == docData.packCount}
                >
                  Удалить 🗑️
                </button>
              </>
            ) : null}
             <CameraScanner
                onScan={actions.findKit}
                expectedCount={1}
                className={`${styles.button} ${styles.findKitButton}`}
                iconWidth={24}
                iconHeight={24}
                closeOnScan={true}
                textButton="Поиск"
                scannerText="Поиск набора"
                formats={["DataMatrix", "Code128"]}
              />
        </div>
        
        {docData && (
          <div className={styles.docName}>
            {docData.prodName}
          </div>
        )}

        {docData && (
          <div className={styles.progressSection} style={{ marginTop: '12px' }}>
            <div className={styles.progressInfo}>
              <span>Собрано наборов</span>
              <span><strong>{docData.collectedCount}</strong> из <strong>{docData.packCount}</strong></span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${packsProgressPercent}%`, backgroundColor: '#ff9800' }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.emptyState}>
          {docData?.kitDetail && (
            <div style={{ textAlign: 'left', width: '100%', maxWidth: '300px' }}>
              <strong>Состав набора:</strong>
              <ul style={{ paddingLeft: '0px', marginTop: '5px' }}>
                {docData.kitDetail.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {item.prodName} — {item.amount} шт.
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p>Сканируйте коды камерой.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.scanButtons}>
          <CameraScanner
            onScan={handleLiveScan}
            expectedCount={SET_SIZE}
            targetTotal={SET_SIZE}
            className={`${styles.button} ${styles.liveScanButton}`}
            iconWidth={32}
            textButton='Создать набор'
            scannerText='Сканируйте набор'
            iconHeight={32}
            buttonHeight={60}
            validateCode={validateCode}
            closeOnScan={true}
            buttonDisabled={docData.collectedCount == docData.packCount}
          />

          {docData?.KitNum && <button
            className={`${styles.button} ${styles.buttonPrint}`}
            onClick={actions.printLabel}
          >
            <PrintIcon color='black' size={40} />
          </button>}
        </div>
      </footer>

      {/* Inputs & Modals */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        data={reviewData}
        onConfirm={handleReviewConfirm}
        onRetake={() => closeReview()}
        currentTotal={codes.length}
        targetTotal={SET_SIZE}
      />

      {errorText && (
        <Popup
          isOpen={!!errorText}
          onClose={() => setErrorText(null)}
          title="Внимание"
          containerClassName="popup-error"
        >
          <div className='popup-error__container'>
            <p className='popup-error__text'>{errorText}</p>
            <button className='popup-error__button' onClick={() => setErrorText(null)}>OK</button>
          </div>
        </Popup>
      )}

      {successText && (
        <Popup
          isOpen={!!successText}
          onClose={() => { setSuccessText(null); setCodes([]); }}
          title=""
          containerClassName={styles.successPopup}
        >
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Успешно!</h2>
            <p className={styles.successMessage}>{successText}</p>
            <button className={styles.successButton} onClick={() => { setSuccessText(null); setCodes([]); }}>Продолжить</button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default KitAggregation;
