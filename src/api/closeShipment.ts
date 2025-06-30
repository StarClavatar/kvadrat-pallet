import { IOrder } from "../pages/Order/types";

export interface ICloseShipmentResponse extends IOrder {
    error: string;
    info: string;
    infoType: "yesNo" | "next" | "";
}

export const closeShipment = async (
  pinCode: string,
  tsdUUID: string,
  docNum: string,
  infoType: "yes" | "no" | "" = ""
): Promise<ICloseShipmentResponse> => {
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/orderservice/closeShipment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      tsdUUID,
      docNum,
      infoType,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ошибка сети или сервера" }));
    return Promise.reject(error?.error || "Неизвестная ошибка при закрытии документа");
  }

  return response.json();
};
