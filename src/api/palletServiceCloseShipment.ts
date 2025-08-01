const BASE_URL = import.meta.env.VITE_BASE_URL;

export const closeShipment = async (
  pincode: string,
  tsdUUID: string,
  docId: string,
  info?: string,
  infoType?: string
): Promise<ITruckInfo> => {
  const response = await fetch(
    `${BASE_URL}/shipservice/closeshipment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinCode: pincode,
        tsdUUID: tsdUUID ? tsdUUID : "",
        code: docId,
        infoType: infoType ? infoType : "",
        info: info ? info : "",
      }),
    }
  );
  return response.json();
};