const BASE_URL = import.meta.env.VITE_BASE_URL;

export const finishCart = async (
  pinCode: string,
  tsdUUID: string,
  SSCC: string
) => {
  const response = await fetch(`${BASE_URL}/cartservice/finishCart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode,
      tsdUUID,
      SSCC,
    }),
  });
  return response.json();
};
