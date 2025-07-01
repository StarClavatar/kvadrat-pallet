import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValueContext } from "../../context/valueContext";
import { PinContext } from "../../context/PinAuthContext";
import "../WorkPallet/WorkPallet.css"; // Reuse styles
import { IPallet } from "../Order/types";
import BackspaceIcon from "../../assets/backspaceIcon";

const ViewPallet = () => {
  const { order } = useContext(ValueContext);
  const { pinAuthData } = useContext(PinContext);
  const { palletId } = useParams<{ palletId: string }>();
  const navigate = useNavigate();

  const activePallet: IPallet | undefined = order.pallets.find((p) => {
    try {
      return BigInt(p.palletNum) === BigInt(palletId || "");
    } catch (e) {
      return p.palletNum === palletId;
    }
  });

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

  return (
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
        <footer className="work-work-pallet-footer work-work-pallet-footer--view">
          <button className="work-work-pallet-footer__btn" onClick={() => navigate(-1)}>Выход</button>
        </footer>
      </div>
  );
};

export default ViewPallet; 