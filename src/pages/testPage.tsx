import { useEffect, useRef, useState } from "react";
import useScanDetection from "use-scan-detection";


const TestPage = () => {
    const [value, setValue] = useState("");
    // const [inputBuffer, setInputBuffer] = useState("");
    // const [lastKeyTime, setLastKeyTime] = useState(Date.now());
    // // useScanDetection({
    // //     onComplete: (code) => {
    // //         setValue((prev) => prev + code);      
    // //     }
    // // })

    // useEffect(() => {
    //     const handleKeyPress = (e: ) => {
    //         const currentTime = Date.now();
    //         const timeDiff = currentTime - lastKeyTime;

    //         // Если время между нажатиями клавиш меньше 50 мс, считаем, что это ввод со сканера
    //         if (timeDiff < 50) {
    //             setInputBuffer((prevBuffer) => prevBuffer + e.key);
    //         } else {
    //             // Сбрасываем буфер, если это обычный ввод с клавиатуры
    //             setInputBuffer(e.key);
    //         }

    //         setLastKeyTime(currentTime);
    //     };

    //     const handleKeyUp = (e) => {
    //         const currentTime = Date.now();
    //         const timeDiff = currentTime - lastKeyTime;

    //         // Считаем, что сканирование завершено, если прошло достаточно времени после последнего ввода
    //         if (timeDiff > 50 && inputBuffer.length > 0) {
    //             setValue(inputBuffer);
    //             setInputBuffer("");
    //         }
    //     };

    //     // Добавляем обработчики на window
    //     window.addEventListener("keypress", handleKeyPress);
    //     window.addEventListener("keyup", handleKeyUp);

    //     // Удаляем обработчики при размонтировании компонента
    //     return () => {
    //         window.removeEventListener("keypress", handleKeyPress);
    //         window.removeEventListener("keyup", handleKeyUp);
    //     };
    // }, [inputBuffer, lastKeyTime]);
    return (
        <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />

        </div>
    );
};

export default TestPage;
