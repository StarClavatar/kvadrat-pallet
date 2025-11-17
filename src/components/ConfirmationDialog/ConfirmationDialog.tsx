import React from 'react';
import Popup from '../Popup/Popup';
import './ConfirmationDialog.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  info: React.ReactNode;
  infoType: 'yesNo' | 'next' | '';
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  info,
  infoType,
  onConfirm,
  onCancel,
}) => {
  return (
    <Popup isOpen={isOpen} onClose={onClose} containerClassName="confirmation-dialog-popup">
      <div className="confirmation-dialog">
        <div className="confirmation-dialog__text">{info}</div>
        <div className="confirmation-dialog__actions">
          {infoType === 'yesNo' ? (
            <>
              <button className="confirmation-dialog__btn confirmation-dialog__btn--confirm" onClick={onConfirm}>
                Да
              </button>
              <button className="confirmation-dialog__btn confirmation-dialog__btn--cancel" onClick={onCancel || onClose}>
                Нет
              </button>
            </>
          ) : (
            <button className="confirmation-dialog__btn confirmation-dialog__btn--confirm" onClick={onConfirm}>
              Продолжить
            </button>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default ConfirmationDialog; 