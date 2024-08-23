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
import scanFailedSound from "../../assets/scanFailed.mp3";
import { deleteCart } from "../../api/deleteCart";
import { PinContext } from "../../context/PinAuthContext";
import { useParams } from "react-router-dom";
// import { TPallet } from "../../pages/Pallet/config";
import Loader from "../Loader/Loader";
import { unshipPallet } from "../../api/unshipPallet";
import { TPallet } from "../../pages/Pallet/config";
import { ValueContext } from "../../context/valueContext";

interface DeleteBoxInteractiveProps {
  onClose: () => void;
  isPopupOpened?: boolean;
  setPallet: Dispatch<any>;
  type: "pallet" | "truck";
  pallet?: TPallet;
  deleteBoxInteractiveReset?: any;
}

const DeleteBoxInteractive: React.FC<DeleteBoxInteractiveProps> = ({
  onClose,
  isPopupOpened,
  setPallet,
  type,
  pallet,
  
}) => {
  const [step, setStep] = useState<number>(0);
  const [errorOccurred, setErrorOccurred] = useState<boolean>(false);
  const successScanSound = new Audio(scanSuccessSound);
  const [deleteErrorText, setDeleteErrorText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const failedScanSound = new Audio(scanFailedSound);
  const {value, setValue} = useContext(ValueContext)
  const [responseComment, setResponseComment] = useState<string>('');

  const deleteBoxInteractiveReset = () => {
    setStep(0);
    setValue("");
    setErrorOccurred(false);
    setDeleteErrorText("");
  };

  useScanDetection({
    onComplete: (code) => {
      if (isPopupOpened && !errorOccurred) {
        successScanSound.play();
        setValue(code.replace(/[^0-9]/g, ""));
        setStep(1);
      }
    },
    averageWaitTime: 20,
  });

  const { pinAuthData } = useContext(PinContext);
  const params = useParams();

  const handleDelete = async () => {
    console.log('value', value)
    if (!errorOccurred) {
      if (type === "pallet") {
        setLoading(true);
        try {
          const response = await deleteCart(
            String(pinAuthData?.pinCode),
            String(pinAuthData?.tsdUUID),
            String(params.sscc),
            value,
            pallet && pallet.info,
            'next'
          );
          setLoading(false);
          if (!response.error) {
            setPallet(response);
            onClose();
            setStep(0);
            setValue("");
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
            value
          );
          setLoading(false);
          if (!response.error) {
            setPallet(response);
            setResponseComment('');
            onClose();
            setStep(0);
            setValue("");
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
      failedScanSound.play();
    }
  }, [errorOccurred]);

  useEffect(() => {
    if (!isPopupOpened) {
      deleteBoxInteractiveReset();
    }
  }, [isPopupOpened]);

  return (
    <div className="swipeable-container">
      <div
        className={`slide ${step === 0 ? "slide_active" : "slide_next"} ${
          step === 2 ? "slide_error" : ""
        }`}
      >
        <input
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          value={value}
          className="input box-delete__input"
          type="number"
          placeholder={`Отсканируйте код ${
            type === "pallet" ? "коробки" : "паллеты"
          } `}
        />
        <div className="box-delete__image-wrapper">
          <BarCodeIcon />
        </div>
        <button
          className="box-delete__next-button"
          disabled={Number(value) < 1}
          onClick={ async () => {
            if (type === "pallet") {
              setLoading(true);
              try {
                const response = await deleteCart(
                  String(pinAuthData?.pinCode),
                  String(pinAuthData?.tsdUUID),
                  String(params.sscc),
                  value
                );
                setLoading(false);
                if (!response.error) {
                  setPallet(response);
                  // setValue("");
                } else {
                  setDeleteErrorText(response.error);
                  setErrorOccurred(true);
                }
              } catch (error) {}
              setStep(1);  
            } else {
              setLoading(true);
              try {
                const response = await unshipPallet(
                  String(pinAuthData?.pinCode),
                  String(pinAuthData?.tsdUUID),
                  String(params.docId),
                  value
                );
                setLoading(false);
                if (!response.error) {
                  setPallet(response);
                  setResponseComment(response.comment || response.info)
                } else {
                  setDeleteErrorText(response.error);
                  setErrorOccurred(true);
                }
              } catch (error) {}
              setStep(1);
            }
          }}
        >
          {loading ? "Загрузка..." : "Продолжить"}
        </button>
      </div>
      <div
        className={`slide slide_second ${
          step === 1 ? "slide_active" : "slide_next"
        }`}
      >
        <p className="slide-heading">{pallet && pallet.info || responseComment}</p>

        {loading ? <Loader /> : null}
        <button className="slide__button" onClick={type === "pallet" ? handleDelete : onClose}>
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
            setValue("");
            onClose();
          }}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};

export default DeleteBoxInteractive;
