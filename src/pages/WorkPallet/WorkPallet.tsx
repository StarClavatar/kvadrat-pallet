import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValueContext } from "../../context/valueContext";
import { PinContext } from "../../context/PinAuthContext";
import "./WorkPallet.css";
import { useCustomScanner } from "../../hooks/useCustomScanner";
import { addScan } from "../../api/addScan";
import errorSound from "../../assets/scanFailed.mp3";
import successSound from "../../assets/scanSuccess.mp3";
import Popup from "../../components/Popup/Popup";
import { IPallet } from "../Order/types";
import BackspaceIcon from "../../assets/backspaceIcon";
import { deleteScan } from "../../api/deleteScan";
import DeleteDialog from "../../components/DeleteDialog/DeleteDialog";
import { closePallet } from "../../api/closePallet";
import ConfirmationDialog from "../../components/ConfirmationDialog/ConfirmationDialog";

const WorkPallet = () => {
  const { order, setOrder } = useContext(ValueContext);
  const { pinAuthData } = useContext(PinContext);
  const { palletId } = useParams<{ palletId: string }>();
  const navigate = useNavigate();

  const [popupError, setPopupError] = useState<boolean>(false);
  const [popupErrorText, setPopupErrorText] = useState<string>("");
  const [isDeletingScan, setIsDeletingScan] = useState(false);
  const [popupSuccess, setPopupSuccess] = useState<boolean>(false);
  const [popupSuccessText, setPopupSuccessText] = useState<string>("");
  const [confirmation, setConfirmation] = useState<{info: string, infoType: 'yesNo' | 'next' | ''} | null>(null);

  const successAudio = new Audio(successSound);
  const errorAudio = new Audio(errorSound);
  console.log("order:", order);

  let activePallet: IPallet | undefined = order.pallets.find((p) => {
    try {
      // Сравниваем как BigInt для обработки длинных числовых строк и возможных различий в формате (например, ведущие нули)
      return BigInt(p.palletNum) === BigInt(palletId || order.activePallet);
    } catch (e) {
      // Если преобразование не удалось, сравниваем как строки
      return p.palletNum === (palletId || order.activePallet);
    }
  });

  console.log("activePallet:", activePallet);

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

  const handleScan = async (scannedCode: string) => {
    try {
      const docNumForRequest = order.docNum.startsWith("00")
        ? order.docNum.substring(2)
        : order.docNum;
      const response = await addScan(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        docNumForRequest,
        palletId!,
        scannedCode
      );
      if (!response.error) {
        successAudio.play();

        setOrder(response);
      } else {
        errorAudio.play();
        setPopupErrorText(response.error);
        setPopupError(true);
      }
    } catch (err) {
      errorAudio.play();
      setPopupErrorText("Ошибка " + err);
      setPopupError(true);
    }
  };

  const handleDeleteScan = async (scannedCode: string) => {
    setIsDeletingScan(false); // Close dialog immediately
    try {
        const docNumForRequest = order.docNum.startsWith("00")
            ? order.docNum.substring(2)
            : order.docNum;
        const response = await deleteScan(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest,
            palletId!,
            scannedCode
        );
        if (!response.error) {
            successAudio.play();
            setOrder(response);
            setPopupSuccessText("Товар успешно удален. Не забудьте убрать его с паллеты.");
            setPopupSuccess(true);
            // setTimeout(() => setPopupSuccess(false), 5000); 
            // setPopupSuccess(false); 
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

  const handleClosePalletClick = async () => {
    try {
        const docNumForRequest = order.docNum.startsWith("00")
            ? order.docNum.substring(2)
            : order.docNum;

        const response = await closePallet(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest,
            palletId!
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

  const onConfirmClosePallet = async (confirmType: "yes" | "no") => {
    setConfirmation(null);
    try {
        const docNumForRequest = order.docNum.startsWith("00") ? order.docNum.substring(2) : order.docNum;
        
        const response = await closePallet(
            String(pinAuthData?.pinCode),
            String(localStorage.getItem("tsdUUID")),
            docNumForRequest,
            palletId!,
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

  useCustomScanner(handleScan, !popupError && !isDeletingScan && !popupSuccess && !confirmation);

  if (popupError) {
    return (
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
    );
  }

  return (
    <>
      <DeleteDialog
        isOpen={isDeletingScan}
        onClose={() => setIsDeletingScan(false)}
        onScan={handleDeleteScan}
        title="Удаление товара"
        prompt="Отсканируйте ШК/DM товара, который нужно удалить с паллеты."
      />
      
      {confirmation && (
        <ConfirmationDialog
            isOpen={!!confirmation}
            onClose={() => setConfirmation(null)}
            info={confirmation.info}
            infoType={confirmation.infoType}
            onConfirm={() => onConfirmClosePallet("yes")}
            onCancel={() => onConfirmClosePallet("no")}
        />
      )}
      
      <Popup
        isOpen={popupSuccess}
        onClose={() => setPopupSuccess(false)}
        containerClassName="work-pallet-popup-success"
      >
        <div className="work-pallet-popup-success__container">
          <h4 className="work-pallet-popup-success__text">{popupSuccessText}</h4>
          <button
            className="work-pallet-popup-success__button"
            onClick={() => setPopupSuccess(false)}
          >
            Продолжить
          </button>
        </div>
      </Popup>

      <div className="work-pallet">
        <div className="work-work-pallet-info">
          <div className="work-work-pallet-user">
            <button className="exit-button" onClick={() => navigate("/order")}>
              <BackspaceIcon color="#fff"/>
            </button>
            <p className="work-pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
          </div>
          <header className="work-work-pallet-block work-work-pallet-block-about">
            <span className="work-work-pallet-text">Заказ № {order.docNum}</span>
             <span
                className="work-work-pallet-block-status__status"
                style={{ color: getStatusStyles(order.docState).color }}
             >
                {order.docState}
             </span>
          </header>
          <div
            className="work-work-pallet-block work-work-pallet-block-status"
            style={getStatusStyles(order.docState)}
          >
            <p className="work-work-pallet-block-status__text">
              Отгрузка: {order.shippingDate}
            </p>
             <p className="work-work-pallet-block-status__text">
              {order.customer}
            </p>
          </div>

            <div className="work-pallet-identity">
              <div className="work-pallet-identity__number">
                {activePallet?.palletNum}
              </div>
              <div className="work-pallet-identity__info">
                <p className="work-pallet-identity__type">{activePallet?.productName} {activePallet?.isClosed ? <strong style={{color: "red"}}>Закрыта</strong> : <strong style={{color: "green"}}>В работе</strong>}</p>
              </div>
              <div className="order-identity__count">
                собрано <span>{activePallet?.cartsOnPallet} кор.</span>
              </div>
            </div>
          <main className="work-work-pallet-main">
            <div className="work-pallet-details-list">
              {activePallet?.details?.map((item, index) => (
                <div key={index} className="work-pallet-details-item">
                  <div className="work-pallet-details-item__info">
                    <p className="work-pallet-details-item__name">{item.productName}</p>
                    <p className="work-pallet-details-item__serial">
                      (серия: {item.produсtSerial})
                    </p>
                  </div>
                  <div className="work-pallet-details-item__counts">
                    <p className="work-pallet-details-item__count_main"><strong>{item.cartsOnCount} кор. </strong> ({item.itemsOnCount} шт.)</p>
                    <p className="work-pallet-details-item__count_additional">+{item.itemsOnFree}шт.</p>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
        <footer className="work-work-pallet-footer">
          <button className="work-work-pallet-footer__btn work-work-pallet-footer__btn--scan">Сканируем товары</button>
          <button className="work-work-pallet-footer__btn work-work-pallet-footer__btn--finish" disabled={!activePallet || activePallet.isClosed} onClick={handleClosePalletClick}>{'Завершить паллету'}</button>
          <button className="work-work-pallet-footer__btn work-work-pallet-footer__btn--delete" onClick={() => setIsDeletingScan(true)}>Удалить товар</button>
        </footer>
      </div>
    </>
  );
};

export default WorkPallet;
