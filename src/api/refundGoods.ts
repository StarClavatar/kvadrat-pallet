const BASE_URL = import.meta.env.VITE_BASE_URL;

export const postRefundGoods = async (
  pinCode: string,
  tsdUUID: string,
  returnDate: string,
  returnDescription: string,
  returnNumber: string,
  boxes: Record<string, string[]>,
  guidDoc?: string | null,
) => {
  const response = await fetch(`${BASE_URL}/refundsgoods/refundsgoods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinCode: pinCode,
      tsdUUID: tsdUUID || "",
      guidDoc: guidDoc || null,
      returnDate: returnDate,
      returnDescription: returnDescription,
      returnNumber: returnNumber,
      boxes: boxes,
    }),
  });
  return response.json();
};
