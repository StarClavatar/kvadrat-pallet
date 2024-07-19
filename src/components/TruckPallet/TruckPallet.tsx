import { useState } from "react";
import "./Group.css";
import { TGroup } from "../../pages/Pallet/config";
import Popup from "../Popup/Popup";

function TruckPallet({
  groups,
  palletSSCC,
  shipDate,
  beginDate,
  endDate,
  palletState,
}: ITruckPallet) {
  const [showGroupBoxes, setShowGroupBoxes] = useState<boolean>(false);
  return (
    <>
      <div
        className="group"
        style={{
          backgroundColor:
            palletState === ""
              ? "rgba(145, 255, 145, .5)"
              : "rgba(186, 186, 186, 0.7)",
        }}
      >
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
              <th className="pallet-table__heading">Паллета</th>
              <th className="pallet-table__heading">Дата</th>
              <th className="pallet-table__heading">Грузчик</th>
            </tr>
          </thead>
          <tbody>
            {.map((box, index) => (
              <tr className="pallet-table__row" key={index}>
                <td className="pallet-table__data pallet-table__sscc">
                  {box.cartSSCC}
                </td>
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

export default TruckPallet;
