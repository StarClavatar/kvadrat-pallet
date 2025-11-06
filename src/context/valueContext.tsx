import { Dispatch, ReactNode, SetStateAction, createContext, useState } from "react";
import { TPallet } from "../pages/Pallet/config";
import { IOrder } from "../pages/Order/types";

type TProps = {
    children: ReactNode;
}

// Интерфейс для данных BoxAdmin
interface IBoxAdminData {
  cellCode: string;
}

export interface ICartData {
  error: string;
  info: string;
  infoType: string;
  docNum: string;
  docDate: string;
  docState: string;
  SSCC: string;
  prodName: string;
  GTIN: string;
  serial: string;
  packCount: number;
  collectedCount: number;
}

type valueContextType = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  pallet: TPallet;
  setPallet: Dispatch<SetStateAction<TPallet>>
  truckInfo: ITruckInfo;
  setTruckInfo: Dispatch<SetStateAction<ITruckInfo>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  boxAdminData: IBoxAdminData | null;
  setBoxAdminData: Dispatch<SetStateAction<IBoxAdminData | null>>;
  order: IOrder;
  setOrder: Dispatch<SetStateAction<IOrder>>;
  cartData: ICartData | null;
  setCartData: Dispatch<SetStateAction<ICartData | null>>;
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
  setTruckInfo: () => {},
  isLoading: false,
  setIsLoading: () => {},
  boxAdminData: null,
  setBoxAdminData: () => {},
  order: {
    error: "",
    info: "",
    infoType: "",
    docNum: "",
    beginDate: "",
    endDate: "",
    docState: "",
    customer: "",
    shippingDate: "",
    activePallet: "",
    goods: [],
    pallets: [],
    enclosedInCart: 0
  },
  setOrder: () => {},
  cartData: null,
  setCartData: () => {},
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

  const [isLoading, setIsLoading] = useState(false);
  const [boxAdminData, setBoxAdminData] = useState<IBoxAdminData | null>(null);
  const [order, setOrder] = useState<IOrder>({
    error: "",
    info: "",
    infoType: "",
    docNum: "",
    beginDate: "",
    endDate: "",
    docState: "",
    customer: "",
    shippingDate: "",
    activePallet: "",
    goods: [],
    pallets: [],
    enclosedInCart: 0
  });
  const [cartData, setCartData] = useState<ICartData | null>(null);

  return (
    <ValueContext.Provider value={{ 
      value, 
      setValue, 
      pallet, 
      setPallet, 
      truckInfo, 
      setTruckInfo, 
      isLoading, 
      setIsLoading,
      boxAdminData,
      setBoxAdminData,
      order,
      setOrder,
      cartData,
      setCartData
    }}>
      {children}
    </ValueContext.Provider>
  );
};

export default FieldContext;
