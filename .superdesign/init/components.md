# Shared UI primitives

Framework note: this project uses custom React components and plain CSS/CSS Modules; no third-party component library is present. The shared primitive layer is small and lives under `src/components/`.

## Popup
- Path: `src/components/Popup/Popup.tsx`
- Description: Reusable modal/overlay container with optional title, close control, custom content class, and fullscreen mode.
- Props: `children`, `isOpen`, `onClose`, `containerClassName?`, `title?`, `fullScreen?`

```tsx
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
```

### Popup styles — `src/components/Popup/Popup.css`
```css
.popup {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: end;
  padding-bottom: 12px;
  transition: .3s;
  visibility: hidden;
  opacity: 0;
  transform: scale(0);
  z-index: 9999;
}

.popup_opened {
  visibility: visible;
  opacity: 1;
  transform: scale(1);
}

.popup_fullscreen {
  padding-bottom: 0;
  align-items: stretch;
}

.popup_fullscreen .popup__inner {
  width: 100%;
  height: 100%;
  max-width: none;
  border-radius: 0;
}

.popup_fullscreen .popup__close-button {
  top: max(16px, env(safe-area-inset-top));
  right: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.popup__inner {
  width: 95%;
  height: 91%;
  display: flex;
  align-items: start;
  border-radius: 12px;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.popup__title {
    position: absolute;
    top: 2.5%;
    left: 2.5%;
    font-size: 3vh;
    color: antiquewhite;

}

.popup__close-button {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  border-radius: 5px;
  padding: 6px 6px 2px;
  transition: 0.4s;
  background-color: rgba(255, 255, 255, 0.4);
}

.popup__close-button:active {
  opacity: .6;
  cursor: pointer;
}
```

## Loader
- Path: `src/components/Loader/Loader.tsx`
- Description: Full-screen overlay with a twelve-spoke spinner.
- Props: `size?: "s" | "m" | "xl"`, `color?: string`

```tsx
import "./Loader.css";

type loaderProps = {
  size?: "s" | "m" | "xl";
  color?: string;
};

const Loader = ({ size = "m", color = "#fff" }: loaderProps = {}) => {
  const sizeClass = `lds-spinner--${size}`;
  return (
    <div className="loader-overlay">
      <div className={`lds-spinner ${sizeClass}`} style={{ color }}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loader;
```

### Loader styles — `src/components/Loader/Loader.css`
```css
.lds-spinner,
.lds-spinner div,
.lds-spinner div:after {
  box-sizing: border-box;
}

.lds-spinner {
  color: currentColor;
  display: inline-block;
  position: relative;
}

.lds-spinner--s {
  width: 40px;
  height: 40px;
}

.lds-spinner--m {
  width: 80px;
  height: 80px;
}

.lds-spinner--xl {
  width: 120px;
  height: 120px;
}

.lds-spinner div {
  transform-origin: 50%;
  animation: lds-spinner 1.2s linear infinite;
}

.lds-spinner--s div:after {
  top: 1.6px;
  left: 18.4px;
  width: 3.5px;
  height: 9.2px;
}

.lds-spinner--m div:after {
  top: 3.2px;
  left: 36.8px;
  width: 6.4px;
  height: 17.6px;
}

.lds-spinner--xl div:after {
  top: 4.8px;
  left: 55.2px;
  width: 9.6px;
  height: 26.4px;
}

.lds-spinner div:after {
  content: " ";
  display: block;
  position: absolute;
  border-radius: 20%;
  background: currentColor;
}

.lds-spinner--s div { transform-origin: 20px 20px; }
.lds-spinner--m div { transform-origin: 40px 40px; }
.lds-spinner--xl div { transform-origin: 60px 60px; }
.lds-spinner div:nth-child(1) { transform: rotate(0deg); animation-delay: -1.1s; }
.lds-spinner div:nth-child(2) { transform: rotate(30deg); animation-delay: -1s; }
.lds-spinner div:nth-child(3) { transform: rotate(60deg); animation-delay: -0.9s; }
.lds-spinner div:nth-child(4) { transform: rotate(90deg); animation-delay: -0.8s; }
.lds-spinner div:nth-child(5) { transform: rotate(120deg); animation-delay: -0.7s; }
.lds-spinner div:nth-child(6) { transform: rotate(150deg); animation-delay: -0.6s; }
.lds-spinner div:nth-child(7) { transform: rotate(180deg); animation-delay: -0.5s; }
.lds-spinner div:nth-child(8) { transform: rotate(210deg); animation-delay: -0.4s; }
.lds-spinner div:nth-child(9) { transform: rotate(240deg); animation-delay: -0.3s; }
.lds-spinner div:nth-child(10) { transform: rotate(270deg); animation-delay: -0.2s; }
.lds-spinner div:nth-child(11) { transform: rotate(300deg); animation-delay: -0.1s; }
.lds-spinner div:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }

@keyframes lds-spinner {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100svh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}
```

## ConfirmationDialog
- Path: `src/components/ConfirmationDialog/ConfirmationDialog.tsx`
- Description: Popup-based confirmation primitive with yes/no and continue variants.
- Props: `isOpen`, `onClose`, `info`, `infoType`, `onConfirm`, `onCancel?`

```tsx
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
```

### ConfirmationDialog styles — `src/components/ConfirmationDialog/ConfirmationDialog.css`
```css
.confirmation-dialog-popup .popup-content {
  background-color: rgba(30, 30, 30, 0.95);
  border: 1px solid #00bfff;
  padding: 20px;
  width: 90%;
}

.confirmation-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  width: 100%;
  height: 92%;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  position: relative;
  overflow: hidden;
}

.confirmation-dialog__text {
  margin: 0 0 20px 0;
  font-size: 20px !important;
  white-space: pre-wrap;
  color: #404040;
  font-weight: bold;
}

.confirmation-dialog__actions {
  display: flex;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.confirmation-dialog__btn {
  flex-grow: 1;
  padding: 12px;
  border: none;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirmation-dialog__btn--confirm {
  background-color: #4CAF50;
  color: #fff;
}

.confirmation-dialog__btn--cancel {
  background-color: #f44336;
  color: #fff;
}
```
