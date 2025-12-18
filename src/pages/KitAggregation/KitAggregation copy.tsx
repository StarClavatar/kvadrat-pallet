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
import PrintIcon from '../../assets/printIcon';

const KitAggregation = () => {
  const location = useLocation();
  const { pinAuthData } = useContext(PinContext);

  // Extract doc data passed from ScanDocKit
  const [docData, setDocData] = useState<GetDocResponse>(location.state?.docData);

  // Calculate SET_SIZE dynamically based on kitDetail
  const SET_SIZE = useMemo(() => {
    if (!docData?.kitDetail) return 4; // Default fallback
    return docData.kitDetail.reduce((sum, item) => sum + item.amount, 0);
  }, [docData]);

  // Validator function with Count Check
  const validateCode = (code: string) => {
    if (!docData?.kitDetail) return false;
    const item = docData.kitDetail.find(d => code.includes(d.GTIN));
    if (!item) return false;
    
    // Allow scanning if GTIN matches, backend will validate counts/duplicates
    return true; 
  };

  // Состояние для кодов в наборе
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Модальное окно для просмотра результатов сканирования (ФОТО)
  const [reviewData, setReviewData] = useState<ScanResultData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // ОШИБКИ и УСПЕХ
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Refs для камеры (ФОТО) и галереи
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- ОБРАБОТКА в рил тайме ---
  const handleLiveScan = (scannedCodes: string[]) => {
    let addedCount = 0;
    const newCodesList = [...codes];
    // Create a map of current counts to track additions within this batch
    const countsCheck: Record<string, number> = {};

    // Initialize with current counts
    docData?.kitDetail.forEach(item => {
      countsCheck[item.GTIN] = newCodesList.filter(c => c.includes(item.GTIN)).length;
    });

    for (const cleanCode of scannedCodes) {
      if (newCodesList.length >= SET_SIZE) break;

      const item = docData?.kitDetail.find(d => cleanCode.includes(d.GTIN));
      if (item) {
        // Check limits
        if ((countsCheck[item.GTIN] || 0) < item.amount) {
          if (!newCodesList.includes(cleanCode)) {
            newCodesList.push(cleanCode);
            countsCheck[item.GTIN] = (countsCheck[item.GTIN] || 0) + 1;
            addedCount++;
          }
        }
      }
    }

    if (addedCount > 0) {
      const updatedCodes = newCodesList;
      setCodes(updatedCodes);

      // Auto-submit if set is complete
      if (updatedCodes.length === SET_SIZE && docData) {
        // We need to trigger submission. 
        // Since handleSubmit relies on 'codes' state which might not be updated yet in this closure,
        // we should call createKit directly with updatedCodes.
        setIsLoading(true);
        createKit({
          pinCode: String(pinAuthData?.pinCode),
          tsdUUID: String(localStorage.getItem("tsdUUID")),
          docNum: docData.docNum,
          scanCodes: updatedCodes,
        }).then(response => {
          if (response.error) {
            setErrorText(response.error);
          } else {
            setSuccessText("Набор успешно агрегирован!");
            setDocData(response);
            setCodes([]);
          }
        }).catch(err => {
          setErrorText(err.message || String(err));
        }).finally(() => {
          setIsLoading(false);
        });
      }
    }
  };
  // -------------------------------------------

  // --- ОБРАБОТКА ФОТО (МАССОВОЕ СКАНИРОВАНИЕ В РИЛ ТАЙМЕ) ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    setIsLoading(true);
    try {
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewConfirm = () => {
    if (reviewData && reviewData.newCodes.length > 0) {
      // Validate counts again before adding (just in case processScanImage logic changes or is bypassed)
      const newCodesList = [...codes];
      const countsCheck: Record<string, number> = {};
      docData?.kitDetail.forEach(item => {
        countsCheck[item.GTIN] = newCodesList.filter(c => c.includes(item.GTIN)).length;
      });

      const validNewCodes: string[] = [];

      for (const code of reviewData.newCodes) {
        if (newCodesList.length + validNewCodes.length >= SET_SIZE) break;

        const item = docData?.kitDetail.find(d => code.includes(d.GTIN));
        if (item) {
          if ((countsCheck[item.GTIN] || 0) < item.amount) {
            validNewCodes.push(code);
            countsCheck[item.GTIN] = (countsCheck[item.GTIN] || 0) + 1;
          }
        }
      }

      if (validNewCodes.length > 0) {
        setCodes(prev => [...prev, ...validNewCodes]);
      }
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
      } else {
        setDocData(response);
        if (response.KitNum) {
          setCodes(response.scanCodes || []);
          setSuccessText(`Набор ${response.KitNum} найден`);
        }
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeKitScan = (scannedCodes: string[]) => {
    let addedCount = 0;
    const newCodesList = [...codes];
    const countsCheck: Record<string, number> = {};

    docData?.kitDetail.forEach(item => {
      countsCheck[item.GTIN] = newCodesList.filter(c => c.includes(item.GTIN)).length;
    });

    for (const cleanCode of scannedCodes) {
      if (newCodesList.length >= SET_SIZE) break;

      const item = docData?.kitDetail.find(d => cleanCode.includes(d.GTIN));
      if (item) {
        if ((countsCheck[item.GTIN] || 0) < item.amount) {
          if (!newCodesList.includes(cleanCode)) {
            newCodesList.push(cleanCode);
            countsCheck[item.GTIN] = (countsCheck[item.GTIN] || 0) + 1;
            addedCount++;
          }
        }
      }
    }

    if (addedCount > 0) {
      setCodes(newCodesList);
      // Trigger changeKit
      performChangeKit(newCodesList);
    }
  };

  const performChangeKit = async (currentCodes: string[]) => {
    if (!docData?.KitNum) return;
    setIsLoading(true);
    try {
      const response = await changeKit({
        pinCode: String(pinAuthData?.pinCode),
        tsdUUID: String(localStorage.getItem("tsdUUID")),
        kitNum: docData.KitNum,
        scanCodes: currentCodes,
        docNum: docData.docNum
      });
      if (response.error) {
        setErrorText(response.error);
      } else {
        setDocData(response);
        setSuccessText("Набор обновлен");
        setCodes(response.scanCodes || []);
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKit = async () => {
    if (!docData?.KitNum) {
      alert('KitNum не найден')
      return
    };
    if (!window.confirm("Вы уверены, что хотите удалить набор?")) return;

    setIsLoading(true);
    try {
      const response = await deleteKit({
        pinCode: String(pinAuthData?.pinCode),
        tsdUUID: String(localStorage.getItem("tsdUUID")),
        kitNum: docData.KitNum,
        docNum: docData.docNum
      });
      if (response.error) {
        setErrorText(response.error);
      } else {
        setDocData(response);
        setSuccessText("Набор удален");
        setCodes([]);
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!docData?.KitNum) return;
    setIsLoading(true);
    try {
      const response = await printLabel({
        pinCode: String(pinAuthData?.pinCode),
        tsdUUID: String(localStorage.getItem("tsdUUID")),
        kitNum: docData.KitNum,
        docNum: docData.docNum
      });
      if (response.error) {
        setErrorText(response.error);
      } else {
        setDocData(response);
        setSuccessText("Этикетка отправлена на печать");
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  // const removeCode = (indexToRemove: number) => {
  //   setCodes(prev => prev.filter((_, index) => index !== indexToRemove));
  // };

  // const handleSubmit = async () => {
  //   if (codes.length !== SET_SIZE || !docData) return;

  //   setIsLoading(true);
  //   try {
  //     const response = await createKit({
  //       pinCode: String(pinAuthData?.pinCode),
  //       tsdUUID: String(localStorage.getItem("tsdUUID")),
  //       docNum: docData.docNum,
  //       scanCodes: codes,
  //     });

  //     if (response.error) {
  //       setErrorText(response.error);
  //     } else {
  //       setSuccessText("Набор успешно агрегирован!");
  //       setDocData(response);
  //       setCodes([]); // Clear only after success and updating docData
  //     }
  //   } catch (err: any) {
  //     setErrorText(err.message || String(err));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSuccessClose = () => {
    setSuccessText(null);
    setCodes([]); // Clear the current set to start a new one
    // We stay on the same page
  };

  // const isComplete = codes.length === SET_SIZE;
  // const progressPercent = (codes.length / SET_SIZE) * 100;

  // Kit Progress Calculation
  const packsCollected = docData?.collectedCount || 0;
  const packsTotal = docData?.packCount || 1; // Avoid division by zero
  const packsProgressPercent = Math.min(100, (packsCollected / packsTotal) * 100);

  if (isLoading) return <Loader />;

  return (
    <div className={styles.container}>
      {/* Header */}
      {docData?.KitNum && <h4 className={styles.kitNum} style={{ backgroundColor: docData?.collectedCount == docData?.packCount ? "rgba(76, 175, 80, 0.4)" : "rgb(255,221,3)" }}>Набор {docData.KitNum}</h4>}
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p className={styles.docNum}>Заказ №{docData?.docNum}</p>
          </div>
          {/* <div style={{marginLeft: '10px'}}> */}
          <CameraScanner
            onScan={handleFindKitScan}
            expectedCount={1}
            className={`${styles.button} ${styles.findKitButton}`}
            iconWidth={24}
            iconHeight={24}
            closeOnScan={true}
            textButton="Поиск набора"
            scannerText="Поиск набора"
            formats={["DataMatrix"]}
          />
          {/* </div> */}
        </div>
        {docData && (
          <div className={styles.docName}>
            <div className={styles.docState} style={{ backgroundColor: docData.docState === 'собран' ? 'rgb(76, 175, 79)' : 'rgb(255,221,3)' }}>
              {docData.docState}
            </div>
            {docData.prodName}
          </div>
        )}

        {/* Kit Progress Bar */}
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

        {/* Items Progress Bar */}
        <div className={styles.progressSection}>
          {/* <div className={styles.progressInfo}>
            <span>Товары в наборе</span>
            <span><strong>{codes.length}</strong> из <strong>{SET_SIZE}</strong></span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${isComplete ? styles.progressFillComplete : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div> */}
        </div>
      </header>

      {/* Content - List of Codes */}
      <main className={styles.content}>
        {/* {codes.length === 0 ? ( */}
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
        {/* ) : ( */}
        {/* <div className={styles.codesList}>
            {codes.map((code, index) => (
              <div key={`${code}-${index}`} className={styles.codeItem}>
                <span className={styles.codeText}>{code}</span>
                <button 
                  className={styles.removeButton}
                  onClick={() => removeCode(index)}
                  aria-label="Удалить код"
                >
                  &times;
                </button>
              </div>
            ))}
          </div> */}
        {/* )} */}
      </main>

      {/* Footer - Actions */}
      <footer className={styles.footer}>
        {/* {!isComplete && ( */}
        <div className={styles.scanButtons}>
          {/* Кнопка Live сканера */}
          <CameraScanner
            onScan={handleLiveScan}
            expectedCount={Math.max(1, SET_SIZE - codes.length)}
            existingCodes={codes}
            targetTotal={SET_SIZE}
            className={`${styles.button} ${styles.liveScanButton}`}
            iconWidth={32}
            textButton='Создать набор'
            scannerText='Сканируйте набор'
            iconHeight={32}
            validateCode={validateCode}
            closeOnScan={true}
          />

          {/* <button 
              className={`${styles.button} ${styles.cameraButton}`}
              onClick={() => cameraInputRef.current?.click()}
            > Фото
            </button>

            <button 
              className={`${styles.button} ${styles.uploadButton}`}
              onClick={() => galleryInputRef.current?.click()}
            >
              Галерея
            </button> */}
          {docData.KitNum && <button
            className={`${styles.button} ${styles.buttonPrint}`}
            onClick={() => window.confirm("Вы уверены, что хотите отправить этикетки на печать?") ? handlePrintLabel : null}
          >
            <PrintIcon color='black' size={40} />
          </button>}
        </div>
        {/* )} */}

        {docData?.KitNum &&
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <CameraScanner
              onScan={handleChangeKitScan}
              expectedCount={Math.max(1, SET_SIZE - codes.length)}
              existingCodes={codes}
              targetTotal={SET_SIZE}
              className={`${styles.button} ${styles.buttonEdit}`}
              iconWidth={32}
              textButton='Изменить набор'
              scannerText='Сканируйте новые банки для изменения в наборе'
              iconHeight={32}
              validateCode={validateCode}
              closeOnScan={true}
            />
            <button
              className={`${styles.button} ${styles.buttonDelete}`}
              onClick={handleDeleteKit}
            // disabled={ codes.length <= 0 }
            >
              Удалить набор
            </button>
          </div>
        }
        {/* <button 
        //       className={styles.button}
        //       style={{ backgroundColor: isComplete ? '#4caf50' : '#e0e0e0', color: isComplete ? 'white' : '#888' }}
        //       onClick={handleSubmit}
        //       disabled={!isComplete}
        //     >
        //       {isComplete ? 'Отправить набор' : 'Наполните набор'}
        //     </button> */}
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
          title=""
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
