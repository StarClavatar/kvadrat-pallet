import { IOrder } from "../pages/Order/types";

export interface IDeleteScanResponse extends IOrder {
  error: string;
  info: string;
  infoType: string;
}

export const deleteScan = async (
  pinCode: string,
  tsdUUID: string,
  docNum: string,
  palletNum: string,
  scanCod: string
): Promise<IDeleteScanResponse> => {
  const response = await fetch(`${import.meta.env.VITE_BASE_URL}/orderservice/deleteScan`, {
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
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Ошибка сети или сервера" }));
    return Promise.reject(error?.error || "Неизвестная ошибка при удалении скана");
  }

  return response.json();
}; 