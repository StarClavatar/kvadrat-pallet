import { useState } from "react";
import "./Group.css";
import { TGroup } from "../../pages/Pallet/config";
import Popup from "../Popup/Popup";

function Group({
  productName,
  productSerial,
  cartCount,
  cartsOnCount,
  groupState,
  carts,
}: TGroup) {
  const [showGroupBoxes, setShowGroupBoxes] = useState<boolean>(false);
  return (
    <>
      <div
        className="group"
        style={{
          backgroundColor:
            groupState === "собрана" ?
               "rgba(145, 255, 145, .5)"
              : "rgba(186, 186, 186, 0.7)",
        }}
      >
        <p className="group__prod-name">{productName}</p>
        <span className="group__series">{`(серия: ${productSerial})`}</span>
        <div className="group-boxes">
          <p
            className="group-boxes__from"
            onClick={() => setShowGroupBoxes(true)}
          >
            {cartsOnCount}
          </p>
          <span>из</span>
          <p className="group-boxes__total">{cartCount}</p>
        </div>
      </div>
      <Popup
        containerClassName="popup_group"
        title="Просмотр коробок"
        isOpen={showGroupBoxes}
        onClose={() => setShowGroupBoxes(false)}
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
            {carts.map((box, index) => (
              <tr className="pallet-table__row" key={index}>
                <td className="pallet-table__data pallet-table__sscc">{box.cartSSCC}</td>
                <td className="pallet-table__data">{box.time}</td>
                <td className="pallet-table__data">{box.workerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Popup>
    </>
  );
}

export default Group;
