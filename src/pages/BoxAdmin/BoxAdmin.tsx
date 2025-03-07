import { useState, useRef, useEffect } from "react";
import styles from "./BoxAdmin.module.css";
import scanSuccessSound from "../../assets/scanSuccess.mp3";
import scanErrorSound from "../../assets/scanFailed.mp3";

const BoxAdmin = () => {
  const [scannedCodes, setScannedCodes] = useState<string>("");
  const [codesList, setCodesList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const mock = {
    cellCode: "",
    groups: {
      matrixCodes:{
        codes:[ 
        "1234567890",
        "1234567890",
        "1234567890",
        "1234567890",
        "1234567890",
        "1234567890",
        "1234567890",
        "1234567890",
      ],
      count: 8,
    },
    },
  }
  
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

  // Автофокус на поле ввода при загрузке
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Функция для воспроизведения звука без задержки
  const playSound = (isSuccess: boolean) => {
    const audioElement = isSuccess ? successAudioRef.current : errorAudioRef.current;
    
    if (audioElement) {
      // Сбрасываем текущее воспроизведение и начинаем заново
      audioElement.pause();
      audioElement.currentTime = 0;
      
      // Воспроизводим звук
      const playPromise = audioElement.play();
      
      // Обрабатываем возможные ошибки
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Ошибка воспроизведения звука:', error);
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setScannedCodes(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scannedCodes.trim()) {
      const code = scannedCodes.trim();

      if (!codesList.includes(code)) {
        setCodesList((prev) => [...prev, code]);
        playSound(true); // Успешное сканирование 
      } else {
        playSound(false); // Дублирование кода
      }

      // Очищаем поле ввода
      setScannedCodes("");
    }
  };

  const handleRemoveCode = (codeToRemove: string) => {
    setCodesList((prev) => prev.filter((code) => code !== codeToRemove));
  };

  const handleProcessCodes = () => {
    alert("Коды успешно обработаны!");
    setCodesList([]);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Упаковка товаров</h1>
      <input
        ref={inputRef}
        className={styles.scanInput}
        type="text"
        value={scannedCodes}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Data Matrix код..."
        autoFocus
      />

      {codesList.length > 0 ? (
        <div className={styles.codesContainer}>
          <h2 className={styles.codesTitle}>Отсканированные коды: {codesList.length}</h2>
          <ul className={styles.codesList}>
            {codesList.map((code, index) => (
              <li key={index} className={styles.codeItem}>
                <span>{code}</span>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveCode(code)}
                  aria-label="Удалить код"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={styles.instructions}>
          <p>Отсканируйте Data Matrix коды для упаковки товаров</p>
        </div>
      )}
      <div className={styles.buttonContainer}>
        <button
          className={styles.processButton}
          onClick={handleProcessCodes}
          aria-label="Обработать"
          disabled={codesList.length === 0}
        >
            <span>Обработать коды ({codesList.length})</span>
        </button>
        <button
          className={styles.processButton}
          onClick={handleProcessCodes}
          aria-label="Обработать"
          disabled={codesList.length === 0}
        >
            <span>Новая группа</span>
        </button>
      </div>
    </div>
  );
};

export default BoxAdmin;
