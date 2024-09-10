import { useState, useContext } from "react";
import beep from "../../assets/scanSuccess.mp3";
import "./NewPallet.css";
import { useNavigate } from "react-router-dom";
import { fetchPalletInfo } from "../../api/palletInfo";
import { PinContext } from "../../context/PinAuthContext";
import useScanDetection from "use-scan-detection";

const NewPallet = () => {
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);

  const audio = new Audio(beep);

  const handleFormAction = async (code: string) => {
    audio.play();
    if (code?.length > 0) {
      const response = await fetchPalletInfo(
        String(pinAuthData?.pinCode),
        String(code),
        "",
        String(localStorage.getItem("tsdUUID"))
      );
      const { palletSSCC } = response;
      navigate(`/pallet/${palletSSCC}`);
      setCode("");
    }
  };
  const handleSubmit = async () => {
   await handleFormAction(code);
  };

  useScanDetection({
    onComplete: async (code) => {
      const normalizedCode = code.replace(/[^0-9]/g, "").toString();
      await handleFormAction(normalizedCode);
    }
  })

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
