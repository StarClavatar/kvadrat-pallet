import { FormEvent, useState, useEffect, useRef } from "react";
import beep from '../../assets/beep.mp3'
import "./NewPallet.css";
import { useNavigate } from "react-router-dom";

const NewPallet = () => {
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

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
      console.log("Отправленный SSCC-код:", code);
      navigate(`/pallet/${code}`);
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
    </div>
  );
};

export default NewPallet;
