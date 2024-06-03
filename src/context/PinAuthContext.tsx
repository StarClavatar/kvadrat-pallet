import { Dispatch, ReactNode, SetStateAction, createContext, useState } from "react";

type TProps = {
    children: ReactNode;
}

export type TPinAuthData = {
    error: string;
    tsdUUID: string;
    tsdNumber: number;
    pinCode: number;
    workerName: string;
    position: string;
};

type PinContextType = {
  pinAuthData: TPinAuthData | undefined;
  setPinAuthData: Dispatch<SetStateAction<TPinAuthData | undefined>>;
};

export const PinContext = createContext<PinContextType>({
  pinAuthData: undefined,
  setPinAuthData: () => {},
});

const PinAuthContext = ({ children }: TProps) => {
  const [pinAuthData, setPinAuthData] = useState<TPinAuthData | undefined>();
  return (
    <PinContext.Provider value={{ pinAuthData, setPinAuthData }}>
      {children}
    </PinContext.Provider>
  );
};

export default PinAuthContext;
