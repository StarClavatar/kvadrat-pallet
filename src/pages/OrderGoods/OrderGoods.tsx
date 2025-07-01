import { useContext } from "react";
import { ValueContext } from "../../context/valueContext";
import "../Order/Order.css"; // Reuse styles
import { useNavigate } from "react-router-dom";
import { PinContext } from "../../context/PinAuthContext";
import BackspaceIcon from "../../assets/backspaceIcon";

const OrderGoods = () => {
  const { order } = useContext(ValueContext);
  const { pinAuthData } = useContext(PinContext);
  const navigate = useNavigate();

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
    <div className="order">
      <div className="order-info">
        <div className="order-user">
          <button className="exit-button" onClick={() => navigate("/order")}>
            <BackspaceIcon color="#ffffff" />
          </button>
          <p className="pallet__user">{`${pinAuthData?.position} ${pinAuthData?.workerName}`}</p>
        </div>

        <header className="order-block order-block-about">
          <span className="order-text">Товары в заказе № {order.docNum}</span>
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
              {order.goods?.map((good, index) => (
                <div key={index} className="group">
                  <div className="group__name-container">
                    <p className="group__name" style={{whiteSpace: 'normal'}}>{good.productName}</p>
                  </div>
                  <p className="group__count">Серия: {good.produсtSerial}</p>
                  <p className="group__count">
                    Собрано:{" "}
                    <strong style={{ color: "#275dff" }}>
                      {good.cartsOnCount} кор. ({good.itemsOnCount} шт.)
                    </strong>
                  </p>
                   <p className="group__count">
                    Нужно:{" "}
                    <strong style={{ color: "#000" }}>
                      {good.approxCart}
                    </strong>
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
          style={{gridColumn: '1 / -1'}}
          onClick={() => navigate('/order')}
        >
          Назад к паллетам
        </button>
      </footer>
    </div>
  );
};

export default OrderGoods; 