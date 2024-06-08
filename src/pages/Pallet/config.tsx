export type Cart = {
  time: string;
  cartSSCC: string;
  productName: string;
  productSerial: string;
  workerName: string;
  pinCode: number;
  tsdUUID: string;
};

export type TGroup = {
  productName: string;
  produсtSerial: string;
  cartCount: number;
  cartsOnCount: number;
  groupState: "Новая" | "В работе" | "Собрана" | "Завершена";
  carts: Cart[];
};

export type TPallet = {
  error: string;
  palleteSSCC: string;
  beginDate: string;
  endDate: string;
  palleteState: "Новая" | "В работе" | "Собрана" | "Завершена";
  groups: TGroup[];
  user: string;
  info?: string;
  infoType?: string
};