import { Dispatch, ReactNode, SetStateAction, createContext, useState } from "react";

type TProps = {
    children: ReactNode;
}

type valueContextType = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
};

export const ValueContext = createContext<valueContextType>({
  value: '',
  setValue: () => {},
});

const FieldContext = ({ children }: TProps) => {
  
  //State для хранения информации об авторизации
  const [value, setValue] = useState<string>('');

  return (
    <ValueContext.Provider value={{ value, setValue }}>
      {children}
    </ValueContext.Provider>
  );
};

export default FieldContext;
