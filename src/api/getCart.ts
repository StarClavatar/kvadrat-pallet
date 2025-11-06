const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getCart = async (
  pincode: string,
  tsdUUID: string,
  scanCod: string
) => {
  const response = await fetch(`${BASE_URL}/cartservice/getCart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode: pincode,
      tsdUUID: tsdUUID ? tsdUUID : "",
      scanCod: scanCod,
    }),
  });
  return response.json();
};
