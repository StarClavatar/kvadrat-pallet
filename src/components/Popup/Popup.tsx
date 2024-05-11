import { FC, ReactNode } from "react";
import "./Popup.css";
import CloseIcon from "../../assets/closeIcon";

type PopupProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  containerClassName?: string;
  title?: string;
};

const Popup: FC<PopupProps> = ({
  children,
  containerClassName,
  isOpen,
  onClose,
  title,
}) => {
  return (
    <div className={`popup ${isOpen ? "popup_opened" : null}`}>
      <div className={`popup__inner ${containerClassName}`}>{children}</div>
      <span className="popup__title">{title}</span>
      <button className="popup__close-button" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default Popup;
