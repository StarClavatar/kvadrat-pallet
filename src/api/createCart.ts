const BASE_URL = import.meta.env.VITE_BASE_URL;

export const createCart = async (
  pinCode: string,
  tsdUUID: string,
  scanCod: string,
  orderNum: string,
  packCount?: number,
  docUUID?: string,
  orderDate?: string, // Add orderDate parameter
) => {
  const body: {
    pinCode: string;
    tsdUUID: string;
    scanCod: string;
    packCount?: number;
    docUUID?: string;
    orderNum: string;
    orderDate?: string; // Add orderDate to body interface
  } = {
    pinCode,
    tsdUUID,
    scanCod,
    orderNum,
  };

  if (packCount) {
    body.packCount = packCount;
  }

  if (docUUID) {
    body.docUUID = docUUID;
  }

  if (orderDate) {
    body.orderDate = orderDate;
  }

  const response = await fetch(`${BASE_URL}/cartservice/createCart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  try {
    const data = await response.clone().json();
    return data;
  } catch (error) {
    const text = await response.text();
    if (text) {
      return { error: text };
    }
    return { error: "Не удалось обработать ответ сервера" };
  }
};
