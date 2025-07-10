import { useState, useContext } from "react";
import "./ScanPallet.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import Popup from "../../components/Popup/Popup";
import { ValueContext } from "../../context/valueContext";
import { addPallet } from "../../api/addPallet";
import { createPallet } from "../../api/createPallet";
import errorSound from "../../assets/scanFailed.mp3";
import beep from "../../assets/scanSuccess.mp3";
import BackspaceIcon from "../../assets/backspaceIcon";
import ConfirmationDialog from "../../components/ConfirmationDialog/ConfirmationDialog";

const ScanPallet = () => {
  const { setOrder, order } = useContext(ValueContext);
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const { isLoading, setIsLoading } = useContext(ValueContext);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");
  const [confirmation, setConfirmation] = useState<{info: string, infoType: 'next' | 'yesNo' | ''} | null>(null);

  const audio = new Audio(beep);
  const audioError = new Audio(errorSound);

  const handleAction = async (scannedCode: string) => {
    setIsLoading(true);
    setCode(scannedCode);
    if (popupError || !scannedCode) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await addPallet(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        order.docNum,
        scannedCode
      );

      if (!response?.error) {
        audio.play();
        setOrder(response);
        if (response.activePallet) {
          navigate(`/work-pallet/${response.activePallet}`);
        } else {
          navigate(-1);
        }
      } else {
        setPopupErrorText(response.error);
        setPopupError(true);
      }
    } finally {
      setCode("");
      setIsLoading(false);
    }
  };

  const handleCreatePallet = async () => {
    setIsLoading(true);
    try {
      const response = await createPallet(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        order.docNum
      );

      if (response.infoType && response.info) {
         setConfirmation({ info: response.info, infoType: response.infoType as any });
      } else {
        // На случай, если API ответит успехом без info
        setPopupErrorText(response.error);
        setPopupError(true);
      }
    } catch(err) {
      setPopupErrorText(String(err));
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useCustomScanner(handleAction, !isLoading && !popupError && !confirmation);

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
    <>
      {confirmation && (
        <ConfirmationDialog
          isOpen={!!confirmation}
          onClose={() => setConfirmation(null)}
          info={confirmation.info}
          infoType={confirmation.infoType}
          onConfirm={() => setConfirmation(null)}
        />
      )}
      <div className="scan-order">
        <h2 className="scan-order__heading">
          Отсканируйте/введите номер паллеты или <a className="create-pallet-link" onClick={handleCreatePallet}>создайте новую</a>
        </h2>
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
    </>
  );
};

export default ScanPallet;
