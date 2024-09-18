const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchPalletInfo = async (
  pincode: string,
  palletSSCC: string,
  cartSSCC: string,
  tsdUUID: string,
) => {
  const response = await fetch(
    `${BASE_URL}/palletservice/palletInfo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pincode: pincode,
        tsdUUID: tsdUUID ? tsdUUID : "",
        palletSSCC: palletSSCC,
        cartSSCC: cartSSCC,
      }),
    }
  );
  return response.json();
};
