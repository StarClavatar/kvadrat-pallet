import React, { ChangeEvent, useState, useContext } from "react";
import "./EntryPage.css";
import BackspaceIcon from "../../assets/backspaceIcon";
import { useNavigate } from "react-router-dom";
import { PinContext, TPinAuthData } from "../../context/PinAuthContext";
import { fetchPinAuth } from "../../api/pinAuth";

const EntryPage: React.FC = () => {
  const { pinAuthData, setPinAuthData } = useContext(PinContext);
  const [pinCode, setPinCode] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
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

  const handlePinError = () => {
    setPinCode("");
    setPinError(true);
    setTimeout(() => {
      setPinError(false);
    }, 2000); // Задержка перед удалением класса анимации
  };

  if (pinCode.length === 4) {
    const tsdUUID = localStorage.getItem('tsdUUID') ?? undefined;
    fetchPinAuth(Number(pinCode), tsdUUID)
      .then((data: TPinAuthData) => {
        console.log(tsdUUID)
        setPinAuthData(data);
        if (data.error.length === 0) {
          setPinCode('');
          localStorage.setItem("tsdUUID", String(data.tsdUUID));
          navigate("/workmode");
        } else {
          handlePinError();
        }
      });
  }

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
        <p
          className={
            pinError ? "pin-code-error shake-animation" : "pin-code-error"
          }
        >
          {pinAuthData?.error}
        </p>
      )}
      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "backspace"].map((value) => (
          <button
            key={value.toString()}
            className="numpad__button"
            onClick={() => handleButtonClick(value)}
          >
            {value === "backspace" ? <BackspaceIcon /> : value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EntryPage;
