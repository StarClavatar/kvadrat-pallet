import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomScanner } from '../../hooks/useCustomScanner';
import { PinContext } from '../../context/PinAuthContext';
import { ValueContext } from '../../context/valueContext';
import { putDisbandment } from '../../api/putDisbandment';
import Popup from '../../components/Popup/Popup';
import BackspaceIcon from '../../assets/backspaceIcon';
import scanSuccessSound from '../../assets/scanSuccess.mp3';
import scanErrorSound from '../../assets/scanFailed.mp3';
import './Disaggregation.css';

const STORAGE_KEY = 'disaggregation_codes';

const Disaggregation = () => {
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const { setIsLoading } = useContext(ValueContext);
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isMessageHiding, setIsMessageHiding] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [manualCode, setManualCode] = useState<string>('');
  
  // Аудио рефы
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Загрузка сохраненных кодов при монтировании компонента
  useEffect(() => {
    const savedCodes = localStorage.getItem(STORAGE_KEY);
    if (savedCodes) {
      try {
        const parsedCodes = JSON.parse(savedCodes);
        if (Array.isArray(parsedCodes)) {
          setCodes(parsedCodes);
        }
      } catch (error) {
        console.error('Ошибка при загрузке сохраненных кодов:', error);
      }
    }
  }, []);

  // Сохранение кодов в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  }, [codes]);

  // Инициализация аудио при монтировании компонента
  useEffect(() => {
    successAudioRef.current = new Audio(scanSuccessSound);
    errorAudioRef.current = new Audio(scanErrorSound);
    
    // Предварительная загрузка звуков
    successAudioRef.current.load();
    errorAudioRef.current.load();
    
    return () => {
      if (successAudioRef.current) {
        successAudioRef.current.pause();
        successAudioRef.current = null;
      }
      if (errorAudioRef.current) {
        errorAudioRef.current.pause();
        errorAudioRef.current = null;
      }
    };
  }, []);

  // Функция для воспроизведения звука без задержки
  const playSound = (isSuccess: boolean) => {
    const audioElement = isSuccess ? successAudioRef.current : errorAudioRef.current;
    
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Ошибка воспроизведения звука:', error);
        });
      }
    }
  };

  // Обработчик сканирования
  const handleScan = (scannedCode: string) => {
    addCode(scannedCode);
  };

  // Функция добавления кода (общая для сканирования и ручного ввода)
  const addCode = (code: string) => {
    // Очищаем код от пробелов
    const cleanCode = code.trim();
    
    // Проверяем длину кода (должен быть 20 символов)
    if (cleanCode.length !== 20) {
      playSound(false);
      showMessage('Код должен содержать 20 символов', 'error');
      return;
    }

    // Проверяем, что код не дублируется
    if (codes.includes(cleanCode)) {
      playSound(false);
      showMessage('Этот код уже добавлен', 'error');
      return;
    }

    // Добавляем код в список
    setCodes(prev => [...prev, cleanCode]);
    playSound(true);
    showMessage('Код успешно добавлен', 'success');
  };

  // Обработчик ручного ввода кода
  const handleManualCodeAdd = () => {
    if (manualCode.trim()) {
      addCode(manualCode);
      setManualCode(''); // Очищаем поле ввода после добавления
    }
  };

  // Обработчик нажатия Enter в поле ввода
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleManualCodeAdd();
    }
  };

  // Показать сообщение
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setIsMessageHiding(false);
    
    setTimeout(() => {
      setIsMessageHiding(true);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
        setIsMessageHiding(false);
      }, 300); // Время анимации исчезновения
    }, 2700); // Показываем 2.7 секунды, потом 0.3 секунды анимация исчезновения
  };

  // Удаление кода
  const removeCode = (index: number) => {
    setCodes(prev => prev.filter((_, i) => i !== index));
    showMessage('Код удален', 'success');
  };

  // Очистка всех кодов
  const clearAllCodes = () => {
    setCodes([]);
    localStorage.removeItem(STORAGE_KEY);
    showMessage('Все коды очищены', 'success');
  };


  // Отправка данных
  const handleSubmit = async () => {
    if (codes.length === 0) {
      showMessage('Добавьте хотя бы один код', 'error');
      return;
    }

    if (!pinAuthData?.pinCode || !pinAuthData?.tsdUUID) {
      showMessage('Ошибка авторизации', 'error');
      return;
    }

    // Обрабатываем коды: если начинается с 2 нулей - обрезаем их
    const processedCodes = codes.map(code => {
      if (code.startsWith('00')) {
        return code.substring(2);
      }
      return code;
    });

    // Формируем JSON для отправки
    const dataToSend = {
      pinCode: pinAuthData.pinCode.toString(),
      tsdUUID: pinAuthData.tsdUUID,
      codes: processedCodes
    };

    console.log('JSON для отправки:', JSON.stringify(dataToSend, null, 2));
    
    setIsLoading(true);
    try {
      const result = await putDisbandment(
        pinAuthData.pinCode.toString(),
        pinAuthData.tsdUUID,
        codes
      );

      if (result.error) {
        playSound(false);
        setPopupType('error');
        setPopupMessage(result.error);
        setShowPopup(true);
      } else {
        playSound(true);
        setPopupType('success');
        setPopupMessage('Данные успешно отправлены');
        setShowPopup(true);
        setCodes([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      playSound(false);
      setPopupType('error');
      setPopupMessage('Ошибка сети при отправке данных');
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Используем сканер
  useCustomScanner(handleScan, true);

  return (
    <div className="disaggregation">
      {/* Анимированное сообщение */}
      {message && (
        <div className={`disaggregation__message disaggregation__message--${messageType} ${isMessageHiding ? 'disaggregation__message--hiding' : ''}`}>
          {message}
        </div>
      )}

      {/* Фиксированный хедер */}
      <div className="disaggregation__header">
        <button 
          className="exit-button"
          onClick={() => navigate(-1)}
        >
          <BackspaceIcon color="#ffffff" />
        </button>
        <p className="disaggregation__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
      </div>

      {/* Компактная секция с заголовком и инструкцией */}
      <div className="disaggregation__compact-header">
        <div className="disaggregation__title-row">
          <p className="disaggregation__title">Разагрегация коробов</p>
          {codes.length > 0 && (
            <button
              className="disaggregation__clear-btn"
              onClick={clearAllCodes}
            >
              Очистить
            </button>
          )}
        </div>
        <p className="disaggregation__instruction">Сканируйте или введите код</p>
      </div>

      {/* Поле для ручного ввода кода */}
      <div className="disaggregation__manual-input">
        <div className="disaggregation__input-container">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Код (20 символов)"
            className="disaggregation__input"
            maxLength={20}
          />
          <button
            className="disaggregation__add-btn"
            onClick={handleManualCodeAdd}
            disabled={!manualCode.trim()}
          >
            +
          </button>
        </div>
      </div>

      {/* Список кодов */}
      <div className="disaggregation__codes">
        {codes.length === 0 ? (
          <p className="disaggregation__empty">Коды не добавлены</p>
        ) : (
          <div className="disaggregation__codes-list">
            {codes.map((code, index) => (
              <div key={index} className="disaggregation__code-item">
                <span className="disaggregation__code-text">{code}</span>
                <button
                  className="disaggregation__remove-btn"
                  onClick={() => removeCode(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка отправить внизу экрана */}
      <div className="disaggregation__submit-container">
        <button
          className="disaggregation__submit-btn"
          onClick={handleSubmit}
          disabled={codes.length === 0}
        >
          Отправить ({codes.length})
        </button>
      </div>

      {/* Popup для результатов отправки */}
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        containerClassName={popupType === 'error' ? 'popup-error' : 'popup-success'}
      >
        <div className={`popup__container popup__container--${popupType}`}>
          <h4 className={`popup__text popup__text--${popupType}`}>{popupMessage}</h4>
          <button
            className={`popup__button popup__button--${popupType}`}
            onClick={() => setShowPopup(false)}
          >
            {popupType === 'error' ? 'Понятно' : 'Отлично!'}
          </button>
        </div>
      </Popup>
    </div>
  );
};

export default Disaggregation;
