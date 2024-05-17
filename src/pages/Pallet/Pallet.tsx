import { pallet, TGroup } from "./config";
import "./Pallet.css";
import { ReactNode, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import DeleteBoxInteractive from "../../components/DeleteBoxInteractive/DeleteBoxInteractive";
import Group from "../../components/Group/Group";
// import useScanDetection from "use-scan-detection";

const Pallet = () => {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const params = useParams();

  // useScanDetection({
  //   onComplete: (code) => {
  //     const box: Cart = {
  //       cartSSCC: String(code)
        
  //     };
  //     pallet.groups.push(box);
  //   },
  // });

// function checkPalletesFilling() {

// }

  return (
    <div className="pallet">
      <div className="pallet-info">
        <div className="pallet-user">
          <button className="" onClick={() => navigate("/new-pallet")}>
            Назад
          </button>
          <p className="pallet__user">{pallet.user}</p>
        </div>
        <div className="pallet-block pallet-block-about">
          <span className="pallet-text pallet-block-about">Паллета №</span>
          <p className="pallet-text pallet-block__text_sscc">{params.sscc}</p>
        </div>
        <div
          className="pallet-block pallet-block-status"
          style={{
            backgroundColor:
              pallet.palleteState === "Собрана" ? "lightgreen" : "khaki",
          }}
        >
          <span
            className="pallet-block-status__status"
            style={{
              color: pallet.palleteState === "Собрана" ? "green" : "#808000",
            }}
          >
            {pallet.palleteState}
          </span>
          <p className="pallet-block-status__text">
            {`${pallet.beginDate} ${
              pallet.endDate ? `${"- " + pallet.endDate}` : ""
            }`}
          </p>
        </div>
        <div className="pallet-block pallet-block-boxes">
          {pallet.groups.map((group: TGroup, idx): ReactNode => {
            return <Group {...group} key={idx}/>;
          })}
        </div>
        <div className="pallet-buttons">
          <button
            className="pallet-button pallet-button_delete"
            onClick={() => {
              setShowDelete(true);
            }}
          >
            Удалить коробку
          </button>
          <button className="pallet-button pallet-button_finish">
            Завершить
          </button>
          {/* <button className="pallet-button pallet-button_quit">Выход</button> */}
        </div>
      </div>
      {/* Модальное окно удаления коробки */}
      <Popup
        title="Удаление коробки"
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
      >
        <DeleteBoxInteractive
          onClose={() => setShowDelete(false)}
          isPopupOpened={showDelete}
        />
      </Popup>
    </div>
  );
};

export default Pallet;
