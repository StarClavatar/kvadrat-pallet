import { useState, useRef, useEffect, useContext } from "react";
import styles from "./BoxAdmin.module.css";
import scanSuccessSound from "../../assets/scanSuccess.mp3";
import scanErrorSound from "../../assets/scanFailed.mp3";
import { ValueContext } from "../../context/valueContext";
import { useNavigate, useParams } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { sendInventoryBoxesToServer } from "../../api/sentInventoryBoxes";
import DropdownIcon from "../../assets/dropdownIcon";
import cn from "classnames";
// Интерфейс для группы кодов
interface CodeGroup {
  codes: string[];
  id: number;
}

// Интерфейс для данных ячейки в localStorage
interface CellStorageData {
  codesList: string[];
  codeGroups: CodeGroup[];
  currentGroupId: number;
  lastUpdated: number; // Timestamp последнего обновления
}

// Функция для получения ключа localStorage для конкретной ячейки
const getCellStorageKey = (cellCode: string) => `cell_data_${cellCode}`;

// Функция для сохранения данных ячейки в localStorage
const saveCellDataToStorage = (
  cellCode: string,
  codesList: string[],
  codeGroups: CodeGroup[],
  currentGroupId: number
) => {
  if (!cellCode) return;

  const data: CellStorageData = {
    codesList,
    codeGroups,
    currentGroupId,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(getCellStorageKey(cellCode), JSON.stringify(data));
  } catch (error) {
    console.error("Ошибка при сохранении данных в localStorage:", error);
  }
};

// Функция для загрузки данных ячейки из localStorage
const loadCellDataFromStorage = (cellCode: string): CellStorageData | null => {
  if (!cellCode) return null;

  try {
    const storedData = localStorage.getItem(getCellStorageKey(cellCode));
    if (!storedData) return null;

    return JSON.parse(storedData) as CellStorageData;
  } catch (error) {
    console.error("Ошибка при загрузке данных из localStorage:", error);
    return null;
  }
};

// Функция для очистки данных ячейки в localStorage
const clearCellDataInStorage = (cellCode: string) => {
  if (!cellCode) return;

  try {
    localStorage.removeItem(getCellStorageKey(cellCode));
  } catch (error) {
    console.error("Ошибка при очистке данных в localStorage:", error);
  }
};

const BoxAdmin = () => {
  const { boxAdminData, setBoxAdminData } = useContext(ValueContext);
  const { pinAuthData } = useContext(PinContext);
  const { cellCode: urlCellCode } = useParams<{ cellCode: string }>();
  const [scannedCodes, setScannedCodes] = useState<string>("");
  const [codesList, setCodesList] = useState<string[]>([]);
  // Состояние для групп кодов
  const [codeGroups, setCodeGroups] = useState<CodeGroup[]>([
    { codes: [], id: 1 },
  ]);
  const [currentGroupId, setCurrentGroupId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Состояние для отслеживания развернутых групп
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {}
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // Получаем текущий код ячейки (из URL или из контекста)
  const currentCellCode = urlCellCode 
    ? decodeURIComponent(urlCellCode) 
    : boxAdminData?.cellCode;

  // Устанавливаем код ячейки из URL-параметра в контекст, если он есть
  useEffect(() => {
    if (
      urlCellCode &&
      (!boxAdminData?.cellCode || boxAdminData.cellCode !== urlCellCode)
    ) {
      setBoxAdminData({ cellCode: urlCellCode });
    }
  }, [urlCellCode, boxAdminData, setBoxAdminData]);

  // Загружаем данные из localStorage при монтировании компонента
  useEffect(() => {
    if (currentCellCode) {
      const storedData = loadCellDataFromStorage(currentCellCode);

      if (storedData) {
        setCodesList(storedData.codesList);
        setCodeGroups(storedData.codeGroups);
        setCurrentGroupId(storedData.currentGroupId);
      }
    }
  }, [currentCellCode]);

  // Сохраняем данные в localStorage при изменении данных
  useEffect(() => {
    if (currentCellCode) {
      saveCellDataToStorage(
        currentCellCode,
        codesList,
        codeGroups,
        currentGroupId
      );
    }
  }, [currentCellCode, codesList, codeGroups, currentGroupId]);

  // Перенаправляем на страницу сканирования ячейки, если код ячейки не указан
  useEffect(() => {
    if (!urlCellCode && !boxAdminData?.cellCode) {
      navigate("/scan-cell");
    }
  }, [urlCellCode, boxAdminData, navigate]);

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

  // Возвращаем фокус на инпут при клике в любое место страницы
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    };

    // Добавляем обработчик клика на весь документ
    document.addEventListener('click', handleClick);
    
    // Очищаем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isLoading]);

  // Функция для воспроизведения звука без задержки
  const playSound = (isSuccess: boolean) => {
    const audioElement = isSuccess
      ? successAudioRef.current
      : errorAudioRef.current;

    if (audioElement) {
      // Сбрасываем текущее воспроизведение и начинаем заново
      audioElement.pause();
      audioElement.currentTime = 0;

      // Воспроизводим звук
      const playPromise = audioElement.play();

      // Обрабатываем возможные ошибки
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Ошибка воспроизведения звука:", error);
        });
      }
    }
  };

  const handleRealInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log({newValue, newValueLength: newValue.length})
    setScannedCodes(newValue);
    e.target.value = "";

    const trimmedCode = newValue.trim();
    if (trimmedCode && (trimmedCode.length === 38 || trimmedCode.length === 85)) {
      console.log({
        code: trimmedCode,
        currentCellCode: currentCellCode,
      });

      if (trimmedCode === currentCellCode) {
        playSound(false);
        setScannedCodes("");
        return;
      }

      if (!codesList.includes(trimmedCode)) {
        setCodesList((prev) => [...prev, trimmedCode]);

        setCodeGroups((prevGroups) => {
          const updatedGroups = [...prevGroups];
          const currentGroupIndex = updatedGroups.findIndex(
            (group) => group.id === currentGroupId
          );

          if (currentGroupIndex !== -1) {
            updatedGroups[currentGroupIndex] = {
              ...updatedGroups[currentGroupIndex],
              codes: [...updatedGroups[currentGroupIndex].codes, trimmedCode],
            };
          }

          return updatedGroups;
        });

        playSound(true);
      } else {
        playSound(false);
      }

      setScannedCodes("");
    }
  };

  const handleRemoveCode = (codeToRemove: string) => {
    setCodesList((prev) => prev.filter((code) => code !== codeToRemove));

    setCodeGroups((prevGroups) => {
      return prevGroups.map((group) => ({
        ...group,
        codes: group.codes.filter((code) => code !== codeToRemove),
      }));
    });
  };

  // Функция для создания новой группы
  const handleNewGroup = () => {
    const currentGroup = codeGroups.find(
      (group) => group.id === currentGroupId
    );

    if (currentGroup && currentGroup.codes.length > 0) {
      const newGroupId = Math.max(...codeGroups.map((group) => group.id)) + 1;
      setCodeGroups((prev) => [...prev, { codes: [], id: newGroupId }]);
      setCurrentGroupId(newGroupId);

      playSound(true);

      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      alert("Сначала отсканируйте хотя бы один код для текущей группы");
      playSound(false);
    }
  };

  // Функция для отправки данных на сервер
  const sendDataToServer = async () => {
    if (!currentCellCode || codesList.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tsdUUID = localStorage.getItem("tsdUUID");

      const result = await sendInventoryBoxesToServer(
        pinAuthData?.pinCode,
        tsdUUID,
        currentCellCode,
        codesList
      );

      console.log("Успешный ответ:", result);

      setCodesList([]);
      setCodeGroups([{ codes: [], id: 1 }]);
      setCurrentGroupId(1);

      if (currentCellCode) {
        clearCellDataInStorage(currentCellCode);
      }

      playSound(true);

      alert("Коды успешно обработаны!");
    } catch (error) {
      console.error("Ошибка при отправке данных:", error);
      setError(error instanceof Error ? error.message : "Неизвестная ошибка");

      playSound(false);

      alert(
        `Ошибка: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
    } finally {
      setIsLoading(false);

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleProcessCodes = () => {
    sendDataToServer();
  };

  // Общее количество отсканированных кодов
  const totalCodesCount = codesList.length;

  // Функция для переключения состояния развернутости группы
  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className={styles.container}>

      {currentCellCode && (
        <div className={styles.cellInfo}>
          <span className={styles.title}>Ячейка:</span>
          <span className={styles.cellValue}>{currentCellCode}</span>
        </div>
      )}

      {/* "Реальный" input (скрытый) */}
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
        onChange={handleRealInputChange}
        autoFocus
        disabled={isLoading}
      />

      {/* "Фейковый" input (видимый) */}
      <div
        className={styles.scanInput}
        onClick={() => inputRef.current?.focus()}
      >
        {scannedCodes || <span className={styles.placeholder}>Отсканируйте код...</span>}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {totalCodesCount > 0 ? (
        <div className={styles.codesContainer}>
          <h2 className={styles.codesTitle}>
            Всего кодов:<span className={cn(styles.codesCount, styles.codesCountMl)}>{totalCodesCount}</span>
          </h2>

          {codeGroups.map(
            (group, groupIndex) =>
              group.codes.length > 0 && (
                <div key={group.id} className={styles.codeGroup}>
                  <ul className={styles.codesList}>
                    {group.codes.length > 0 && (
                      <>
                        <div
                          className={`${styles.dropdownControl} ${
                            expandedGroups[group.id] ? styles.hidden : ""
                          }`}
                          onClick={() => toggleGroupExpand(group.id)}
                        >
                          <span>
                            В группе{" "}
                            <span className={styles.codesCount}>
                              {group.codes.length}
                            </span>{" "}
                            шт.
                          </span>
                          <span className={styles.dropdownArrow}>
                            <DropdownIcon />
                          </span>
                        </div>

                          {expandedGroups[group.id] && (
                            <div
                              className={styles.collapseButton}
                              onClick={() => toggleGroupExpand(group.id)}
                            >
                              <span>
                            В группе{" "}
                            <span className={styles.codesCount}>
                              {group.codes.length}
                            </span>{" "}
                            шт.
                              </span>
                              <span className={styles.dropdownArrowOpened}>
                                <DropdownIcon />
                              </span>
                            </div>
                          )}
                        <div
                          className={`${styles.expandableList} ${
                            expandedGroups[group.id] ? styles.expanded : ""
                          }`}
                        >
                          {group.codes.map((code, index) => (
                            <li
                              key={`${group.id}-extra-${index}`}
                              className={styles.codeItem}
                            >
                              <span>{code}</span>
                              <button
                                className={styles.removeButton}
                                onClick={() => handleRemoveCode(code)}
                                aria-label="Удалить код"
                                disabled={isLoading}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </div>
                      </>
                    )}
                  </ul>
                </div>
              )
          )}
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
          disabled={totalCodesCount === 0 || isLoading}
        >
          {isLoading ? (
            <span>Обработка...</span>
          ) : (
            <span>Обработать коды ({totalCodesCount})</span>
          )}
        </button>
        <button
          className={styles.processButton}
          onClick={handleNewGroup}
          aria-label="Новая группа"
          disabled={isLoading}
        >
          <span>Новая группа</span>
        </button>
      </div>
      <button
        className={styles.backButton}
        onClick={() => navigate("/scan-cell")}
        disabled={isLoading}
      >
        Сменить ячейку
      </button>
    </div>
  );
};

export default BoxAdmin;
