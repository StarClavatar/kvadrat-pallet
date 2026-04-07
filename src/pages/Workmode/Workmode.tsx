import "./Workmode.css";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { PinContext } from "../../context/PinAuthContext";

const Workmode = () => {
  const { pinAuthData, setPinAuthData } = useContext(PinContext);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="workmode">
        <p className="workmode__employee">{pinAuthData?.workerName}</p>
        <p className="workmode__employee">{pinAuthData?.tsdNumber}</p>
      
      <div className="workmode__links">
        {pinAuthData?.operations.makePallets && <Link to={"/new-pallet"} className="link">Создание паллет </Link>}
        {pinAuthData?.operations.workOrder && <Link to={"/scan-order"} className="link">Работа с заказом</Link>}
        {pinAuthData?.operations.shipment && <Link to={"/new-truck-filling"} className="link">Загрузка фуры</Link>}
        {pinAuthData?.operations.inventory && <Link to={"/scan-cell"} className="link">Инвентаризация ячеек</Link>}
        <Link to={"/disaggregation"} className="link">Разагрегация</Link>
        <Link className="link" to={"/create-box"}>Агрегация коробов</Link>
        <Link className="link" to={"/scan-doc-kit"}>Агрегация набора</Link>
        <Link className="link" to={"/mass-marking-scan"}>Массовый скан маркировки</Link>
      </div>

      <div className="workmode__footer">
        {isInstallable && (
          <button onClick={handleInstallClick} className="link_install">
            📱 Установить приложение
          </button>
        )}
        <Link to={"/"} className="link_quit" onClick={() => setPinAuthData(undefined)}>Выйти</Link>
      </div>
    </div>
  );
};

export default Workmode;