const BASE_URL = import.meta.env.VITE_PALLET_API_URL;

export const fetchPalletInfo = async (
  pincode: string,
  palletSSCC: string,
  cartSSCC: string,
  tsdUUID: string,
) => {
  const response = await fetch(
    `${BASE_URL}/palletInfo`,
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
