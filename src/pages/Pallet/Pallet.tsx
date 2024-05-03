import { pallete } from "./config";
import "./Pallet.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Pallet = () => {
  const [showBoxes, setShowBoxes] = useState(false);
  const navigate = useNavigate();
  const handleToggleBoxes = () => {
    setShowBoxes(!showBoxes);
  };

  //   const handleRemoveBox = () => {
  // Логика удаления коробки
  //   };

  return (
    <div className="pallet">
      <h2 className="pallet__user">{pallete.user}</h2>
      <div className="pallet-info">
        <h2 className="pallet-info__product-name">{pallete.productName}</h2>
        <p className="pallet-info__text">
          Серия: <span className="value">{pallete.productSeries}</span>
        </p>
        <p className="pallet-info__text">
          Ожидаемое количество коробов:{" "}
          <span className="value">{pallete.expectedBoxes}</span>
        </p>
        <p className="pallet-info__text">
          Текущее количество коробов:{" "}
          <span className="value">{pallete.currentBoxes}</span>
        </p>
        <p className="pallet-info__text">
          Дата создания паллеты:{" "}
          <span className="value">{pallete.creationDate}</span>
        </p>
        <p className="pallet-info__text">
          Дата завершения формирования:{" "}
          <span className="value">{pallete.completionDate || "-"}</span>
        </p>
        <p className="pallet-info__text">
          Дата завершения:{" "}
          <span className="value"> {pallete.finalDate || "-"}</span>
        </p>
        <p className="pallet-info__text">Статус: {pallete.status}</p>
        <button className="pallet__toggle-boxes" onClick={handleToggleBoxes}>
          {showBoxes ? "Скрыть коробки" : "Показать коробки"}
        </button>
        {showBoxes && (
          <table className="pallet-table">
            <thead>
              <tr className="pallet-table__row">
                <th className="pallet-table__heading">Код коробки</th>
                <th className="pallet-table__heading">Дата и время</th>
                <th className="pallet-table__heading">ФИО грузчика</th>
              </tr>
            </thead>
            <tbody>
              {pallete.boxes.map((box, index) => (
                <tr className="pallet-table__row" key={index}>
                  <td className="pallet-table__data">{box.code}</td>
                  <td className="pallet-table__data">{box.date}</td>
                  <td className="pallet-table__data">{box.handler}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* {pallete.status === 'сформирована' && (
          <button className="pallet__remove-box" onClick={handleRemoveBox}>
            Удалить коробку
          </button>
        )} */}
      </div>
      <button className="back-button" onClick={() => navigate("/new-pallet")}>
        Назад
      </button>
    </div>
  );
};

export default Pallet;
