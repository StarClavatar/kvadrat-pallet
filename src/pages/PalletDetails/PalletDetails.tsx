import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ValueContext } from "../../context/valueContext";
import { PinContext } from "../../context/PinAuthContext";
import "./PalletDetails.css";
import { IPalletDetail } from "../Order/types";
import BackspaceIcon from "../../assets/backspaceIcon";

const PalletDetails = () => {
    const { order } = useContext(ValueContext);
    const { pinAuthData } = useContext(PinContext);
    const { palletId } = useParams<{ palletId: string }>();
    const navigate = useNavigate();

    const pallet = order.pallets.find(p => p.palletNum === palletId);

    const getStatusStyles = (isClosed: boolean) => {
        return isClosed 
            ? { backgroundColor: "lightgrey", color: "#696969" }
            : { backgroundColor: "#B2D8B2", color: "#006400" };
    };
    
    const getPalletStatusText = (isClosed: boolean) => {
        return isClosed ? "Закрыта" : "В работе";
    };

    if (!pallet) {
        return <div className="pallet-details">Паллета не найдена</div>;
    }

    const statusText = getPalletStatusText(pallet.isClosed);
    const statusStyle = getStatusStyles(pallet.isClosed);

    return (
        <div className="pallet">
            <div className="pallet-info">
                <div className="pallet-user">
                    <button className="exit-button" onClick={() => navigate("/order")}>
                        {<BackspaceIcon/>}
                    </button>
                    <p className="pallet__user">{`ст. грузчик ${pinAuthData?.workerName}`}</p>
                </div>

                <header className="pallet-block pallet-block-about" onClick={() => navigate("/order-goods")}>
                     <span className="pallet-text">Заказ № {order.docNum}</span>
                </header>
                 <div className="pallet-block pallet-block-status" style={statusStyle}>
                    <p className="pallet-block-status__text">
                        в работе начат {order.beginDate}
                    </p>
                </div>
                
                <div className="pallet-identity">
                    <div className="pallet-identity__number">{pallet.palletNum}</div>
                    <div className="pallet-identity__info">
                        <p className="pallet-identity__type">{pallet.productName}</p>
                        <p className="pallet-identity__status">{statusText}</p>
                    </div>
                    <div className="pallet-identity__count">
                        собрано <span>{pallet.cartsOnPallet} кор.</span>
                    </div>
                </div>

                <main className="pallet-details-main">
                    <div className="pallet-details-list">
                        {pallet.details?.map((item: IPalletDetail, index: number) => (
                            <div key={index} className="details-item">
                                <div className="details-item__info">
                                    <p className="details-item__name">{item.productName}</p>
                                    <p className="details-item__serial">(серия: {item.produсtSerial})</p>
                                </div>
                                <div className="details-item__counts">
                                    <p>{item.itemsOnCount} шт.</p>
                                    <p>{item.cartsOnCount} кор.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <footer className="pallet-buttons_details">
                <button className="pallet-button" onClick={() => { /* TODO: Close pallet logic */ }}>Завершить</button>
                <button className="pallet-button pallet-button_exit" onClick={() => navigate('/order')}>Выход</button>
            </footer>
        </div>
    );
};

export default PalletDetails; 