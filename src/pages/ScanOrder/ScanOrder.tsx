import { useState, useContext } from "react";
import beep from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import "./ScanOrder.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import Popup from "../../components/Popup/Popup";

import { ValueContext } from "../../context/valueContext";
import { fetchDocInfo } from "../../api/docInfo";
import BackspaceIcon from "../../assets/backspaceIcon";

const ScanOrder = () => {
  const { setOrder } = useContext(ValueContext);
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const { isLoading, setIsLoading } = useContext(ValueContext);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");

  const audio = new Audio(beep);
  const audioError = new Audio(errorSound);

  const handleFormAction = async (code: string) => {
    setCode(code);
    setIsLoading(true);
    if (popupError) {
      setIsLoading(false);
      return;
    }
    if (code?.length > 0) {
      const response = await fetchDocInfo(
        String(pinAuthData?.pinCode),
        String(code),
        String(localStorage.getItem("tsdUUID"))
      );

      if (!response?.error) {
        audio.play();
        setOrder(response);
        navigate(`/order`);
        setCode("");
        setIsLoading(false);
      } else {
        setPopupErrorText(response.error);
        setPopupError(true);
        setCode("");
        setIsLoading(false);
      }
    }
  };
  const handleSubmit = async (symbol: string) => {
    setIsLoading(true);
    setCode(symbol);
    await handleFormAction(symbol).finally(() => {
      setIsLoading(false);
    });
  };

  useCustomScanner(handleFormAction, !isLoading && !popupError);

  if (popupError) {
    audioError.play();
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
    <div className="scan-order">
      <h2 className="scan-order__heading">Отсканируйте/введите номер заказа</h2>
      <input
        required
        type="text"
        placeholder="Номер заказа"
        className="input form__input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button className="form__send-button" onClick={() => handleSubmit(code)}>
        Отправить
      </button>
      <button
        className="exit-button_scan-order"
        onClick={() => navigate("/workmode")}
      >
        <BackspaceIcon color="#fff" />
      </button>
      <button
        className="exit-button_new-pallet"
        onClick={() => navigate("/workmode")}
      >
        Выбор режима работы
      </button>
      <div></div>
    </div>
  );
};

export default ScanOrder;
