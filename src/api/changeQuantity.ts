const BASE_URL = import.meta.env.VITE_BASE_URL;

export const changeQuantity = async (
  pinCode: string,
  tsdUUID: string,
  SSCC: string,
  packCount: number
) => {
  const response = await fetch(`${BASE_URL}/cartservice/changeQuantity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      tsdUUID,
      SSCC,
      packCount,
    }),
  });
  return response.json();
};
