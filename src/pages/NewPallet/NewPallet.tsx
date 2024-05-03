import { FormEvent, useState } from "react";
import "./NewPallet.css";
import { useNavigate } from "react-router-dom";

const NewPallet = () => {
  const [code, setCode] = useState<string>("");
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
          required
          type="text"
          placeholder="SSCC-код"
          className="input pallet-form__input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="pallet-form__send-button" type="submit">
          Отправить
        </button>
      </form>
    </div>
  );
};

export default NewPallet;
