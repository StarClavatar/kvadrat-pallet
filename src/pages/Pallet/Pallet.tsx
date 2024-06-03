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

const Pallet = () => {
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [pallet, setPallet] = useState<TPallet>();
  const params = useParams();
  const palletContainerRef = useRef();
  const [palletDataError, setPalletDataError] = useState<boolean>(false);
  const [palletErrorText, setPalletErrorText] = useState<string>('')

  useScanDetection({
    onComplete: (code) => {
      const scannedCode = code.replace(/[^0-9]/g, "").toString();
      const fetchAddCart = async () => {
        // console.log(
        //   String(pinAuthData?.pinCode),
        //   String(params.sscc),
        //   scannedCode,
        //   String(localStorage.getItem("tsdUUID"))
        // );
        await addCart(
          String(pinAuthData?.pinCode),
          String(params.sscc),
          scannedCode,
          String(localStorage.getItem("tsdUUID"))
        )
          .then((res) => {
            console.log("res:", res);
            if (!res.error) {
              setPallet(res);
            } else {
              setPalletDataError(true)
              setPalletErrorText(res.error)
            }
          })
          .catch((err) => alert(err));
      };
      fetchAddCart();
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
      }
    };

    fetchData();
  }, []);

  if (!pinAuthData?.tsdUUID) {
    navigate("/");
  }

  if (!pallet) {
    return (
      <div className="loading">
        <h2>Загрузка...</h2>
      </div>
    );
  }

  if (palletDataError) {
    <Popup
        isOpen={palletDataError}
        onClose={() => {
          setPalletDataError(false);
        }}
      >
        <h2>{palletErrorText}</h2>
    </Popup>
  }

  return (
    <div className="pallet">
      <div className="pallet-info">
        <div className="pallet-user">
          <button className="" onClick={() => navigate("/new-pallet")}>
            Назад
          </button>
          <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
        </div>
        <div className="pallet-block pallet-block-about">
          <span className="pallet-text pallet-block-about">Паллета №</span>
          <p className="pallet-text pallet-block__text_sscc">{params.sscc}</p>
        </div>
        <div
          className="pallet-block pallet-block-status"
          style={{
            backgroundColor:
              pallet.palleteState === "Собрана" ? "lightgreen" : "khaki",
          }}
        >
          <span
            className="pallet-block-status__status"
            style={{
              color: pallet.palleteState === "Собрана" ? "green" : "#808000",
            }}
          >
            {pallet.palleteState}
          </span>
          <p className="pallet-block-status__text">
            {`${pallet.beginDate} ${
              pallet.endDate ? `${"- " + pallet.endDate}` : ""
            }`}
          </p>
        </div>
        <div className="pallet-block pallet-block-boxes">
          {pallet.groups.map((group: TGroup, idx): ReactNode => {
            console.log(group);
            return <Group {...group} key={idx} />;
          })}
        </div>
        <div className="pallet-buttons">
          <button
            className="pallet-button pallet-button_delete"
            onClick={() => {
              setShowDelete(true);
            }}
          >
            Удалить коробку
          </button>
          <button className="pallet-button pallet-button_finish">
            Завершить
          </button>
        </div>
      </div>
      {/* Модальное окно удаления коробки */}
      <Popup
        title="Удаление коробки"
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
      >
        <DeleteBoxInteractive
          onClose={() => setShowDelete(false)}
          isPopupOpened={showDelete}
        />
      </Popup>
    </div>
  );
};

export default Pallet;
