import Popup from "../Popup/Popup";
import "./ScanDialog.css";
import { useState } from "react";

type Props = {
  cmd: (code: string) => void;
  isOpen: boolean;
  close: () => void;
  text: string;
};

const ScanDialog = ({ close, isOpen, cmd, text }: Props) => {
  const [value, setValue] = useState('')
  
  // useScanDetection({
  //   onComplete: (code) => {
  //     // const normalizedCode = code.replace(/[^0-9]/g, "").toString();
  //     setValue(String(code))
  //     // cmd(normalizedCode);
  //   },
  // });

  return (
    <Popup
      onClose={close}
      isOpen={isOpen}
      title="диалог сканирования"
      containerClassName="scan-dialog"
    >
      <p className="scan-dialog-text">{value}</p>
      <input type="text" style={{fontSize: "16px"}}/>
      <button className="scan-dialog-btn">
        Кнопка ёпта
      </button>
    </Popup>
  );
};

export default ScanDialog;
