import "./Workmode.css";
import { Link } from "react-router-dom";
import {useContext} from "react";
import { PinContext } from "../../context/PinAuthContext";

const Workmode = () => {
  const {pinAuthData, setPinAuthData} = useContext(PinContext)

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
        <Link className="link" to={"/create-box"}>Агрегация коробов</Link>
        <Link className="link" to={"/scan-doc-kit"}>Агрегация набора</Link>
        {/* {process.env.NODE_ENV === "development" && <Link autoFocus to={"/test-mode"} className="link">Тест</Link>} */}
      </div>
      <Link to={"/"} className="link_quit" onClick={() => setPinAuthData(undefined)}>Выйти</Link>
    </div>
  );
};

export default Workmode;
