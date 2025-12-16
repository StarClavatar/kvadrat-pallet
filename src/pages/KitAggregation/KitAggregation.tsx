import { useState, useRef, useContext, useMemo } from 'react';
import styles from './KitAggregation.module.css';
import { useLocation } from 'react-router-dom';
import { PinContext } from '../../context/PinAuthContext';
import Loader from '../../components/Loader/Loader';
import Popup from '../../components/Popup/Popup';
import { processScanImage, ScanResultData } from './utils/imageProcessing';
import ReviewModal from './components/ReviewModal';
import CameraScanner from '../../components/CameraScanner/CameraScanner';
import { GetDocResponse } from '../../api/kitservice/getDoc';
import { createKit } from '../../api/kitservice/createKit';
import { getKit } from '../../api/kitservice/getKit';
import { changeKit } from '../../api/kitservice/changeKit';
import { deleteKit } from '../../api/kitservice/deleteKit';
import { printLabel } from '../../api/kitservice/printLabel';

const KitAggregation = () => {
  const location = useLocation();
  const { pinAuthData } = useContext(PinContext);

  // Extract doc data passed from ScanDocKit
  const [docData, setDocData] = useState<GetDocResponse | undefined>(location.state?.docData);

  // Calculate SET_SIZE dynamically based on kitDetail
  const SET_SIZE = useMemo(() => {
    if (!docData?.kitDetail) return 4; // Default fallback
    return docData.kitDetail.reduce((sum, item) => sum + item.amount, 0);
  }, [docData]);

  // Extract valid GTINs for validation
  const validGtins = useMemo(() => {
    return docData?.kitDetail.map(d => d.GTIN) || [];
  }, [docData]);

  // Validator function
  const validateCode = (code: string) => {
    if (validGtins.length === 0) return true; 
    return validGtins.some(gtin => code.includes(gtin));
  };

  // Состояние для кодов в наборе
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние для редактирования набора
  const [kitNum, setKitNum] = useState<string | null>(null);

  // Модальное окно для просмотра результатов сканирования (ФОТО)
  const [reviewData, setReviewData] = useState<ScanResultData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  // ОШИБКИ и УСПЕХ
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Refs для камеры (ФОТО) и галереи
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Safety check: redirect if no docData
  if (!docData) {
      // You might want to uncomment this in production
      // useEffect(() => { navigate('/scan-doc-kit'); }, []);
      // return null;
  }

  // --- ОБРАБОТКА Live Scan ---
  const handleLiveScan = (scannedCodes: string[]) => {
    let addedCount = 0;
    const newCodesList = [...codes];

    for (const cleanCode of scannedCodes) {
      if (newCodesList.length >= SET_SIZE) break; 
      
      if (!newCodesList.includes(cleanCode)) {
        newCodesList.push(cleanCode);
        addedCount++;
      }
    }

    if (addedCount > 0) {
       setCodes(newCodesList);
    }
  };
  // -------------------------------------------

  // --- ОБРАБОТКА ФОТО (МАССОВОЕ СКАНИРОВАНИЕ) ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    setIsLoading(true);
    try {
      const result = await processScanImage(file, codes, SET_SIZE, validGtins);
      
      if (result.totalFound === 0) {
        setErrorText("На изображении не найдено штрих-кодов.");
      } else {
        setReviewData(result);
        setIsReviewOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewConfirm = () => {
    if (reviewData && reviewData.newCodes.length > 0) {
      const remainingSlots = SET_SIZE - codes.length;
      const codesToAdd = reviewData.newCodes.slice(0, remainingSlots);
      setCodes(prev => [...prev, ...codesToAdd]);
    }
    closeReview();
  };

  const handleReviewRetake = () => {
    closeReview();
  };

  const closeReview = () => {
    setIsReviewOpen(false);
    setReviewData(null);
  };
  // -------------------------------------------

  const handleFindKitScan = async (scannedCodes: string[]) => {
    if (scannedCodes.length === 0) return;
    setIsLoading(true);
    try {
      const response = await getKit({
         pinCode: String(pinAuthData?.pinCode),
         tsdUUID: String(localStorage.getItem("tsdUUID")),
         scanCod: scannedCodes[0],
         docNum: String(docData?.docNum)
      });
      if (response.error) {
         setErrorText(response.error);
      } else if (response.kitNum) {
         setKitNum(response.kitNum);
         setCodes(response.scanCodes || []);
         setSuccessText(`Набор ${response.kitNum} найден`);
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeKit = async () => {
    if (!kitNum) return;
    setIsLoading(true);
    try {
       const response = await changeKit({
          pinCode: String(pinAuthData?.pinCode),
          tsdUUID: String(localStorage.getItem("tsdUUID")),
          kitNum: kitNum,
          scanCodes: codes
       });
       if (response.error) {
          setErrorText(response.error);
       } else {
          setSuccessText("Набор обновлен");
          setKitNum(null);
          setCodes([]);
       }
    } catch(e: any) {
       setErrorText(e.message || String(e));
    } finally {
       setIsLoading(false);
    }
  };

  const handleDeleteKit = async () => {
     if (!kitNum) return;
     if (!window.confirm("Вы уверены, что хотите удалить набор?")) return;

     setIsLoading(true);
     try {
       const response = await deleteKit({
          pinCode: String(pinAuthData?.pinCode),
          tsdUUID: String(localStorage.getItem("tsdUUID")),
          kitNum: kitNum
       });
       if (response.error) {
          setErrorText(response.error);
       } else {
          setSuccessText("Набор удален");
          setKitNum(null);
          setCodes([]);
       }
     } catch(e: any) {
        setErrorText(e.message || String(e));
     } finally {
        setIsLoading(false);
     }
  };

  const handlePrintLabel = async () => {
     if (!kitNum) return;
     setIsLoading(true);
     try {
        const response = await printLabel({
           pinCode: String(pinAuthData?.pinCode),
           tsdUUID: String(localStorage.getItem("tsdUUID")),
           kitNum: kitNum
        });
        if (response.error) {
           setErrorText(response.error);
        } else {
           setSuccessText("Этикетка отправлена на печать");
        }
     } catch(e: any) {
        setErrorText(e.message || String(e));
     } finally {
        setIsLoading(false);
     }
  };

  const removeCode = (indexToRemove: number) => {
    setCodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (codes.length !== SET_SIZE || !docData) return;

    setIsLoading(true);
    try {
      const response = await createKit({
        pinCode: String(pinAuthData?.pinCode),
        tsdUUID: String(localStorage.getItem("tsdUUID")),
        docNum: docData.docNum,
        scanCodes: codes,
      });

      if (response.error) {
        setErrorText(response.error);
      } else {
        setSuccessText("Набор успешно агрегирован!");
        // Optimistically update local count
        setDocData({
            ...docData,
            collectedCount: docData.collectedCount + 1
        });
      }
    } catch (err: any) {
      setErrorText(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessText(null);
    setCodes([]); // Clear the current set to start a new one
    // We stay on the same page
  };

  const isComplete = codes.length === SET_SIZE;
  const progressPercent = (codes.length / SET_SIZE) * 100;
  
  // Kit Progress Calculation
  const packsCollected = docData?.collectedCount || 0;
  const packsTotal = docData?.packCount || 1; // Avoid division by zero
  const packsProgressPercent = Math.min(100, (packsCollected / packsTotal) * 100);

  if (isLoading) return <Loader />;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <div>
            <h1 className={styles.title} style={{marginBottom: 0}}>{kitNum ? `Ред. набора ${kitNum}` : `Агрегация набора`}</h1>
            <p className={styles.docNum}>Заказ №{docData?.docNum}</p>
          </div>
            <div style={{marginLeft: '10px'}}>
                 <CameraScanner 
                    onScan={handleFindKitScan} 
                    expectedCount={1}
                    className={styles.button} // Reusing button style but maybe smaller
                    iconWidth={24}
                    iconHeight={24}
                    closeOnScan={true}
                    textButton="Найти"
                    scannerText="Поиск набора"
                    formats={["Any"]}
                  />
            </div>
        </div>
        {docData && (
            <div className={styles.docName}>
                {/* <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
                  {docData.docState}
                </div> */}
                {docData.prodName}
            </div>
        )}
        
        {/* Kit Progress Bar */}
        {docData && (
            <div className={styles.progressSection} style={{marginTop: '12px'}}>
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

        {/* Items Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>Товары в наборе</span>
            <span><strong>{codes.length}</strong> из <strong>{SET_SIZE}</strong></span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${isComplete ? styles.progressFillComplete : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content - List of Codes */}
      <main className={styles.content}>
        {codes.length === 0 ? (
          <div className={styles.emptyState}>
             {docData?.kitDetail && (
                <div style={{marginBottom: '20px', textAlign: 'left', width: '100%', maxWidth: '300px'}}>
                    <strong>Состав набора:</strong>
                    <ul style={{paddingLeft: '20px', marginTop: '5px'}}>
                        {docData.kitDetail.map((item, idx) => (
                            <li key={idx} style={{marginBottom: '4px'}}>
                                {item.prodName} — {item.amount} шт.
                            </li>
                        ))}
                    </ul>
                </div>
             )}
            <p>Сканируйте коды камерой или сделайте фото.</p>
          </div>
        ) : (
          <div className={styles.codesList}>
            {codes.map((code, index) => (
              <div key={`${code}-${index}`} className={styles.codeItem}>
                <span className={styles.codeText}>{code}</span>
                {/* <button 
                  className={styles.removeButton}
                  onClick={() => removeCode(index)}
                  aria-label="Удалить код"
                >
                  &times;
                </button> */}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer - Actions */}
      <footer className={styles.footer}>
        {!isComplete && (
          <div className={styles.scanButtons}>
            {/* Кнопка Live сканера */}
            <CameraScanner 
              onScan={handleLiveScan} 
              expectedCount={Math.max(1, SET_SIZE - codes.length)}
              existingCodes={codes}
              targetTotal={SET_SIZE}
              className={`${styles.button} ${styles.liveScanButton}`} 
              iconWidth={32}
              iconHeight={32}
              validateCode={validateCode}
            />

            {/* Кнопка ФОТО сканирования (Камера) */}
            <button 
              className={`${styles.button} ${styles.cameraButton}`}
              onClick={() => cameraInputRef.current?.click()}
            > Фото
            </button>

            {/* Кнопка Галереи */}
            <button 
              className={`${styles.button} ${styles.uploadButton}`}
              onClick={() => galleryInputRef.current?.click()}
            >
              Галерея
            </button>
          </div>
        )}
        
        {kitNum ? (
            <div style={{display: 'flex', gap: '8px', width: '100%', marginTop: '10px'}}>
                 <button 
                  className={styles.button}
                  style={{ backgroundColor: '#f44336', color: 'white', flex: 1, padding: '8px', fontSize: '0.9rem' }}
                  onClick={handleDeleteKit}
                >
                  Удалить
                </button>
                
                <button 
                  className={styles.button}
                  style={{ backgroundColor: '#2196f3', color: 'white', flex: 1, padding: '8px', fontSize: '0.9rem' }}
                  onClick={handleChangeKit}
                >
                  Изменить
                </button>

                {isComplete && (
                    <button 
                      className={styles.button}
                      style={{ backgroundColor: '#ff9800', color: 'white', flex: 1, padding: '8px', fontSize: '0.9rem' }}
                      onClick={handlePrintLabel}
                    >
                      Печать
                    </button>
                )}
            </div>
        ) : (
            <button 
              className={styles.button}
              style={{ backgroundColor: isComplete ? '#4caf50' : '#e0e0e0', color: isComplete ? 'white' : '#888' }}
              onClick={handleSubmit}
              disabled={!isComplete}
            >
              {isComplete ? 'Отправить набор' : 'Наполните набор'}
            </button>
        )}
      </footer>

      {/* Hidden Inputs */}
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

      {/* Modals */}
      <ReviewModal 
        isOpen={isReviewOpen}
        data={reviewData}
        onConfirm={handleReviewConfirm}
        onRetake={handleReviewRetake}
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
            <button 
              className='popup-error__button'
              onClick={() => setErrorText(null)}
            >
              OK
            </button>
          </div>
        </Popup>
      )}

      {successText && (
        <Popup
          isOpen={!!successText}
          onClose={handleSuccessClose}
          title="" /* Empty title to prevent floating outside card */
          containerClassName={styles.successPopup}
        >
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Успешно!</h2>
            <p className={styles.successMessage}>{successText}</p>
            <button 
              className={styles.successButton}
              onClick={handleSuccessClose}
            >
              Продолжить
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default KitAggregation;
