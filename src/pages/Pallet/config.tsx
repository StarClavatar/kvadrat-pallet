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
  productSerial: string;
  cartCount: number;
  cartsOnCount: number;
  // groupState: "новая" | "в работе" | "собрана" | "закрыта";
  carts: Cart[];
  groupState: "новая" | "в работе" | "собрана" | "закрыта";
};

export type TPallet = {
  error: string;
  palletSSCC: string;
  beginDate: string;
  endDate: string;
  palletState: "новая" | "в работе" | "собрана" | "закрыта";
  groups: TGroup[];
  user: string;
  info?: string;
  infoType?: string
};