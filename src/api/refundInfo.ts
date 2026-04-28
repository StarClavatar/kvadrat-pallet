const BASE_URL = import.meta.env.VITE_BASE_URL;

export const postRefundInfo = async (
  pinCode: string,
  tsdUUID: string,
  code: string
) => {
  const response = await fetch(`${BASE_URL}/refundsgoods/refundInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode: pinCode,
      tsdUUID: tsdUUID ? tsdUUID : "",
      code: code,
    }),
  });
  return response.json();
};
