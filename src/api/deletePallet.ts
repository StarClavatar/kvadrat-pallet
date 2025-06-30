import { IOrder } from "../pages/Order/types";

export interface IDeletePalletResponse extends IOrder {
  error: string;
  info: string;
  infoType: string;
}

export const deletePallet = async (
  pinCode: string,
  tsdUUID: string,
  docNum: string,
  palletNum: string // This will be the scanned code
): Promise<IDeletePalletResponse> => {
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/orderservice/deletePallet`, {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ошибка сети или сервера" }));
    return Promise.reject(error?.error || "Неизвестная ошибка при удалении паллеты");
  }

  return response.json();
}; 