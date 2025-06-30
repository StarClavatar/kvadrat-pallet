import { IOrder } from "../pages/Order/types";
const BASE_URL = import.meta.env.VITE_BASE_URL

export const addPallet = async (
    pinCode: string,
    tsdUUID: string,
    docNum: string,
    palletNum: string
): Promise<IOrder> => {
    const response = await fetch(`${BASE_URL}/orderservice/addPallet`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            pinCode,
            tsdUUID,
            docNum,
            palletNum,
        }),
    });
    return response.json();
}; 