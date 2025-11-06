import React, { useState, useEffect } from 'react';
import { useCustomScanner } from '../../hooks/useCustomScanner';
import Popup from '../Popup/Popup';
import './DeleteDialog.css';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string) => void;
  title: string;
  prompt: string;
  withoutInput?: boolean;
  autoSubmit?: boolean; // Если true, то после сканирования автоматически отправит код на сервер
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, onScan, title, prompt, withoutInput = false, autoSubmit = false }) => {
  const [displayedCode, setDisplayedCode] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setDisplayedCode(' ');
    }
  }, [isOpen]);

  const internalScanHandler = (scannedCode: string) => {
    setDisplayedCode(scannedCode);
    if (autoSubmit) {
      onScan(scannedCode);
    }
  };

  useCustomScanner(internalScanHandler, isOpen);

  const handleManualSubmit = () => {
    if (displayedCode.trim()) {
      onScan(displayedCode.trim());
    }
  };

  return (
    <Popup isOpen={isOpen} onClose={onClose} containerClassName="delete-dialog-popup">
      <div className="delete-dialog">
        <h3 className="delete-dialog__title">{title}</h3>
        <p className="delete-dialog__prompt">{prompt}</p>
        <div className="delete-dialog__visualizer">
          <div className="scan-line"></div>
          <div className="delete-dialog__scanned-code">
            {displayedCode.trim() === '' ? 'отсканируйте код' : displayedCode}
          </div>
        </div>
        {!withoutInput && (
          <>
        <p className="delete-dialog__manual-input-prompt">Или введите вручную:</p>
          <input 
            type="text" 
            className="delete-dialog__manual-input" 
            value={displayedCode} 
            onChange={(e) => setDisplayedCode(e.target.value)}
            placeholder="Введите код"
          />
          </>
        )}
        <div className="delete-dialog__actions">
          <button className="delete-dialog__btn delete-dialog__btn--cancel" onClick={onClose}>
            Отмена
          </button>
          {!autoSubmit && (
          <button 
            className="delete-dialog__btn delete-dialog__btn--confirm" 
            onClick={handleManualSubmit}
            disabled={!displayedCode.trim()}
          >
            Подтвердить
          </button>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default DeleteDialog; 