import React, { Dispatch, useContext, useState, useEffect } from "react";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import "./DeleteBoxInteractive.css";
import useScanDetection from "use-scan-detection";
import scanSuccessSound from "../../assets/scanSuccess.mp3";
import scanFailedSound from "../../assets/scanFailed.mp3";
import { deleteCart } from "../../api/deleteCart";
import { PinContext } from "../../context/PinAuthContext";
import { useParams } from "react-router-dom";
import Loader from "../Loader/Loader";
import { unshipPallet } from "../../api/unshipPallet";
import { TPallet } from "../../pages/Pallet/config";
import { ValueContext } from "../../context/valueContext";

interface DeleteBoxInteractiveProps {
  onClose: () => void;
  isPopupOpened?: boolean;
  setPallet: Dispatch<any>;
  type: "pallet" | "truck";
  pallet?: TPallet;
  deleteBoxInteractiveReset?: any;
}

const DeleteBoxInteractive: React.FC<DeleteBoxInteractiveProps> = ({
  onClose,
  isPopupOpened,
  setPallet,
  type,
  pallet,
}) => {
  const [step, setStep] = useState<number>(0); // Текущий шаг компонента
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false); // Флаг ошибки
  const successScanSound = new Audio(scanSuccessSound); // Звук успешного сканирования
  const [deleteErrorText, setDeleteErrorText] = useState<string>(""); // Текст ошибки
  const [loading, setLoading] = useState<boolean>(false); // Состояние загрузки
  const failedScanSound = new Audio(scanFailedSound); // Звук ошибки сканирования
  const { value, setValue, setIsLoading } = useContext(ValueContext); // Контекст для хранения значения сканирования
  const [responseComment, setResponseComment] = useState<string>(""); // Комментарий из ответа сервера

  const { pinAuthData } = useContext(PinContext); // Данные авторизации пин-кода
  const params = useParams(); // Параметры маршрута

  // Функция для сброса состояния компонента
  const deleteBoxInteractiveReset = () => {
    setStep(0);
    setValue("");
    setErrorOccurred(false);
    setDeleteErrorText("");
  };

  // Обработка сканирования штрих-кода
  useScanDetection({
    onComplete: (code) => {
      if (isPopupOpened && !errorOccurred) {
        successScanSound.play();
        const scannedCode = code.replace(/[^0-9]/g, ""); // Очищаем код от нецифровых символов
        setValue(scannedCode);

        const fetchScanned = async () => {
          try {
            setIsLoading(true);
            if (type === "pallet") {
              const response = await deleteCart(
                String(pinAuthData?.pinCode),
                String(pinAuthData?.tsdUUID),
                String(params.sscc),
                scannedCode
              );
              if (!response.error) {
                setIsLoading(false);
                setPallet(response);
                setResponseComment(response.comment || response.info);
                setStep(1); // Переход на следующий шаг только при успешном ответе
              } else {
                setIsLoading(false);
                setDeleteErrorText(response.error);
                setErrorOccurred(true);
              }  
            } else {
              const response = await unshipPallet(
                String(pinAuthData?.pinCode),
                String(pinAuthData?.tsdUUID),
                String(params.docId),
                scannedCode
              );
              if (!response.error) {
                setIsLoading(false);
                setPallet(response); // Устанавливаем новое состояние паллета
                setStep(1); // Переход на следующий шаг только при успешном ответе
              } else {
                setIsLoading(false);
                setDeleteErrorText(response.error);
                setErrorOccurred(true);
              }
            }
            
          } catch (error) {
            setIsLoading(false);
            setDeleteErrorText("Ошибка сети, попробуйте снова.");
            setErrorOccurred(true);
          }
        };
        fetchScanned();
      }
    },
    averageWaitTime: 20,
  });

  // Обработка кнопки "Завершить"
  const handleDelete = async () => {
    if (!errorOccurred && value) {
      // Проверяем, что нет ошибки и value задано
      setLoading(true);
      try {
        if (type === "pallet") {
          setIsLoading(true);
          const response = await deleteCart(
            String(pinAuthData?.pinCode),
            String(pinAuthData?.tsdUUID),
            String(params.sscc),
            value,
            pallet?.info,
            "next"
          );
          if (!response.error) {
            setIsLoading(false);
            setPallet(response); // Обновляем паллет
            onClose(); // Закрываем модалку
            deleteBoxInteractiveReset(); // Сбрасываем состояние
          } else {
            setIsLoading(false);
            setDeleteErrorText(response.error);
            setErrorOccurred(true);
          }
        } else {
          setIsLoading(true);
          const response = await unshipPallet(
            String(pinAuthData?.pinCode),
            String(pinAuthData?.tsdUUID),
            String(params.docId),
            value
          );
          if (!response.error) {
            setIsLoading(false);
            setPallet(response);
            setResponseComment(response.comment || response.info);
            onClose();
            deleteBoxInteractiveReset();
          } else {
            setIsLoading(false);
            setDeleteErrorText(response.error);
            setErrorOccurred(true);
          }
        }
      } catch (error) {
        setIsLoading(false);
        setDeleteErrorText("Ошибка сети, попробуйте снова.");
        setErrorOccurred(true);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (errorOccurred) {
      setStep(2); // Переключаем на слайд об ошибке
      failedScanSound.play();
    }
  }, [errorOccurred]);

  useEffect(() => {
    if (!isPopupOpened) {
      deleteBoxInteractiveReset(); // Сбрасываем состояние при закрытии модалки
    }
  }, [isPopupOpened]);

  return (
    <div className="swipeable-container">
      <div
        className={`slide ${step === 0 ? "slide_active" : "slide_next"} ${
          step === 2 ? "slide_error" : ""
        }`}
      >
        <input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          className="input box-delete__input"
          type="number"
          placeholder={`Отсканируйте код ${
            type === "pallet" ? "коробки" : "паллеты"
          } `}
        />
        <div className="box-delete__image-wrapper">
          <BarCodeIcon />
        </div>
        <button
          className="box-delete__next-button"
          disabled={Number(value) < 1 || loading}
          onClick={async () => {
            if (!errorOccurred && value) {
              setLoading(true);
              try {
                if (type === "pallet") {
                  const response = await deleteCart(
                    String(pinAuthData?.pinCode),
                    String(pinAuthData?.tsdUUID),
                    String(params.sscc),
                    value
                  );
                  if (!response.error) {
                    setPallet(response);
                    setStep(1);
                  } else {
                    setDeleteErrorText(response.error);
                    setErrorOccurred(true);
                  }
                } else {
                  const response = await unshipPallet(
                    String(pinAuthData?.pinCode),
                    String(pinAuthData?.tsdUUID),
                    String(params.docId),
                    value
                  );
                  if (!response.error) {
                    setPallet(response);
                    setResponseComment(response.comment || response.info);
                    setStep(1);
                  } else {
                    setDeleteErrorText(response.error);
                    setErrorOccurred(true);
                  }
                }
              } catch (error) {
                setDeleteErrorText("Ошибка сети, попробуйте снова.");
                setErrorOccurred(true);
              } finally {
                setLoading(false);
              }
            }
          }}
        >
          {loading ? "Загрузка..." : "Продолжить"}
        </button>
      </div>
      <div
        className={`slide slide_second ${
          step === 1 ? "slide_active" : "slide_next"
        }`}
      >
        <p className="slide-heading">{pallet?.info || responseComment || "Уберите паллету и нажмите завершить"}</p>

        {loading ? <Loader /> : null}
        <button
          className="slide__button"
          onClick={type === "pallet" ? handleDelete : onClose}
        >
          Завершить
        </button>
      </div>
      <div
        className={`slide slide_error ${
          step === 2 ? "slide_active" : "slide_next"
        }`}
      >
        <p className="slide-heading">{deleteErrorText}</p>
        <button
          className="slide__button"
          onClick={() => {
            setErrorOccurred(false);
            setStep(0);
            setValue("");
            onClose();
          }}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};

export default DeleteBoxInteractive;
