export const closeShipment = async (
  pincode: string,
  tsdUUID: string,
  docId: string,
  info?: string,
  infoType?: string
): Promise<ITruckInfo> => {
  const response = await fetch(
    "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/shipservice/closeshipment",
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
