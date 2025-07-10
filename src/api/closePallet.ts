import { IOrder } from "../pages/Order/types";

export interface IClosePalletResponse extends IOrder {
  error: string;
  info: string;
  infoType: "yesNo" | "next" | "";
}

export const closePallet = async (
  pinCode: string,
    tsdUUID: string,
  docNum: string,
  palletNum: string,
  infoType: "yes" | "no" | "" = ""
): Promise<IClosePalletResponse> => {
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/orderservice/closePallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
      pinCode,
      tsdUUID,
      docNum,
      palletNum,
      infoType,
        }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ошибка сети или сервера" }));
    return Promise.reject(error?.error || "Неизвестная ошибка при закрытии паллеты");
  }

    return response.json();
  };
  