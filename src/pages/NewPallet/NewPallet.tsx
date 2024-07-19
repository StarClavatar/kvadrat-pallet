import { FormEvent, useState, useEffect, useRef, useContext } from "react";
import beep from '../../assets/scanSuccess.mp3'
import "./NewPallet.css";
import { useNavigate } from "react-router-dom";
import { fetchPalletInfo } from "../../api/palletInfo";
import { PinContext } from "../../context/PinAuthContext";

const NewPallet = () => {
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { pinAuthData } = useContext(PinContext);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const audio = new Audio(beep)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    audio.play()
    if (code?.length > 0) {
      const response = await fetchPalletInfo(
        String(pinAuthData?.pinCode),
        String(code),
        '',
        String(localStorage.getItem("tsdUUID"))
      );
      const { palletSSCC } = response;
      navigate(`/pallet/${palletSSCC}`);
      setCode("");
    }
  };

  return (
    <div className="new-pallet">
      <h2 className="new-pallet__heading">Отсканируйте этикетку паллеты</h2>
      <form className="pallet-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          autoFocus
          required
          type="number"
          placeholder="SSCC-код"
          className="input pallet-form__input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
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
