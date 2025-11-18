import { useState, useContext, FormEvent } from "react";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import "./ScanBox.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import { ValueContext } from "../../context/valueContext";
import Popup from "../../components/Popup/Popup";
import { getCart } from "../../api/getCart";
import CameraScanner from "../../components/CameraScanner/CameraScanner";

const ScanBox = () => {
  const { setCartData } = useContext(ValueContext);
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");

  const audioSuccess = new Audio(successSound);
  const audioError = new Audio(errorSound);

  const handleFormAction = async (scanCode: string) => {
    if (popupError || !scanCode) return;
    
    try {
        const response = await getCart(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            scanCode
        );

        if (!response?.error) {
            audioSuccess.play();
            setCartData(response);
            navigate(`/box-aggregation`);
            setCode("");
        } else {
            setPopupErrorText(response.error);
            setPopupError(true);
            setCode("");
        }
    } catch (err) {
        setPopupErrorText("Сетевая ошибка");
        setPopupError(true);
        setCode("");
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleFormAction(code);
  };

  useCustomScanner(handleFormAction, !popupError);

  if (popupError) {
    audioError.play();
    return (
      <Popup
        title="Ошибка"
        containerClassName="popup-error"
        isOpen={popupError}
        onClose={() => setPopupError(false)}
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
      <h2 className="new-pallet__heading">Отсканируйте товар <br /> или незавершённый короб</h2>
      <p className="new-pallet__description"></p>
      <form className="pallet-form" onSubmit={handleSubmit}>
        <div className="pallet-form__input-container">
          <input
            required
            type="text"
            placeholder="Отсканируйте код короба"
            className="input pallet-form__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
          <CameraScanner onScan={handleFormAction} formats={["Code128", "DataMatrix"]}/>
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

export default ScanBox;
