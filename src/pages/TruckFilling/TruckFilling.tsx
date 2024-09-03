// import { TPallet } from "../Pallet/config";
import "./TruckFilling.css";
import { useState, useContext, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import DeleteBoxInteractive from "../../components/DeleteBoxInteractive/DeleteBoxInteractive";
import { PinContext } from "../../context/PinAuthContext";
import useScanDetection from "use-scan-detection";
import errorSound from "../../assets/scanFailed.mp3";
import successSound from "../../assets/scanSuccess.mp3";
import Loader from "../../components/Loader/Loader";
import { closePallet } from "../../api/closePallet";
import { fetchTruckInfo } from "../../api/truckinfo";
import { shipPallet } from "../../api/shipPallet";
import { closeShipment } from "../../api/closeShipment";
import { unshipPallet } from "../../api/unshipPallet";
import { ValueContext } from "../../context/valueContext";

const TruckFilling = () => {
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();
  const [showPalletDelete, setShowPalletDelete] = useState<boolean>(false);
  // const [pallet, setPallet] = useState<TPallet>();
  const [truckInfo, setTruckInfo] = useState<ITruckInfo>();

  const params = useParams();
  const [palletDataError, setPalletDataError] = useState<boolean>(false);
  const [palletErrorText, setPalletErrorText] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [showPallets, setShowPallets] = useState<boolean>(false);
  const errorAudio = new Audio(errorSound);
  const [closeShipmentPopup, setCloseShipmentPopup] = useState<boolean>(false);
  const [InfoTypePopup, setInfoTypePopup] = useState<boolean>(false);
  const { value } = useContext(ValueContext);
  const successAudio = new Audio(successSound);

  const scannedCode = useRef<string>();
  const handleScan = async (code: string) => {
    const normalizedCode = code.replace(/[^0-9]/g, "").toString();
    scannedCode.current = normalizedCode;
    try {
      const response: ITruckInfo = await shipPallet(
        String(pinAuthData?.pinCode),
        String(localStorage.getItem("tsdUUID")),
        String(params.docId),
        normalizedCode
      );

      if (response.info) {
        setIsDialogOpen(true);
      }

      if (!response.error) {
        successAudio.play();

        setTruckInfo(response);
      } else {
        setPalletDataError(true);
        setPalletErrorText(response.error);
      }
    } catch (err) {
      alert(err);
    }
  };

  // const handleClosePallet = async () => {
  //   setCloseShipmentPopup(true);
  //   try {
  //     const response = await closeShipment(
  //       String(pinAuthData?.pinCode),
  //       String(pinAuthData?.tsdUUID),
  //       String(params.docId)
  //     );
  //     if (response.error) {
  //       alert(response.error);
  //     } else {
  //       setTruckInfo(response);
  //     }
  //   } catch (e) {
  //     alert(e);
  //   }
  // };

  useScanDetection({
    onComplete: (code) => {
      if (!showPalletDelete || !palletDataError) {
        handleScan(String(code));
      }
    },
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan(inputValue);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const decodedDocID = decodeURIComponent(String(params.docId));
      const response = await fetchTruckInfo(
        String(pinAuthData?.pinCode),
        String(pinAuthData?.tsdUUID),
        decodedDocID
      );
      if (!response.error) {
        successAudio.play();
        setTruckInfo(response);
        console.log(truckInfo);
      } else {
        errorAudio.play();
        setPalletDataError(true);
        setPalletErrorText(response.error);
      }
    };

    fetchData();
  }, []);

  if (!pinAuthData?.tsdUUID) {
    navigate("/");
  }

  if (!truckInfo) {
    return (
      <div className="loading">
        {palletErrorText ? (
          <div className="truck-filling-error">
            <p className="loading__error-text">{palletErrorText}</p>
            <button
              className="popup-error__button"
              onClick={() => navigate("/new-truck-filling")}
            >
              Назад
            </button>
          </div>
        ) : (
          <Loader />
        )}
      </div>
    );
  }

  if (palletDataError) {
    errorAudio.play();
    return (
      <Popup
        containerClassName="popup-error"
        isOpen={palletDataError}
        onClose={() => {
          setPalletDataError(false);
        }}
      >
        <div className="popup-error__container">
          <h4 className="popup-error__text">{palletErrorText}</h4>
          <button
            className="popup-error__button"
            onClick={() => setPalletDataError(false)}
          >
            продолжить
          </button>
        </div>
      </Popup>
    );
  }

  return (
    <div className="truck-filling">
      <div className="truck-filling-info">
        <div className="truck-filling-user">
          <button
            className="exit-button"
            onClick={() => navigate("/new-truck-filling")}
          >
            Выйти
          </button>
          <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
        </div>
        <div className="truck-filling-block truck-filling-block-about">
          <span className="truck-filling-text truck-filling-block-about">
            Отгрузка №
          </span>
          <p className="truck-filling-text truck-filling-block__text_sscc">
            {truckInfo.shipID}
          </p>
        </div>
        <div
          className="truck-filling-block truck-filling-block-status"
          style={{
            backgroundColor:
              truckInfo.shipState === "загружена" ? "lightgreen" : "khaki",
          }}
        >
          <span
            className="truck-filling-block-status__status"
            style={{
              color: truckInfo.shipState === "загружена" ? "green" : "#808000",
            }}
          >
            {truckInfo.shipState}
          </span>
          <p className="truck-filling-block-status__text">
            {`${truckInfo.beginDate} ${
              truckInfo.endDate ? `${"- " + truckInfo.endDate}` : ""
            }`}
          </p>
        </div>
        <div className="truck-pallets">
          <div className="truck-filling-block truck-filling-text-block">
            <div className="row-wrapper">
              <span className="truck-filling-text truck-filling-text_auto text-bold">
                Автомобиль:
              </span>
              <p className="truck-filling-text truck-filling-block__text_sscc">
                {truckInfo.truckNumber}
              </p>
            </div>
            <span className="truck-filling-text">
              {`(${truckInfo.shipZone})`}
            </span>
          </div>
          <div className="truck-filling-block truck-filling-text-block">
            <div
              className="column-wrapper"
              onClick={() => setShowPallets(true)}
            >
              <span className="truck-filling-text text-bold">
                Погружено паллет:
              </span>
              <p className="truck-filling-text truck-filling-text_pallets">
                {truckInfo.pallets.length}
              </p>
            </div>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="truck-filling-buttons">
          <button
            className="truck-filling-button truck-filling-button_delete"
            disabled={truckInfo.pallets.length === 0 ? true : false}
            // style={{
            //   display: truckInfo.pallets.length === 0 ? "none" : "initial",
            // }}
            onClick={() => {
              setShowPalletDelete(true);
            }}
          >
            Удалить паллету
          </button>
          <button
            disabled={truckInfo.pallets.length === 0 ? true : false}
            className="truck-filling-button truck-filling-button_finish"
            onClick={() => setCloseShipmentPopup(true)}
          >
            Завершить
          </button>
        </div>
      </div>
      {/* попап добавления коробки с infoType */}
      {truckInfo.info ? (
        <Popup
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          containerClassName="truck-filling-dialog"
          title="Добавление паллеты"
        >
          <p className="truck-filling-dialog__text">{truckInfo.info}</p>
          <div className="truck-filling-dialog-buttons">
            {truckInfo.infoType === "yesNo" ? (
              <>
                <button
                  className="truck-filling-dialog-btn knopka-yes"
                  onClick={async () => {
                    setTruckInfo(
                      await shipPallet(
                        String(pinAuthData?.pinCode),
                        pinAuthData?.tsdUUID || "",
                        params.sdocId || "",
                        String(scannedCode.current),
                        truckInfo.info,
                        "yes"
                      )
                    );
                  }}
                >
                  Да
                </button>
                <button
                  className="truck-filling-dialog-btn"
                  onClick={async () => {
                    const response = await shipPallet(
                      String(pinAuthData?.pinCode),
                      pinAuthData?.tsdUUID || "",
                      params.docId || "",
                      String(scannedCode.current),
                      truckInfo.info,
                      "no"
                    );
                    if (response.error) {
                      setIsDialogOpen(false);
                      setPalletErrorText(response.error);
                      setPalletDataError(true);
                    }
                  }}
                >
                  Нет
                </button>
              </>
            ) : (
              <button className="truck-filling-dialog-btn">Продолжить</button>
            )}
          </div>
        </Popup>
      ) : null}
      {/* попап завершения погрузки */}
      {truckInfo.info ? (
        <Popup
          isOpen={closeShipmentPopup}
          onClose={() => setCloseShipmentPopup(false)}
          containerClassName="truck-filling-dialog"
          title="Завершение погрузки"
        >
          <p className="truck-filling-dialog__text">{truckInfo.info}</p>
          <div className="truck-filling-dialog-buttons">
            {truckInfo.infoType === "yesNo" ? (
              <>
                <button
                  className="truck-filling-dialog-btn"
                  onClick={async () => {
                    setTruckInfo(
                      await closeShipment(
                        String(pinAuthData?.pinCode),
                        pinAuthData?.tsdUUID || "",
                        params.docId || ""
                      )
                    );
                  }}
                >
                  Да
                </button>
                <button
                  className="truck-filling-dialog-btn"
                  onClick={async () => {
                    const response = await closePallet(
                      String(pinAuthData?.pinCode),
                      pinAuthData?.tsdUUID || "",
                      params.sscc || "",
                      truckInfo.info,
                      "no"
                    );
                    if (response.error) {
                      setCloseShipmentPopup(false);
                      setPalletErrorText(response.error);
                      setPalletDataError(true);
                    }
                  }}
                >
                  Нет
                </button>
              </>
            ) : (
              <button
                className="truck-filling-dialog-btn"
                onClick={async () => {
                  const response = await closeShipment(
                    String(pinAuthData?.pinCode),
                    pinAuthData?.tsdUUID || "",
                    params.docId || "",
                    truckInfo.info,
                    "next"
                  );
                  setTruckInfo(response);
                  if (response.error) {
                    setCloseShipmentPopup(false);
                    setPalletErrorText(response.error);
                    setPalletDataError(true);
                  }
                }}
              >
                Продолжить
              </button>
            )}
          </div>
        </Popup>
      ) : null}
      {/* завершение паллеты без infoType */}
      <Popup
        isOpen={closeShipmentPopup}
        onClose={() => setCloseShipmentPopup(false)}
        containerClassName="truck-filling-dialog"
        title="Завершение погрузки"
      >
        <p className="truck-filling-dialog__text">{`Завершить погрузку?`}</p>
        <div className="truck-filling-dialog-buttons">
          <button className="truck-filling-dialog-btn" onClick={() => setCloseShipmentPopup(false)}>Да</button>
          <button className="truck-filling-dialog-btn" onClick={() => setCloseShipmentPopup(false)}>Нет</button>
        </div>
      </Popup>
      {/* Модальное окно удаления паллеты c infoType */}
      {truckInfo.info ? (
        <Popup
          isOpen={InfoTypePopup}
          onClose={() => setInfoTypePopup(false)}
          containerClassName="pallet-dialog"
        >
          <p className="pallet-dialog__text">{truckInfo.info}</p>
          <div className="pallet-dialog-buttons">
            {truckInfo.infoType === "yesNo" ? (
              <>
                <button
                  className="pallet-dialog-btn knopka-yes"
                  onClick={async () => {
                    setTruckInfo(
                      await unshipPallet(
                        String(pinAuthData?.pinCode),
                        String(pinAuthData?.tsdUUID),
                        String(params.sscc),
                        value,
                        truckInfo.info,
                        "yes"
                      )
                    );
                  }}
                >
                  Да
                </button>
                <button
                  className="pallet-dialog-btn"
                  onClick={async () => {
                    const response = await unshipPallet(
                      String(pinAuthData?.pinCode),
                      String(pinAuthData?.tsdUUID),
                      String(params.docId),
                      value,
                      truckInfo.info,
                      "no"
                    );
                    if (response.error) {
                      setInfoTypePopup(false);
                      setPalletErrorText(response.error);
                      setPalletDataError(true);
                    }
                  }}
                >
                  Нет
                </button>
              </>
            ) : (
              <button className="pallet-dialog-btn" onClick={() => setInfoTypePopup(false)}>Продолжить</button>
            )}
          </div>
        </Popup>
      ) : null}
      {/* Модальное окно удаления паллеты */}
      <Popup
        title="Удаление Паллеты"
        isOpen={showPalletDelete}
        onClose={() => setShowPalletDelete(false)}
      >
        <DeleteBoxInteractive
          onClose={() => setShowPalletDelete(false)}
          isPopupOpened={showPalletDelete}
          setPallet={setTruckInfo}
          type="truck"
        />
      </Popup>
      {/* Попап с таблицей паллет */}
      <Popup
        containerClassName="popup_group"
        title="Просмотр паллет"
        isOpen={showPallets}
        onClose={() => setShowPallets(false)}
      >
        <table className="pallet-table">
          <thead>
            <tr className="pallet-table__row">
              <th className="pallet-table__heading">Паллета</th>
              <th className="pallet-table__heading">Дата</th>
              <th className="pallet-table__heading">Сотрудник</th>
            </tr>
          </thead>
          <tbody>
            {truckInfo.pallets.map((pallet, index) => (
              <tr className="pallet-table__row" key={index}>
                <td className="pallet-table__data pallet-table__sscc">
                  {pallet.palletSSCC}
                </td>
                <td className="pallet-table__data">{pallet.shipDate}</td>
                <td className="pallet-table__data">{pallet.workerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Popup>
    </div>
  );
};

export default TruckFilling;
