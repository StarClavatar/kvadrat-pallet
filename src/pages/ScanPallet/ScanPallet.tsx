import { useState, useContext } from "react";
import "./ScanPallet.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import Popup from "../../components/Popup/Popup";
import { ValueContext } from "../../context/valueContext";
import { addPallet } from "../../api/addPallet";
import errorSound from "../../assets/scanFailed.mp3";
import beep from "../../assets/scanSuccess.mp3";
import BackspaceIcon from "../../assets/backspaceIcon";

const ScanPallet = () => {
  const { setOrder, order } = useContext(ValueContext);
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");

  const audio = new Audio(beep);
  const audioError = new Audio(errorSound);

  const handleAction = async (scannedCode: string) => {
    setCode(scannedCode);
    if (popupError || !scannedCode) return;

    const docNumForRequest = order.docNum.startsWith("00")
      ? order.docNum.substring(2)
      : order.docNum;

    try {
      const response = await addPallet(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        docNumForRequest,
        scannedCode
      );

      if (!response?.error) {
        audio.play();
        setOrder(response);
        console.log("response SUKA SCAN PALLET", response);
        if (response.activePallet) {
          navigate(`/work-pallet/${response.activePallet}`);
        } else {
          navigate(-1);
        }
      } else {
        setPopupErrorText(response.error);
        setPopupError(true);
      }
    } catch (err) {
      setPopupErrorText("Ошибка сети или сервера");
      setPopupError(true);
    } finally {
      setCode("");
    }
  };

  useCustomScanner(handleAction);

  const closePopup = () => {
    setPopupError(false);
    setCode("");
  };

  if (popupError) {
    audioError.play();
    return (
      <Popup
        isOpen={popupError}
        onClose={closePopup}
        containerClassName="popup-error"
      >
        <div className="popup-error__container">
          <h4 className="popup-error__text">{popupErrorText}</h4>
          <button className="popup-error__button" onClick={closePopup}>
            Продолжить
          </button>
        </div>
      </Popup>
    );
  }

  return (
    <div className="scan-order">
      <h2 className="scan-order__heading">Отсканируйте/введите номер паллеты</h2>
      <div className="form">
        <input
          required
          type="text"
          placeholder="Номер паллеты"
          className="input form__input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="form__send-button" onClick={() => handleAction(code)}>
          Отправить
        </button>
      </div>
      <button
        className="exit-button_scan-order"
        onClick={() => navigate("/order")}
      >
        <BackspaceIcon color="#fff" />
      </button>
    </div>
  );
};

export default ScanPallet;
