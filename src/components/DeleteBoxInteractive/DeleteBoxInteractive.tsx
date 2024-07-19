import React, {
  Dispatch,
  // SetStateAction,
  useContext,
  useState,
  useEffect,
} from "react";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import "./DeleteBoxInteractive.css";
import useScanDetection from "use-scan-detection";
import scanSuccessSound from "../../assets/scanSuccess.mp3";
import scanFailedSound from '../../assets/scanFailed.mp3'
import { deleteCart } from "../../api/deleteCart";
import { PinContext } from "../../context/PinAuthContext";
import { useParams } from "react-router-dom";
// import { TPallet } from "../../pages/Pallet/config";
import Loader from "../Loader/Loader";
import { unshipPallet } from "../../api/unshipPallet";

interface DeleteBoxInteractiveProps {
  onClose: () => void;
  isPopupOpened?: boolean;
  // setPallet: Dispatch<SetStateAction<ITruckInfo | undefined >>;
  setPallet: Dispatch<any>;
  type: 'pallet' | 'truck';
}

const DeleteBoxInteractive: React.FC<DeleteBoxInteractiveProps> = ({
  onClose,
  isPopupOpened,
  setPallet,
  type
}) => {
  const [step, setStep] = useState<number>(0);
  const [deleteBoxValue, setDeleteBoxValue] = useState<any>("");
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);
  const successScanSound = new Audio(scanSuccessSound);
  const [deleteErrorText, setDeleteErrorText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const failedScanSound = new Audio(scanFailedSound)
  useScanDetection({
    onComplete: (code) => {
      if (isPopupOpened && !errorOccurred) {
        successScanSound.play();
        setDeleteBoxValue(code.replace(/[^0-9]/g, ""));
        setStep(1);
      }
    },
    averageWaitTime: 20,
  });

  const { pinAuthData } = useContext(PinContext);
  const params = useParams();

  const handleDelete = async () => {
    if (!errorOccurred) {
    if (type === 'pallet') {
        setLoading(true);
        try {
          const response = await deleteCart(
            String(pinAuthData?.pinCode),
            String(pinAuthData?.tsdUUID),
            String(params.sscc),
            deleteBoxValue
          );
          setLoading(false);
          if (!response.error) {
            setPallet(response);
            onClose();
            setStep(0);
            setDeleteBoxValue("");
          } else {
            setDeleteErrorText(response.error);
            setErrorOccurred(true);
          }
        } catch (error) {}
      } else {
        setLoading(true);
        try {
          const response = await unshipPallet(
            String(pinAuthData?.pinCode),
            String(pinAuthData?.tsdUUID),
            String(params.docId),
            deleteBoxValue
          );
          setLoading(false);
          if (!response.error) {
            setPallet(response);
            onClose();
            setStep(0);
            setDeleteBoxValue("");
          } else {
            setDeleteErrorText(response.error);
            setErrorOccurred(true);
          }
        } catch (error) {}
      }
    }
  };

  useEffect(() => {
    if (errorOccurred) {
      setStep(2); // Переключаем на слайд об ошибке
      failedScanSound.play()
    }
  }, [errorOccurred]);

  return (
    <div className="swipeable-container">
      <div
        className={`slide ${step === 0 ? "slide_active" : "slide_next"} ${
          step === 2 ? "slide_error" : ""
        }`}
      >
        <input
          autoFocus
          onChange={(e) => setDeleteBoxValue(e.target.value)}
          value={deleteBoxValue}
          className="input box-delete__input"
          type="number"
          placeholder={`Отсканируйте код ${type === 'pallet' ? 'коробки' : 'паллеты'} `}
        />
        <div className="box-delete__image-wrapper">
          <BarCodeIcon />
        </div>
        <button
          className="box-delete__next-button"
          disabled={Number(deleteBoxValue) < 1}
          onClick={() => setStep(1)}
        >
          Продолжить
        </button>
      </div>
      <div
        className={`slide slide_second ${
          step === 1 ? "slide_active" : "slide_next"
        }`}
      >
        <p className="slide-heading">
          {`Уберите ${type === 'pallet' ? 'паллету' : 'коробку'} `} <br />{" "}
          <span className="slide-box-code">{`№: ${deleteBoxValue}`}</span>
          <br /> {`${type === 'pallet' ? 'с паллеты' : 'из машины'} и нажмите`}{" "}
          <span className="finish-span">"Завершить"</span>
        </p>

        {loading? <Loader /> : null}
        <button className="slide__button" onClick={handleDelete}>
          Завершить
        </button>
      </div>
      <div
        className={`slide slide_error ${
          step === 2 ? "slide_active" : "slide_next"
        }`}
      >
        <p className="slide-heading">{deleteErrorText}</p>
        <button
          className="slide__button"
          onClick={() => {
            setErrorOccurred(false);
            setStep(0);
            setDeleteBoxValue('')
            onClose()
          }}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};

export default DeleteBoxInteractive;
