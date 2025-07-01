import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomScanner } from "../../hooks/useCustomScanner";
// import { fetchPalletInfo } from "../../api/palletInfo";
// import { PinContext } from "../../context/PinAuthContext";

const NewPallet = () => {
  const [docID, setDocID] = useState<string>("");
  const navigate = useNavigate();
//   const { pinAuthData } = useContext(PinContext);

  useCustomScanner((code) => {
    console.log(code)
    const encodedDocID = encodeURIComponent(code);
    navigate(`/truck-filling/${encodedDocID}`);
    setDocID("");
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (docID?.length > 0) {
      const encodedDocID = encodeURIComponent(docID);
      navigate(`/truck-filling/${encodedDocID}`);
      setDocID("");
    }
  };

  return (
    <div className="new-pallet">
      <h2 className="new-pallet__heading">Отсканируйте штрих-код документа отгрузки</h2>
      <form className="pallet-form" onSubmit={handleSubmit}>
        <input
          // autoFocus
          required
          placeholder="Номер отгрузки"
          className="input pallet-form__input"
          value={docID}
          onChange={(e) => setDocID(e.target.value)}
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
