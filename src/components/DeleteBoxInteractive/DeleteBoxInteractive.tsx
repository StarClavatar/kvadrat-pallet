import React, { useState, useRef } from "react";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import "./DeleteBoxInteractive.css";
import useScanDetection from "use-scan-detection";
import scanSuccessSound from '../../assets/scanSuccess.mp3'
// import scanFailedSound from '../../assets/scanFailed.mp3'

interface DeleteBoxInteractiveProps {
  onClose: () => void;
  isPopupOpened?: boolean;
}

const DeleteBoxInteractive: React.FC<DeleteBoxInteractiveProps> = ({
  onClose,
  isPopupOpened,
}) => {
  const [step, setStep] = useState<number>(0);
  const [deleteBoxValue, setDeleteBoxValue] = useState<any>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const successScanSound = new Audio(scanSuccessSound)
  // const failedScanSound = new Audio(scanFailedSound)
  const deleteBoxContainerRef = useRef<HTMLDivElement>()
  useScanDetection({
    container: deleteBoxContainerRef.current,
    onComplete: (code) => {
      successScanSound.play()
      if (isPopupOpened) {
        setDeleteBoxValue(code.replace(/[^0-9]/g, ''))
        setStep(1)
      }
    },
    averageWaitTime:20
  
  });

  return (
    //@ts-ignore
    <div className="swipeable-container" ref={deleteBoxContainerRef}>
      <div className={`slide ${step === 0 && "slide_active"}`}>
        <input
          ref={inputRef}
          autoFocus
          onChange={(e) => setDeleteBoxValue(e.target.value)}
          value={deleteBoxValue}
          className="input box-delete__input"
          type="number"
          placeholder="Отсканируйте код коробки"
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
          Уберите Коробку <br />{" "}
          <span className="slide-box-code">{`№: ${deleteBoxValue}`}</span>
          <br /> с паллеты и нажмите{" "}
          <span className="finish-span">завершить</span>
        </p>
        <button
          className="slide__button"
          onClick={() => {
            onClose();
            setStep(0);
            setDeleteBoxValue("");
          }}
        >
          Завершить
        </button>
      </div>
    </div>
  );
};

export default DeleteBoxInteractive;
