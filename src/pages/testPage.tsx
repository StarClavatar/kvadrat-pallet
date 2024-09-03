import { useState } from "react";
import { useSymbologyScanner } from "@use-symbology-scanner/react";

const TestPage = () => {

    const handleSymbol = (symbol: string): void => {
        setValue("scanned: " + symbol)
    }

    useSymbologyScanner(handleSymbol)
  const [value, setValue] = useState("");
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => setValue("")}>стереть</button>
    </div>
  );
};

export default TestPage;
