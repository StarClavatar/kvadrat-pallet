import { useContext, useState } from "react";
import { ValueContext } from "../../context/valueContext";
import "./Order.css";
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import BackspaceIcon from "../../assets/backspaceIcon";
import DeleteDialog from "../../components/DeleteDialog/DeleteDialog";
import { deletePallet } from "../../api/deletePallet";
import successSound from "../../assets/scanSuccess.mp3";
import errorSound from "../../assets/scanFailed.mp3";
import Popup from "../../components/Popup/Popup";
import { closeShipment } from "../../api/closeShipment";
import ConfirmationDialog from "../../components/ConfirmationDialog/ConfirmationDialog";
import { IPallet } from "./types";

const Order = () => {
  const { order, setOrder } = useContext(ValueContext);
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();

  const [isDeletingPallet, setIsDeletingPallet] = useState(false);
  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");
  const [popupSuccess, setPopupSuccess] = useState<boolean>(false);
  const [popupSuccessText, setPopupSuccessText] = useState<string>("");
  const [confirmation, setConfirmation] = useState<{info: string, infoType: 'yesNo' | 'next' | ''} | null>(null);

  const successAudio = new Audio(successSound);
  const errorAudio = new Audio(errorSound);
  
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "в работе":
        return { backgroundColor: "khaki", color: "#808000" };
      case "собран":
        return { backgroundColor: "lightgreen", color: "green" };
      case "новый":
        return { backgroundColor: "#add8e6", color: "#00008b" };
      case "закрыт":
        return { backgroundColor: "lightgrey", color: "#a9a9a9" };
      default:
        return {};
    }
  };

  const handlePalletClick = (pallet: IPallet) => {
    // if (pallet.isClosed) {
      navigate(`/view-pallet/${pallet.palletNum}`);
    // } else {
    //   navigate(`/work-pallet/${pallet.palletNum}`);
    // }
  };

  const handleDeletePallet = async (scannedCode: string) => {
    setIsDeletingPallet(false); // Close dialog
    try {
        const docNumForRequest = order.docNum.startsWith("00")
            ? order.docNum.substring(2)
            : order.docNum;

        const response = await deletePallet(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest,
            scannedCode // The scanned pallet number
        );

        if (!response.error) {
            successAudio.play();
            setOrder(response);
            setPopupSuccessText("Паллета успешно удалена.");
            setPopupSuccess(true);
        } else {
            errorAudio.play();
            setPopupErrorText(response.error);
            setPopupError(true);
        }
    } catch (err) {
        errorAudio.play();
        setPopupErrorText(String(err));
        setPopupError(true);
    }
  };

  const handleCloseShipmentClick = async () => {
    try {
        const docNumForRequest = order.docNum.startsWith("00")
            ? order.docNum.substring(2)
            : order.docNum;

        const response = await closeShipment(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest
        );

        if (response.error) {
            setPopupErrorText(response.error);
            setPopupError(true);
        } else if (response.infoType) {
            setConfirmation({ info: response.info, infoType: response.infoType });
        } else {
            successAudio.play();
            setOrder(response);
        }
    } catch (err) {
        setPopupErrorText(String(err));
        setPopupError(true);
    }
  };

  const onConfirmCloseShipment = async (confirmType: "yes" | "no") => {
    setConfirmation(null);
    try {
        const docNumForRequest = order.docNum.startsWith("00") ? order.docNum.substring(2) : order.docNum;
        
        const response = await closeShipment(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest,
            confirmType
        );

        if (response.error) {
            setPopupErrorText(response.error);
            setPopupError(true);
        } else {
            successAudio.play();
            setOrder(response);
        }
    } catch (err) {
        setPopupErrorText(String(err));
        setPopupError(true);
    }
  };

  return (
    <>
      <DeleteDialog
        isOpen={isDeletingPallet}
        onClose={() => setIsDeletingPallet(false)}
        onScan={handleDeletePallet}
        title="Удаление паллеты"
        prompt="Отсканируйте ШК паллеты для удаления."
      />
      {confirmation && (
          <ConfirmationDialog
              isOpen={!!confirmation}
              onClose={() => setConfirmation(null)}
              info={confirmation.info}
              infoType={confirmation.infoType}
              onConfirm={() => onConfirmCloseShipment("yes")}
              onCancel={() => onConfirmCloseShipment("no")}
          />
      )}
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

      <Popup
        isOpen={popupSuccess}
        onClose={() => setPopupSuccess(false)}
        containerClassName="order-popup-success"
      >
        <div className="order-popup-success__container">
          <h4 className="order-popup-success__text">{popupSuccessText}</h4>
          <button
            className="order-popup-success__button"
            onClick={() => setPopupSuccess(false)}
          >
            Продолжить
          </button>
        </div>
      </Popup>
      
      <div className="order">
        <div className="order-info">
          <div className="order-user">
            <button className="exit-button" onClick={() => navigate("/workmode")}>
              <BackspaceIcon color="#ffffff" />
            </button>
            <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
          </div>

          <header className="order-block order-block-about">
            <button className="order-text-button" onClick={() => navigate('/order-goods')}>
              <span className="order-text">Заказ № {order.docNum}</span>
            </button>
            <span
              className="order-block-status__status"
              style={{ color: getStatusStyles(order.docState).color }}
            >
              {order.docState}
            </span>
          </header>
          <div
            className="order-block order-block-status"
            style={getStatusStyles(order.docState)}
          >
            <p className="order-block-status__text">
              {`Отгрузка: ${order.shippingDate}`}
            </p>
            <p className="order-block-status__text">{order.customer}</p>
          </div>

          <main className="order-main order-block-boxes">
            <section className="order-pallets">
              <div className="pallets-list">
                {order.pallets.map((pallet) => (
                  <div
                    key={pallet.palletNum}
                    className={`group ${pallet.isClosed && 'pallet-closed'} ${pallet.isMono && 'pallet-mono'}`}
                    onClick={() => handlePalletClick(pallet)}
                  >
                    <div className="group__name-container">
                      <p className="group__name">{pallet.palletNum}</p>
                      <p className="group__name">{pallet.isClosed ? "Закрыта" : "В работе"}</p>
                    </div>
                    <p className="group__count">{pallet.productName}</p>
                    <p className="group__count">
                      собрано:{" "}
                      <strong
                        style={{ color: "#275dff" }}
                      >
                        {pallet.cartsOnPallet} кор.{" "}
                      </strong>{" "}
                      ({pallet.itemsOnPallet} шт.)
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>

        <footer className="order-buttons">
          <button
            className="order-button"
            onClick={() => {
              navigate("/scan-pallet");
            }}
          >
            Выбор паллеты
          </button>
          <button
            className="order-button order-button_delete"
            onClick={() => setIsDeletingPallet(true)}
          >
            Удалить паллету
          </button>
          <button
            className="order-button order-button_finish"
            onClick={handleCloseShipmentClick}
            disabled={order.docState !== "собран"}
          >
            Завершить
          </button>
        </footer>
      </div>
    </>
  );
};

export default Order;
