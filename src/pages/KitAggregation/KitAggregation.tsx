import { useState, useRef, useContext } from 'react';
import styles from './KitAggregation.module.css';
import { useNavigate } from 'react-router-dom';
import { addSet } from '../../api/addSet';
import { PinContext } from '../../context/PinAuthContext';
import Loader from '../../components/Loader/Loader';
import Popup from '../../components/Popup/Popup';
import { BarCodeIcon } from '../../assets/barCodeIcon';
import { processScanImage, ScanResultData } from './utils/imageProcessing';
import ReviewModal from './components/ReviewModal';
import CameraScanner from '../../components/CameraScanner/CameraScanner';

const SET_SIZE = 4; // Количество баночек в наборе (Mocked from backend)

const KitAggregation = () => {
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  
  // Состояние для кодов в наборе
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Модальное окно для просмотра результатов сканирования (ФОТО)
  const [reviewData, setReviewData] = useState<ScanResultData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  // ОШИБКИ
  const [errorText, setErrorText] = useState<string | null>(null);

  // Refs для камеры (ФОТО) и галереи
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- ОБРАБОТКА Live Scan ---
  const handleLiveScan = (scannedCodes: string[]) => {
    // CameraScanner возвращает массив уже очищенных кодов
    
    let addedCount = 0;
    const newCodesList = [...codes];

    for (const cleanCode of scannedCodes) {
      if (newCodesList.length >= SET_SIZE) break; // Stop if full
      
      if (!newCodesList.includes(cleanCode)) {
        newCodesList.push(cleanCode);
        addedCount++;
      }
    }

    // CameraScanner сам показывает, что кодов нет, и кнопку блочит, 
    // но если вдруг сюда пришло пустое, ничего страшного.
    if (addedCount > 0) {
       setCodes(newCodesList);
    }
  };
  // -------------------------------------------

  // --- ОБРАБОТКА ФОТО (МАССОВОЕ СКАНИРОВАНИЕ) ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Сброс значения input для возможности повторного выбора того же файла
    event.target.value = '';

    setIsLoading(true);
    try {
      const result = await processScanImage(file, codes, SET_SIZE);
      
      if (result.totalFound === 0) {
        setErrorText("На изображении не найдено штрих-кодов.");
      } else {
        setReviewData(result);
        setIsReviewOpen(true);
      }
    } catch (err) {
      console.error(err);
      setErrorText("Ошибка обработки изображения.");
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

  const removeCode = (indexToRemove: number) => {
    setCodes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (codes.length !== SET_SIZE) return;

    setIsLoading(true);
    try {
      const response = await addSet({
        pin: String(pinAuthData?.pinCode),
        tsd: String(localStorage.getItem("tsdUUID")),
        codes: codes,
      });

      if (response.error) {
        setErrorText(response.error);
      } else {
        alert("Набор успешно агрегирован!");
        navigate('/workmode');
      }
    } catch (err) {
      setErrorText("Сетевая ошибка при отправке набора.");
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = codes.length === SET_SIZE;
  const progressPercent = (codes.length / SET_SIZE) * 100;

  if (isLoading) return <Loader />;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Агрегация набора</h1>
        
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>Прогресс</span>
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
            <p>Набор пуст.<br/>Сканируйте коды камерой или сделайте фото.</p>
          </div>
        ) : (
          <div className={styles.codesList}>
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
        
        <button 
          className={styles.button}
          style={{ backgroundColor: isComplete ? '#4caf50' : '#e0e0e0', color: isComplete ? 'white' : '#888' }}
          onClick={handleSubmit}
          disabled={!isComplete}
        >
          {isComplete ? 'Отправить набор' : 'Наполните набор'}
        </button>
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
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>{errorText}</p>
            <button 
              className={styles.button} 
              style={{ marginTop: '10px', backgroundColor: '#2196f3', color: 'white' }}
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

export default KitAggregation;
