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
        <Link to={"/new-pallet"} className="link">Создание паллет </Link>
        <Link to={"/new-truck-filling"} className="link">Загрузка фуры</Link>
        <Link to={"/playground"} className="link">Тест</Link>
      </div>
      <Link to={"/"} className="link_quit" onClick={() => setPinAuthData(undefined)}>Выйти</Link>
    </div>
  );
};

export default Workmode;
