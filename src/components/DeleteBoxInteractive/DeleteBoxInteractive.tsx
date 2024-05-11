import React, { useState, useRef } from 'react';
import { BarCodeIcon } from '../../assets/barCodeIcon';
import './DeleteBoxInteractive.css'

interface DeleteBoxInteractiveProps {
  onClose: () => void;
}

const DeleteBoxInteractive: React.FC<DeleteBoxInteractiveProps> = ({ onClose }) => {
  const [step, setStep] = useState<number>(0);
  const [deleteBoxValue, setDeleteBoxValue] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const currentX = e.touches[0].clientX;
    const diffX = startX.current - currentX;

    if (diffX > 50 && step < 2) {
      setStep((prevStep) => prevStep + 1);
      startX.current = currentX;
    } else if (diffX < -50 && step > 0) {
      setStep((prevStep) => prevStep - 1);
      startX.current = currentX;
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="box-delete"
    >
      {step === 0 && (
        <div className="slide">
          <input
            autoFocus
            onChange={(e) => setDeleteBoxValue(e.target.value)}
            value={deleteBoxValue}
            className="input box-delete__input"
            type="text"
            placeholder="Отсканируйте код коробки"
          />
          <div className="box-delete__image-wrapper">
            <BarCodeIcon />
          </div>
          <button className="box-delete__next-button" onClick={() => setStep(1)}>
            Продолжить
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="slide">
          <p>Это второй слайд инструкции</p>
          <button onClick={() => setStep(0)}>Назад</button>
          <button onClick={() => setStep(2)}>Продолжить</button>
        </div>
      )}
      {step === 2 && (
        <div className="slide">
          <p>Это третий слайд инструкции</p>
          <button onClick={() => setStep(1)}>Назад</button>
          <button onClick={onClose}>Завершить</button>
        </div>
      )}
    </div>
  );
};

export default DeleteBoxInteractive;
