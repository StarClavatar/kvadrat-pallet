import { IOrder } from "../pages/Order/types";

const BASE_URL = import.meta.env.VITE_BASE_URL

export const addScan = async (
    pinCode: string,
    tsdUUID: string,
    docNum: string,
    palletNum: string,
    scanCod: string,
    docUUID: string
): Promise<IOrder> => {
    const response = await fetch(`${BASE_URL}/orderservice/addScan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            pinCode,
            tsdUUID,
            docNum,
            palletNum,
            scanCod,
            docUUID,
        }),
    });
    return response.json();
}; 