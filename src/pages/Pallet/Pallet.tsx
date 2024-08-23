import { TPallet, TGroup } from "./config";
import "./Pallet.css";
import { ReactNode, useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import DeleteBoxInteractive from "../../components/DeleteBoxInteractive/DeleteBoxInteractive";
import Group from "../../components/Group/Group";
import { PinContext } from "../../context/PinAuthContext";
import { fetchPalletInfo } from "../../api/palletInfo";
import useScanDetection from "use-scan-detection";
import { addCart } from "../../api/addCart";
import errorSound from "../../assets/scanFailed.mp3";
import successSound from "../../assets/scanSuccess.mp3";
import Loader from "../../components/Loader/Loader";
import { closePallet } from "../../api/closePallet";

const Pallet = () => {
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [pallet, setPallet] = useState<TPallet>();
  const params = useParams();
  const [palletDataError, setPalletDataError] = useState<boolean>(false);
  const [palletErrorText, setPalletErrorText] = useState<string>("");
  // const [inputValue, setInputValue] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const errorAudio = new Audio(errorSound);
  const [closePalletPopup, setClosePalletPopup] = useState<boolean>(false);
  const successAudio = new Audio(successSound);

  const scannedCode = useRef<string>();
  console.log(pallet);
  const handleScan = async (code: string) => {
    const normalizedCode = code.replace(/[^0-9]/g, "").toString();
    scannedCode.current = normalizedCode;
    try {
      const response: TPallet = await addCart(
        String(pinAuthData?.pinCode),
        String(params.sscc),
        normalizedCode,
        String(localStorage.getItem("tsdUUID"))
      );

      if (response.info) {
        setIsDialogOpen(true);
      }

      if (!response.error) {
        successAudio.play();

        setPallet(response);
      } else {
        setPalletDataError(true);
        setPalletErrorText(response.error);
      }
    } catch (err) {
      alert(err);
    }
  };

  const handleClosePallet = async () => {
    setClosePalletPopup(true);
    try {
      const response = await closePallet(
        String(pinAuthData?.pinCode),
        String(pinAuthData?.tsdUUID),
        String(params.sscc)
      );
      if (response.error) {
        alert(response.error);
      } else {
        setPallet(response);
      }
    } catch (e) {
      alert(e);
    }
  };

  useScanDetection({
    onComplete: (code) => {
      if (!showDelete && pallet?.palletState !== "закрыта" && pallet?.palletState !== "собрана") {
        handleScan(String(code));
      }
    },
  });

  useEffect(() => {
    console.log(pinAuthData);
    const fetchData = async () => {
      const response = await fetchPalletInfo(
        String(pinAuthData?.pinCode),
        params.sscc || "",
        "",
        pinAuthData?.tsdUUID || ""
      );
      if (!response.error) {
        setPallet(response);
        console.log(pallet);
      } else {
        setPalletDataError(response.error);
        setPalletErrorText(response.error);
      }
    };

    fetchData();
  }, []);

  function sumCartsOnCount(pallet: TPallet): number {
    return pallet.groups.reduce(
      (acc: number, group: TGroup) => acc + group.cartsOnCount,   
      0
    );
  }

  useEffect(() => {
    if (pallet) {
      console.log(sumCartsOnCount(pallet))
    }
  }, [pallet]);

  if (!pinAuthData?.tsdUUID) {
    navigate("/");
  }

  if (!pallet) {
    return (
      <div className="loading">
        {palletErrorText ? (
          <div className="pallet-error">
            <p className="loading__error-text">{palletErrorText}</p>
            <button
              className="popup-error__button"
              onClick={() => navigate("/new-pallet")}
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

  // const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(e.target.value);
  // };

  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === "Enter") {
  //     handleScan(inputValue);
  //   }
  // };

  return (
    <div className="pallet">
      <div className="pallet-info">
        <div className="pallet-user">
          <button
            className="exit-button"
            onClick={() => navigate("/new-pallet")}
          >
            Выйти
          </button>
          <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
        </div>
        <div className="pallet-block pallet-block-about">
          <span className="pallet-text pallet-block-about">Паллета №</span>
          <p className="pallet-text pallet-block__text_sscc">
            {pallet.palletSSCC}
          </p>
        </div>
        <div
          className="pallet-block pallet-block-status"
          style={{
            backgroundColor:
              pallet.palletState === "собрана" ? "lightgreen" : "khaki",
          }}
        >
          <span
            className="pallet-block-status__status"
            style={{
              color: pallet.palletState === "собрана" ? "green" : "#808000",
            }}
          >
            {pallet.palletState}
          </span>
          <p className="pallet-block-status__text">
            {`${pallet.beginDate} ${
              pallet.endDate ? `${"- " + pallet.endDate}` : ""
            }`}
          </p>
        </div>
        <div className="pallet-block pallet-block-boxes">
          {pallet.groups.map((group: TGroup, idx): ReactNode => {
            return <Group {...group} key={idx} />;
          })}
        </div>
        <div className="pallet-buttons">
          {/* <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          /> */}
          <button
            className="pallet-button pallet-button_next-pallet"
            style={{
              display: pallet.palletState === "закрыта" ? "initial" : "none",
            }}
            onClick={() => {
              navigate("/new-pallet");
            }}
          >
            Перейти к другой палете
          </button>
          <button
            className="pallet-button pallet-button_delete"
            style={{
              display: pallet.palletState === "закрыта" || sumCartsOnCount(pallet) === 0 ? "none" : "initial" ,
            }}
            onClick={() => {
              setShowDelete(true);
            }}
          >
            Удалить коробку
          </button>
          <button
            className="pallet-button pallet-button_finish"
            onClick={handleClosePallet}
            style={{
              display: pallet.palletState === "собрана" ? "initial" : "none",
            }}
            disabled={pallet.palletState === "собрана" ? false : true}
          >
            Завершить
          </button>
        </div>
      </div>
      {/* попап добавления коробки с infoType */}
      {pallet.info ? (
        <Popup
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          containerClassName="pallet-dialog"
        >
          <p className="pallet-dialog__text">{pallet.info}</p>
          <div className="pallet-dialog-buttons">
            {pallet.infoType === "yesNo" ? (
              <>
                <button
                  className="pallet-dialog-btn knopka-yes"
                  onClick={async () => {
                    setPallet(
                      await addCart(
                        String(pinAuthData?.pinCode),
                        params.sscc || "",
                        String(scannedCode.current),
                        pinAuthData?.tsdUUID || "",
                        pallet.info,
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
                    const response = await addCart(
                      String(pinAuthData?.pinCode),
                      params.sscc || "",
                      String(scannedCode.current),
                      pinAuthData?.tsdUUID || "",
                      pallet.info,
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
              <button className="pallet-dialog-btn">Продолжить</button>
            )}
          </div>
        </Popup>
      ) : null}
      {/* попап закрытия паллеты */}
      {pallet.info ? (
        <Popup
          isOpen={closePalletPopup}
          onClose={() => setClosePalletPopup(false)}
          containerClassName="pallet-dialog"
        >
          <p className="pallet-dialog__text">{pallet.info}</p>
          <div className="pallet-dialog-buttons">
            {pallet.infoType === "yesNo" ? (
              <>
                <button
                  className="pallet-dialog-btn"
                  onClick={async () => {
                    setPallet(
                      await closePallet(
                        String(pinAuthData?.pinCode),
                        pinAuthData?.tsdUUID || "",
                        params.sscc || "",
                        pallet.info,
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
                    const response = await closePallet(
                      String(pinAuthData?.pinCode),
                      pinAuthData?.tsdUUID || "",
                      params.sscc || "",
                      pallet.info,
                      "no"
                    );
                    if (response.error) {
                      setClosePalletPopup(false);
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
                className="pallet-dialog-btn"
                onClick={async () => {
                  const response = await closePallet(
                    String(pinAuthData?.pinCode),
                    pinAuthData?.tsdUUID || "",
                    params.sscc || "",
                    pallet.info,
                    "next"
                  );
                  setPallet(response);
                  if (response.error) {
                    setClosePalletPopup(false);
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
      {/* Модальное окно удаления коробки */}
      <Popup
        title="Удаление коробки"
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
      >
        <DeleteBoxInteractive
          pallet={pallet}
          onClose={() => {setShowDelete(false)}}
          isPopupOpened={showDelete}
          setPallet={setPallet}
          type="pallet"
          deleteBoxInteractiveReset={!showDelete}
        />
      </Popup>
    </div>
  );
};

export default Pallet;
