import { useState, useContext, FormEvent } from "react";
import beep from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import "./NewPallet.css";
import { useNavigate } from "react-router-dom";
import { fetchPalletInfo } from "../../api/palletInfo";
import { PinContext } from "../../context/PinAuthContext";
import useScanDetection from "use-scan-detection";
import { ValueContext } from "../../context/valueContext";
import Popup from "../../components/Popup/Popup";

const NewPallet = () => {
  const { setPallet } = useContext(ValueContext);
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");

  const audio = new Audio(beep);
  const audioError = new Audio(errorSound);

  const handleFormAction = async (code: string) => {
    if (popupError) return;
    if (code?.length > 0) {
      const response = await fetchPalletInfo(
        String(pinAuthData?.pinCode),
        String(code),
        "",
        String(localStorage.getItem("tsdUUID"))
      );

      if (!response?.error) {
        audio.play();
        const { palletSSCC } = response;
        setPallet(response);
        navigate(`/pallet/${palletSSCC}`);
        setCode("");
      } else {
        setPopupErrorText(response.error);
        setPopupError(true);
        setCode("");
      }
    }
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleFormAction(code);
  };

  useScanDetection({
    onComplete: async (code) => {
      const normalizedCode = code.replace(/[^0-9]/g, "").toString();
      await handleFormAction(normalizedCode);
    },
  });

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
    <div className="new-pallet">
      <h2 className="new-pallet__heading">Отсканируйте этикетку паллеты</h2>
      <form className="pallet-form" onSubmit={handleSubmit}>
        <input
          required
          type="number"
          placeholder="SSCC-код"
          className="input pallet-form__input"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={({ target }) => target.focus()}
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

export default NewPallet;
