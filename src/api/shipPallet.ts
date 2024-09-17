const BASE_URL = import.meta.env.VITE_SHIPMENT_API_URL;

export const shipPallet = async (
  pincode: string,
  tsdUUID: string,
  docId: string,
  palletSSCC: string,
  info?: string,
  infoType?: string
): Promise<ITruckInfo> => {
  const response = await fetch(
    `${BASE_URL}/shippallet`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinCode: pincode,
        tsdUUID: tsdUUID,
        code: docId,
        palletSSCC: palletSSCC,
        infoType: infoType ? infoType : "",
        info: info ? info : "",
      }),
    }
  );
  return response.json();
};
