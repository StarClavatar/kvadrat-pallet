const BASE_URL = import.meta.env.VITE_BASE_URL;

export const createCart = async (
  pinCode: string,
  tsdUUID: string,
  scanCod: string,
  packCount?: number,
  docUUID?: string
) => {
  const body: {
    pinCode: string;
    tsdUUID: string;
    scanCod: string;
    packCount?: number;
    docUUID?: string;
  } = {
    pinCode,
    tsdUUID,
    scanCod,
  };

  if (packCount) {
    body.packCount = packCount;
  }

  if (docUUID) {
    body.docUUID = docUUID;
  }

  const response = await fetch(`${BASE_URL}/cartservice/createCart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response.json();
};
