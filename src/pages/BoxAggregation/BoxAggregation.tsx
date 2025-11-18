import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import BackspaceIcon from "../../assets/backspaceIcon";
import "./BoxAggregation.css";
import { ValueContext } from "../../context/valueContext";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import { addPack } from "../../api/addPack";
import Popup from "../../components/Popup/Popup";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import { removePack } from "../../api/removePack";
import DeleteDialog from "../../components/DeleteDialog/DeleteDialog";
import { finishCart } from "../../api/finishCart";
import { printCartLabel } from "../../api/printCartLabel";
import PencilIcon from "../../assets/PencilIcon";
import PrintIcon from "../../assets/printIcon";
import { changeQuantity } from "../../api/changeQuantity";

interface IPrintConfirmation {
  info: string;
  infoType: string;
}

const BoxAggregation = () => {
  const { pinAuthData } = useContext(PinContext);
  const { cartData, setCartData, setIsLoading } = useContext(ValueContext);
  const navigate = useNavigate();
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [printConfirmation, setPrintConfirmation] =
    useState<IPrintConfirmation | null>(null);
  const [isEditingPackCount, setIsEditingPackCount] = useState(false);
  const [newPackCount, setNewPackCount] = useState("");
  // const packCountInputRef = useRef<HTMLInputElement>(null); // УДАЛЕНО

  const successAudio = new Audio(successSound);
  const errorAudio = new Audio(errorSound);

  useEffect(() => {
    // Очищаем cartData при выходе со страницы
    return () => {
      setCartData(null);
    };
  }, [setCartData]);

  const handleScanPack = async (scanCode: string) => {
    if (!cartData) return;
    try {
      setIsLoading(true);
      const response = await addPack(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC,
        scanCode
      );

      if (response && (typeof response === "string" || response.error)) {
        errorAudio.play();
        setPopupErrorText(
          typeof response === "string" ? response : response.error
        );
        setPopupError(true);
      } else {
        successAudio.play();
        setCartData(response);
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePack = async (scanCode: string) => {
    if (!cartData) return;
    setIsDeleting(false);
    try {
      const response = await removePack(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC,
        scanCode
      );

      if (response.error) {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        successAudio.play();
        setCartData(response);
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    }
  };

  const handleFinishCart = async () => {
    if (!cartData) return;
    try {
      setIsLoading(true);
      const response = await finishCart(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC
      );

      if (response.error) {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        successAudio.play();
        setCartData(response); // Просто обновляем данные
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!cartData) return;
    try {
      setIsLoading(true);
      const response = await printCartLabel(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC
      );

      if (response.error) {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        setPrintConfirmation({
          info: response.info,
          infoType: response.infoType,
        });
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPrintLabel = async () => {
    if (!cartData || !printConfirmation) return;
    try {
      setIsLoading(true);
      setPrintConfirmation(null);
      const response = await printCartLabel(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC,
        printConfirmation.info,
        printConfirmation.infoType
      );

      if (response.error) {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        successAudio.play();
        // Можно показать финальный success popup, если нужно
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePackCount = async () => {
    if (!cartData) return;

    // Если ничего не ввели или значение не изменилось, просто закрываем окно
    if (!newPackCount || Number(newPackCount) === cartData.packCount) {
      setIsEditingPackCount(false);
      setNewPackCount("");
      return;
    }

    try {
      setIsLoading(true);
      const response = await changeQuantity(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        cartData.SSCC,
        Number(newPackCount)
      );

      if (response.error) {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      } else {
        successAudio.play();
        setCartData(response);
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Сетевая ошибка");
      setPopupError(true);
    } finally {
      setIsLoading(false);
      setIsEditingPackCount(false);
      setNewPackCount("");
    }
  };

  useCustomScanner(
    handleScanPack,
    !!cartData &&
      !popupError &&
      !isDeleting &&
      !printConfirmation &&
      !isEditingPackCount
  );

  useEffect(() => {
    if (!isEditingPackCount) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "0" && event.key <= "9") {
        setNewPackCount((current) => current + event.key);
      } else if (event.key === "Backspace") {
        setNewPackCount((current) => current.slice(0, -1));
      } else if (event.key === "Enter") {
        handleUpdatePackCount();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingPackCount, newPackCount, cartData]); // Добавил зависимости для корректной работы Enter

  if (!pinAuthData?.tsdUUID) {
    navigate("/");
    return null;
  }

  if (!cartData) {
    return (
      <div className="pallet">
        <div className="pallet-info">
          <div className="pallet-user">
            <button
              className="exit-button"
              onClick={() => navigate("/scan-box")}
            >
              <BackspaceIcon />
            </button>
            <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
          </div>
          <div className="box-aggregation-scan-prompt">
            <h2>Данные о коробе отсутствуют</h2>
            <p>Вернитесь и отсканируйте код</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DeleteDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onScan={handleRemovePack}
        title="Удаление пачки"
        prompt="Отсканируйте ШК пачки для удаления."
        withoutInput
        autoSubmit
      />

      <Popup
        isOpen={popupError}
        onClose={() => setPopupError(false)}
        containerClassName="popup-error"
      >
        <div className="popup-error__container">
          <h4 className="popup-error__text">{popupErrorText}</h4>
          <button
            className="popup-error__button"
            onClick={() => setPopupError(false)}
          >
            Продолжить
          </button>
        </div>
      </Popup>

      {printConfirmation && (
        <Popup
          isOpen={!!printConfirmation}
          onClose={() => setPrintConfirmation(null)}
          containerClassName="pallet-dialog"
        >
          <p className="pallet-dialog__text">{printConfirmation.info}</p>
          <div className="pallet-dialog-buttons">
            <button
              className="pallet-dialog-btn"
              onClick={() => setPrintConfirmation(null)}
            >
              Отмена
            </button>
            <button
              className="pallet-dialog-btn knopka-yes"
              onClick={confirmPrintLabel}
            >
              Печать
            </button>
          </div>
        </Popup>
      )}

      {isEditingPackCount && (
        <Popup
          isOpen={isEditingPackCount}
          onClose={() => setIsEditingPackCount(false)}
          containerClassName="pallet-dialog"
        >
          <h4 className="pallet-dialog__text">
            Введите новое количество в коробе
          </h4>
          <input
            type="text" // Меняем на text чтобы скрыть стрелки инпута
            readOnly
            className="pack-count-input"
            value={newPackCount}
            placeholder={String(cartData?.packCount)}
          />
          <div className="pallet-dialog-buttons">
            <button
              className="quantity-dialog-btn"
              onClick={() => {
                setIsEditingPackCount(false);
                setNewPackCount("");
              }}
            >
              Отмена
            </button>
            <button
              className="quantity-dialog-btn update-pack-count-btn"
              onClick={handleUpdatePackCount}
              disabled={!newPackCount}
            >
              Сохранить
            </button>
          </div>
        </Popup>
      )}

      <div className="pallet">
        <div className="pallet-info">
          <div className="pallet-user">
            <button
              className="exit-button"
              onClick={() => navigate("/workmode")}
            >
              <BackspaceIcon />
            </button>
            <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
          </div>

          <>
            <div className="pallet-block pallet-block-about">
              <span className="pallet-text">Короб:</span>
              <p className="pallet-text pallet-block__text_sscc">
                {cartData.SSCC || "SSCC не найден"}
              </p>
            </div>
            <div
              className="pallet-block pallet-block-status"
              style={{
                backgroundColor:
                  cartData.docState === "завершён" ? "lightgreen" : "khaki",
                color: cartData.docState === "завершён" ? "green" : "#808000",
              }}
            >
              <div className="pallet-block-status__doc-info">
                <span style={{ textAlign: "left" }}>
                  № {cartData.docNum} <br /> от {cartData.docDate}
                </span>
                <strong>{cartData.docState}</strong>
              </div>
            </div>
            <div className="pallet-block pallet-block-boxes">
              <div className="box-aggregation-product-info">
                <p className="box-aggregation-product-info__detail">
                  <strong className="box-aggregation-product-info__detail-title">
                    Товар:
                  </strong>{" "}
                  {cartData.prodName}
                </p>
                <p className="box-aggregation-product-info__detail">
                  <strong className="box-aggregation-product-info__detail-title">
                    GTIN:
                  </strong>{" "}
                  {cartData.GTIN}
                </p>
                <p className="box-aggregation-product-info__detail">
                  <strong className="box-aggregation-product-info__detail-title">
                    Серия:
                  </strong>{" "}
                  {cartData.serial}
                </p>
                <p className="box-aggregation-product-info__detail box-aggregation-product-info__detail-count">
                  <strong className="box-aggregation-product-info__detail-title box-aggregation-product-info__detail-title-count">
                    Собрано:
                  </strong>
                  {cartData.collectedCount} / {cartData.packCount}
                  <button
                    className="edit-pack-count-btn"
                    onClick={() => {
                      setNewPackCount(""); // Очищаем, чтобы сработал placeholder
                      setIsEditingPackCount(true);
                    }}
                  >
                    <PencilIcon size={20} color="#000" />
                  </button>
                </p>
                <button
                  className="box-aggregation-product-info__button print-button"
                  onClick={handlePrintLabel}
                  disabled={cartData.docState !== "завершён"}
                >
                  <PrintIcon size={20} />
                  Печать этикетки
                </button>
              </div>
            </div>
          </>

          <div className="pallet-buttons" style={{
                display: cartData.docState === "завершён" || cartData.collectedCount === 0 ? "none" : "initial",
              }}>
            <button
              className="pallet-button pallet-button_delete"
              onClick={() => setIsDeleting(true)}
              disabled={cartData.collectedCount === 0}
            >
              Удалить пачку
            </button>
            {cartData.collectedCount === cartData.packCount && (
              <button
                className="pallet-button pallet-button_finish"
                onClick={handleFinishCart}
              >
                Завершить сборку
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BoxAggregation;
