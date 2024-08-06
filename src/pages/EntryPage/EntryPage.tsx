import React, { ChangeEvent, useState, useContext, useEffect } from "react";
import "./EntryPage.css";
import BackspaceIcon from "../../assets/backspaceIcon";
import { useNavigate } from "react-router-dom";
import { PinContext, TPinAuthData } from "../../context/PinAuthContext";
import { fetchPinAuth } from "../../api/pinAuth";
import Loader from "../../components/Loader/Loader";

const EntryPage: React.FC = () => {
  const { setPinAuthData } = useContext(PinContext);
  const [pinCode, setPinCode] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Функция обработки нажатия на кнопку
  const handleButtonClick = (value: string | number) => {
    if (value === "backspace") {
      // Если нажата кнопка backspace, удаляем последний символ из PIN-кода
      setPinCode(pinCode.slice(0, -1));
    } else {
      if (pinCode.length < 4) {
        // Иначе добавляем символ к текущему значению PIN-кода
        setPinCode(pinCode + value.toString());
      }
    }
  };

  // Функция обработки ошибки ввода PIN-кода
  const handlePinError = (errorMsg: string) => {
    setPinCode("");
    setPinError(errorMsg);
    setTimeout(() => {
      setPinError(null);
    }, 2000); // Задержка перед удалением класса анимации
  };

  // здесь при наборе пин-кода из 4 цифр делаем запрос на получение данных авторизации
  useEffect(() => {
    if (pinCode.length === 4) {
      setLoading(true);
      const tsdUUID = localStorage.getItem('tsdUUID') ?? undefined;
      const controller = new AbortController();
      const signal = controller.signal;

      // Устанавливаем тайм-аут для отмены запроса через 10 секунд
      const timeoutId = setTimeout(() => {
        controller.abort();
        handlePinError("Превышено время ожидания ответа от сервера.");
        setLoading(false);
      }, 10000); // 10 секунд

      fetchPinAuth(Number(pinCode), tsdUUID, signal)
        .then((data: TPinAuthData) => {
          clearTimeout(timeoutId);
          setPinAuthData(data);
          if (data.error.length === 0) {
            setLoading(false);
            setPinCode('');
            localStorage.setItem("tsdUUID", String(data.tsdUUID));
            navigate("/workmode");
          } else {
            setLoading(false);
            handlePinError(data.error);
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            console.log("Fetch aborted");
          } else {
            console.log(error);
            handlePinError("Ошибка при выполнении запроса.");
          }
          setLoading(false);
        });
    }
  }, [pinCode]);

  return (
    <div className="entry-page">
      <input
        className="input pin-code"
        name="pin-code"
        type="text"
        pattern="[0-9]*"
        placeholder="Введите пин-код"
        maxLength={4}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          setPinCode(e.target.value);
        }}
        value={pinCode}
        style={{ borderBottom: "2px solid #f6fa05" }}
      />
      {pinError && (
        <p className="pin-code-error shake-animation">
          {pinError}
        </p>
      )}
      {loading && <Loader size="s" />}
      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "backspace"].map((value) => (
          <button
            key={value.toString()}
            className="numpad__button"
            onClick={() => handleButtonClick(value)}
            disabled={loading}
          >
            {value === "backspace" ? <BackspaceIcon /> : value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EntryPage;