import { useState, useContext, FormEvent, useEffect } from "react";
import "./CreateBox.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import { ValueContext } from "../../context/valueContext";
import Popup from "../../components/Popup/Popup";
import { createCart } from "../../api/createCart";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import { ICartData } from "../../context/valueContext";
import Loader from "../../components/Loader/Loader";

const CreateBox = () => {
    const { setCartData, isLoading, setIsLoading, initialCartInfo, setInitialCartInfo, initialScanCode, setInitialScanCode } = useContext(ValueContext);
    const [scanCode, setScanCode] = useState<string>("");
    const [manualInput, setManualInput] = useState<string>(""); // Для ручного ввода
    const navigate = useNavigate();
    const { pinAuthData } = useContext(PinContext);
    const [popupError, setPopupError] = useState<boolean>(false);
    const [popupErrorText, setPopupErrorText] = useState<string>("");
    const [productInfo, setProductInfo] = useState<ICartData | null>(null);
    const [packCount, setPackCount] = useState<string>("");

    const audioSuccess = new Audio(successSound);
    const audioError = new Audio(errorSound);

    useEffect(() => {
        if (initialCartInfo && initialScanCode) {
            setProductInfo(initialCartInfo);
            setScanCode(initialScanCode);
        }
        // Очищаем данные из контекста при размонтировании, чтобы избежать их повторного использования
        return () => {
            setInitialCartInfo(null);
            setInitialScanCode(null);
        };
    }, [initialCartInfo, initialScanCode, setInitialCartInfo, setInitialScanCode]);

    const handleInitialScan = async (scannedCode: string) => {
        if (!scannedCode) return;
        setIsLoading(true);
        try {
            const response = await createCart(
                String(pinAuthData?.pinCode),
                String(localStorage.getItem("tsdUUID")),
                scannedCode
            );

            if (response.SSCC && response.SSCC.length > 0) {
                audioSuccess.play();
                setCartData(response);
                navigate('/box-aggregation');
            } else if (response.error) {
                console.log("ЗДОРОВЕННЫЙ ХУЙ",response.error);
                audioError.play();
                setPopupErrorText(response.error);
                setPopupError(true);
            } else {
                audioSuccess.play();
                setProductInfo(response);
                setScanCode(scannedCode);
            }
        } finally {
            setIsLoading(false);
            setManualInput("");
        }
    };

    const handleInitialSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleInitialScan(manualInput);
    };

    const handleCreateCart = async () => {
        if (!packCount.trim()) {
            audioError.play();
            setPopupErrorText("Необходимо указать количество");
            setPopupError(true);
            return;
        }
        setIsLoading(true);
        try {
            const response = await createCart(
                String(pinAuthData?.pinCode),
                String(localStorage.getItem("tsdUUID")),
                scanCode,
                Number(packCount)
            );

            if (response.error) {
                audioError.play();
                setPopupErrorText(response.error);
                setPopupError(true);
            } else {
                audioSuccess.play();
                setCartData(response);
                navigate('/box-aggregation');
            }
        } catch (err) {
            audioError.play();
            setPopupErrorText("Сетевая ошибка");
            setPopupError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async (e: FormEvent) => {
        e.preventDefault();
        handleCreateCart();
    };

    useCustomScanner(handleInitialScan, !productInfo && !isLoading && !popupError);

    useEffect(() => {
        if (!productInfo) return; // Слушатель активен только на экране ввода количества

        const handleKeyDown = (event: KeyboardEvent) => {
            // Предотвращаем дублирование ввода если фокус уже в инпуте
            if (event.target instanceof HTMLInputElement) return;

            if (event.key >= '0' && event.key <= '9') {
                setPackCount(current => current + event.key);
            } else if (event.key === 'Backspace') {
                setPackCount(current => current.slice(0, -1));
            } else if (event.key === 'Enter') {
                event.preventDefault();
                handleCreateCart();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [productInfo, packCount, scanCode, pinAuthData]);


    if (isLoading) return <Loader />;

    if (popupError) {
        return (
          <Popup isOpen={popupError} onClose={() => setPopupError(false)} containerClassName="popup-error">
            <div className="popup-error__container">
              <h4 className="popup-error__text">{popupErrorText}</h4>
              <button className="popup-error__button" onClick={() => setPopupError(false)}>Продолжить</button>
            </div>
          </Popup>
        );
    }

    if (productInfo) {
        return (
            <div className="new-pallet">
                <h2 className="new-pallet__heading">Создание короба</h2>
                <h2 className="new-pallet__heading" style={{ marginBottom: "20px" }}>{productInfo.prodName}</h2>
                <p className="product-info__serial">Серия: {productInfo.serial}</p>
                <form className="pallet-form" onSubmit={handleFinalSubmit}>
                    <input
                        required
                        type="number"
                            placeholder="Кол-во пачек в коробе"
                            className="input pallet-form__input"
                        value={packCount}
                        onChange={(e) => setPackCount(e.target.value)}
                    />
                    <button className="pallet-form__send-button" type="submit">
                        Создать короб
                    </button>
                </form>
                <button
                    className="exit-button_new-pallet"
                    onClick={() => navigate("/workmode")}
                >
                    Выбор режима работы
                </button>
            </div>
        )
    }

    return (
        <div className="new-pallet">
            <h2 className="new-pallet__heading">Выбор или создание короба</h2>
            <form className="pallet-form" onSubmit={handleInitialSubmit}>
                <input
                  required
                  type="text"
                  placeholder="Отсканируйте код пачки"
                  className="input pallet-form__input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                />
                <button className="pallet-form__send-button" type="submit">
                  Отправить
                </button>
            </form>
            <button
                className="exit-button_new-pallet"
                onClick={() => navigate("/workmode")}
            >
                Выбор режима работы
            </button>
        </div>
    );
};

export default CreateBox;
