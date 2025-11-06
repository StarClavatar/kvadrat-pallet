const BASE_URL = import.meta.env.VITE_BASE_URL;

export const addPack = async (
  pinCode: string,
  tsdUUID: string,
  SSCC: string,
  scanCod: string
) => {
  const response = await fetch(`${BASE_URL}/cartservice/addPack`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      tsdUUID,
      SSCC,
      scanCod,
    }),
  });
  return response.json();
};
