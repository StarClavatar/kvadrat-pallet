import "./Workmode.css";
import { Link } from "react-router-dom";
import {useContext, useState} from "react";
import { PinContext } from "../../context/PinAuthContext";
import Popup from "../../components/Popup/Popup";

const Workmode = () => {
  const {pinAuthData, setPinAuthData} = useContext(PinContext)
  const [showAggregationPopup, setShowAggregationPopup] = useState(false);

  return (
    <div className="workmode">
        <p className="workmode__employee">{pinAuthData?.workerName}</p>
      <div className="workmode__links">
        {pinAuthData?.operations.makePallets && <Link to={"/new-pallet"} className="link">Создание паллет </Link>}
        {/* <Link to={"/scan-order"} className="link">Работа с заказом</Link> */}
        {pinAuthData?.operations.workOrder && <Link to={"/scan-order"} className="link">Работа с заказом</Link>}
        {pinAuthData?.operations.shipment && <Link to={"/new-truck-filling"} className="link">Загрузка фуры</Link>}
        {pinAuthData?.operations.inventory && <Link to={"/scan-cell"} className="link">Инвентаризация ячеек</Link>}
        <Link to={"/disaggregation"} className="link">Разагрегация</Link>
        <button className="link" onClick={() => setShowAggregationPopup(true)}>Агрегация коробов</button>
        {/* {process.env.NODE_ENV === "development" && <Link autoFocus to={"/test-mode"} className="link">Тест</Link>} */}
      </div>
      <Link to={"/"} className="link_quit" onClick={() => setPinAuthData(undefined)}>Выйти</Link>

      <Popup
        isOpen={showAggregationPopup}
        onClose={() => setShowAggregationPopup(false)}
        containerClassName="workmode-popup"
      >
        <div className="workmode-popup__links">
            <Link to={"/create-box"} className="link">Создать новый короб</Link>
            <Link to={"/scan-box"} className="link">Выбрать незавершенный</Link>
        </div>
      </Popup>
    </div>
  );
};

export default Workmode;
