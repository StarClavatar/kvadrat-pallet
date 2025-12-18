import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import Popup from "../../components/Popup/Popup";
import BackspaceIcon from "../../assets/backspaceIcon";
import CameraScanner from "../../components/CameraScanner/CameraScanner";
import { getDoc } from "../../api/kitservice/getDoc";
import styles from "./ScanDocKit.module.css";

const ScanDocKit = () => {
  const navigate = useNavigate();
  const { pinAuthData } = useContext(PinContext);
  
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");

  const handleScan = async (scannedCode: string) => {
    if (!scannedCode) return;
    setCode(scannedCode);
    setIsLoading(true);

    try {
      const response = await getDoc({
        pinCode: String(pinAuthData?.pinCode),
        tsdUUID: String(localStorage.getItem("tsdUUID")),
        scanCod: scannedCode,
      });

      if (response.error) {
        console.log("Ошибка при получении документа:", response);
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        navigate("/set-aggregation", { state: { docData: response } });
      }
    } catch (err) {
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraScan = (results: string[]) => {
    if (results.length > 0) {
      // Take the first code found
      handleScan(results[0]);
    }
  };

  // Hook for hardware scanner (Zebra/Honeywell)
  useCustomScanner(handleScan, !isLoading && !popupError);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Отсканируйте документ<br/>для агрегации набора</h2>
      
      <div className={styles.inputWrapper}>
        <input
            required
            type="text"
            placeholder="Номер документа"
            className={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
        />
        <button 
            className={styles.sendButton} 
            onClick={() => handleScan(code)}
            disabled={isLoading || !code}
        >
            {isLoading ? "Загрузка..." : "Найти"}
        </button>
      </div>

      <div className={styles.actions}>
         <CameraScanner 
            onScan={handleCameraScan} 
            className={styles.cameraButton}
            textButton="Сканировать камерой"
            scannerText="Сканируйте номер заказа"
            expectedCount={1}
            formats={["Code128", "DataMatrix"]}
            closeOnScan={true}
            defaultOpen={true}
         />
      </div>

      <div className={styles.footer}>
        <button
            className={styles.exitButton}
            onClick={() => navigate("/workmode")}
        >
            <BackspaceIcon color="#fff" />
        </button>
      </div>

      {popupError && (
        <Popup
          isOpen={popupError}
          onClose={() => setPopupError(false)}
          title="Ошибка"
          containerClassName="popup-error"
        >
          <div className='popup-error__container'>
            <p className='popup-error__text'>{popupErrorText}</p>
            <button 
                className='popup-error__button'
                onClick={() => setPopupError(false)}
            >
                ОК
            </button>
          </div>
        </Popup>
      )}
    </div>
  );
};

export default ScanDocKit;
