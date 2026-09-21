import { FC, ReactNode } from "react";
import "./Popup.css";
import CloseIcon from "../../assets/closeIcon";

type PopupProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  containerClassName?: string;
  title?: string;
  fullScreen?: boolean;
};

const Popup: FC<PopupProps> = ({
  children,
  containerClassName,
  isOpen,
  onClose,
  title,
  fullScreen = false,
}) => {
  return (
    <div className={`popup ${isOpen ? "popup_opened" : ""} ${fullScreen ? "popup_fullscreen" : ""}`}>
      <div className={`popup__inner ${containerClassName || ""}`}>{children}</div>
      {title && <span className="popup__title">{title}</span>}
      <button className="popup__close-button" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
};

export default Popup;
