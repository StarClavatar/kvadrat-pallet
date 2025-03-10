import { useState, useContext, FormEvent, useRef, useEffect } from "react";
import scanSuccessSound from "../../assets/scanSuccess.mp3";
import scanErrorSound from "../../assets/scanFailed.mp3";
import { useNavigate } from "react-router-dom";
import { ValueContext } from "../../context/valueContext";
import Popup from "../../components/Popup/Popup";

const ScanCell = () => {
  const { setBoxAdminData } = useContext(ValueContext);
  const [cellCode, setCellCode] = useState<string>("");
  const navigate = useNavigate();
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
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

  const handleCellCodeSubmit = async (cellCode: string) => {
    if (popupError) return;
    if (cellCode?.length > 0) {
      try {
        // Здесь можно добавить проверку кода ячейки через API
        
        // Сохраняем код ячейки в контекст
        setBoxAdminData({ cellCode });
        
        // Воспроизводим звук успеха
        playSound(true);
        
        // Переходим на страницу с кодом ячейки в URL
        navigate(`/cell/${cellCode}`);
        
        // Очищаем поле ввода
        setCellCode("");
      } catch (error) {
        // В случае ошибки показываем попап
        setPopupErrorText("Ошибка при обработке кода ячейки");
        setPopupError(true);
        playSound(false);
        setCellCode("");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCellCodeSubmit(cellCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && cellCode.trim()) {
      handleCellCodeSubmit(cellCode.trim());
    }
  };

  if (popupError) {
    return (
      <Popup
        title="Ошибка"
        containerClassName="popup-error"
        isOpen={popupError}
        onClose={() => {
          setPopupError(false);
        }}
      >
        <div className="popup-error__container">
          <h4 className="popup-error__text">{popupErrorText}</h4>
          <button
            className="popup-error__button"
            onClick={() => setPopupError(false)}
          >
            продолжить
          </button>
        </div>
      </Popup>
    );
  }

  return (
    <div className="new-pallet">
      <h2 className="new-pallet__heading">Отсканируйте номер ячейки</h2>
      <form className="pallet-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          required
          type="text"
          placeholder="Код ячейки"
          className="input pallet-form__input"
          value={cellCode}
          onChange={(e) => setCellCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={({ target }) => target.focus()}
          autoFocus
        />
        <button className="pallet-form__send-button" type="submit">
          Отправить
        </button>
      </form>
      <button
        className="exit-button_new-pallet"
        onClick={() => navigate("/workmode")}
      >
        Выбор режима работы
      </button>
    </div>
  );
};

export default ScanCell; 