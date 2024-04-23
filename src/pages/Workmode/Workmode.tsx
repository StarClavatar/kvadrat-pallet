import "./Workmode.css";
import { Link } from "react-router-dom";

const Workmode = () => {
  return (
    <div className="workmode">
        <p className="workmode__employee">Грузчиков Ермолай Семёныч</p>
      <div className="workmode__links">
        <Link to={"/new-palette"} className="link">Создание паллет </Link>
        <Link to={"/truck-filling"} className="link">Загрузка фуры</Link>
      </div>
      <Link to={"/"} className="link_quit">Выйти</Link>
    </div>
  );
};

export default Workmode;
