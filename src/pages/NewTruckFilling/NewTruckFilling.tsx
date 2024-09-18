import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import useScanDetection from "use-scan-detection";
// import { fetchPalletInfo } from "../../api/palletInfo";
// import { PinContext } from "../../context/PinAuthContext";

const NewPallet = () => {
  const [docID, setDocID] = useState<string>("");
  const navigate = useNavigate();
//   const { pinAuthData } = useContext(PinContext);

  useScanDetection({
    onComplete: (code) => {
      const normalizedCode = code.replace(/[^0-9]/g, "").toString();
      console.log(normalizedCode)
      const documentID = `Doc_Ogr#${normalizedCode}`
      setDocID(`Doc_Ogr#${normalizedCode}`);
      const encodedDocID = encodeURIComponent(documentID);
      navigate(`/truck-filling/${encodedDocID}`);
      setDocID("");
    }
  })

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
