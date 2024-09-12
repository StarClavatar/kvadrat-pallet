import { Dispatch, ReactNode, SetStateAction, createContext, useState } from "react";
import { TPallet } from "../pages/Pallet/config";

type TProps = {
    children: ReactNode;
}

type valueContextType = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  pallet: TPallet;
  setPallet: Dispatch<SetStateAction<TPallet>>
  truckInfo: ITruckInfo;
  setTruckInfo: Dispatch<SetStateAction<ITruckInfo>>
};

export const ValueContext = createContext<valueContextType>({
  value: '',
  setValue: () => {},
  pallet: {
    error: "",
    palletSSCC: "",
    beginDate: "",
    endDate: "",
    palletState: "новая",
    groups: [],
    user: ""
  },
  setPallet: () => {},
  truckInfo: {
    error: "",
    info: "",
    infoType: "",
    shipID: "",
    lastPalletSSCC: "",
    beginDate: "",
    endDate: "",
    shipState: "план",
    department: "",
    shipZone: "",
    truckNumber: "",
    responsible: "",
    comment: "",
    pallets: []
  },
  setTruckInfo: () => {}
});

const FieldContext = ({ children }: TProps) => {
  
  //State для хранения информации об авторизации
  const [value, setValue] = useState<string>('');
  const [pallet, setPallet] = useState<TPallet>({
    error: "",
    palletSSCC: "",
    beginDate: "",
    endDate: "",
    palletState: "новая",
    groups: [],
    user: ""
  });
  const [truckInfo, setTruckInfo] = useState<ITruckInfo>({
    error: "",
    info: "",
    infoType: "",
    shipID: "",
    lastPalletSSCC: "",
    beginDate: "",
    endDate: "",
    shipState: "план",
    department: "",
    shipZone: "",
    truckNumber: "",
    responsible: "",
    comment: "",
    pallets: []
  })

  return (
    <ValueContext.Provider value={{ value, setValue, pallet, setPallet, truckInfo, setTruckInfo }}>
      {children}
    </ValueContext.Provider>
  );
};

export default FieldContext;
