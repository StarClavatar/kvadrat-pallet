const PALLET_URL = import.meta.env.VITE_PALLET_API_URL
export const addCart = async (
  pincode: string,
  palletSSCC: string,
  cartSSCC: string,
  tsdUUID: string,
  info?: string,
  infoType?: string
) => {
  const response = await fetch(
    `${PALLET_URL}/addCart`,
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
