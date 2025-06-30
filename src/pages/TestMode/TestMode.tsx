import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./TestMode.css";
import { useCustomScanner } from "../../hooks/useCustomScanner";

const TestMode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(" ");

  const handleScan = (symbol: string) => {
    setCode(symbol);
    console.log("Отсканированный код:", symbol);
  };

  useCustomScanner(handleScan);

  return (
    <div className="test-mode">
      <h2 className="test-mode__heading">TestMode</h2>
      <p className="test-mode__text">тестим сканирование</p>
      <strong className="test-mode__code">{code.trim() === "" ? "порожняк" : code}</strong>
      <input
        className="test-mode__input"
        type="text"
        value={code.trim() === "" ? "порожняк" : code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="test-mode__clear-button" onClick={() => setCode("")}>
        Опорожнить
      </button>
      <button className="test-mode__exit-button" onClick={() => navigate(-1)}>
        Выход
      </button>
    </div>
  );
};

export default TestMode;
