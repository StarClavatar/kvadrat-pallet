const BASE_URL = import.meta.env.VITE_PALLET_API_URL;

export const deleteCart = async (
  pincode: string,
  tsdUUID: string,
  palletSSCC: string,
  cartSSCC: string,
  info?: string,
  infoType?: string
) => {
  const response = await fetch(
    `${BASE_URL}/deleteCart`,
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
        infoType: infoType ? infoType : "",
        info: info ? info : "",
      }),
    }
  );
  return response.json();
};
