export interface IGood {
    productName: string;
    produсtSerial: string;
    amount: number;
    enclosedInCart: number;
    approxCart: string;
    itemsOnCount: number;
    itemsOnFree: number;
    cartsOnCount: number;
    palletOnCount: number;
}

export interface IPalletDetail {
    productName: string;
    produсtSerial: string;
    itemsOnCount: number;
    cartsOnCount: number;
    itemsOnFree: number;
}

export interface IPallet {
    palletNum: string;
    isClosed: boolean;
    cartsOnPallet: number;
    itemsOnPallet: number;
    productName: string;
    produсtSerial: string;
    isMono: boolean;
    details: IPalletDetail[];
    itemsOnFree: number;
}

export interface IOrder {
    error: string;
    info: string;
    infoType: string;
    docNum: string;
    beginDate: string;
    endDate: string;
    docState: string;
    customer: string;
    shippingDate: string;
    enclosedInCart: number;
    activePallet: string;
    goods: IGood[];
    pallets: IPallet[];
} 