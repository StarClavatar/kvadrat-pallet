import { IOrder } from "../pages/Order/types";
const BASE_URL = import.meta.env.VITE_BASE_URL;

export type CreatePalletResponse = Omit<IOrder, "info" | "infoType"> & {
  info?: string;
  infoType?: "next" | "yesNo" | "";
};

export const createPallet = async (
  pinCode: string,
  tsdUUID: string,
  docNum: string,
): Promise<CreatePalletResponse> => {
  const response = await fetch(`${BASE_URL}/orderservice/createPallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      tsdUUID,
      docNum,
    }),
  });
  return response.json();
}; 