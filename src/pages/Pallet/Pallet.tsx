import { pallete } from "./config";
import "./Pallet.css";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import { BarCodeIcon } from "../../assets/barCodeIcon";
import DeleteBoxInteractive from "../../components/DeleteBoxInteractive/DeleteBoxInteractive";

const Pallet = () => {
  const [showBoxes, setShowBoxes] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleToggleBoxes = () => {
    setShowBoxes(!showBoxes);
  };
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [deleteBoxValue, setDeleteBoxValue] = useState<string>()

  const params = useParams();

  return (
    <div className="pallet">
      <div className="pallet-info">
        <p className="pallet__user">{pallete.user}</p>
        <div className="pallet-block pallet-block_about">
          <p className="pallet-text pallet-block__heading">
            Формирование палеты
          </p>
          <span className="pallet-block__text pallet-block__text_sscc">
            {"(SSCC: " + params.id + ")"}
          </span>
        </div>
        <div className="pallet-block pallet-block_series">
          <h2 className="pallet-info__product-name">{pallete.productName}</h2>
          <span className="value value_series">
            {"Серия: " + pallete.productSeries}
          </span>
        </div>
        <div
          className="pallet-block pallet-block_status"
          style={{
            backgroundColor:
              pallete.status === "Сформирована" ? "lightgreen" : "khaki",
          }}
        >
          <p className="pallet-text_status">
            Статус:{" "}
            <span
              style={{
                color: pallete.status === "Сформирована" ? "green" : "#808000	",
              }}
            >
              {pallete.status}
            </span>
          </p>
          <div className="pallet-block__row">
            <div className="pallet-block-row-box">
              <p className="pallet-text">
                начало: <br />{" "}
                <span className="value">{pallete.creationDate}</span>
              </p>
            </div>
            <div className="pallet-block-row-box">
              <p className="pallet-text">
                завершение: <br />{" "}
                <span className="value"> {pallete.finalDate || "-"}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="boxes-wrapper">
          <h4 className="boxes-wrapper__heading">Коробок на паллете:</h4>
          <div className="pallet-block__row">
            <span className="value-boxes value-boxes_start">
              {pallete.boxes.length}
            </span>
            <span className="value-boxes value-boxes_end">
              {"из " + pallete.expectedBoxes}
            </span>
          </div>
        </div>
        <div className="button-container">
          <button className="pallet__toggle-boxes" onClick={handleToggleBoxes}>
            {showBoxes ? "Скрыть коробки" : "Показать коробки"}
          </button>
        </div>
        <div className="pallet-buttons">
          <button
            className="pallet-button pallet-button_delete"
            onClick={() => setShowDelete(true)}
          >
            Удалить коробку
          </button>
          <button className="pallet-button pallet-button_finish">
            Завершить
          </button>
        </div>
      </div>
      <button className="back-button" onClick={() => navigate("/new-pallet")}>
        Назад
      </button>

      {/* Модальное окно с данными о коробках */}
      <Popup
        title="Просмотр коробок"
        isOpen={showBoxes}
        onClose={() => setShowBoxes(false)}
      >
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
      </Popup>

      {/* Модальное окно удаления коробки */}
      <Popup
        title="Удаление коробки"
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
      >
        <DeleteBoxInteractive onClose={()=> setShowDelete(false)} />
      </Popup>
    </div>
  );
};

export default Pallet;
