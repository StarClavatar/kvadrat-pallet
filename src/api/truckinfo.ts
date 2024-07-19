export const fetchTruckInfo = async (
  pincode: string,
  tsdUUID: string,
  docId: string
): Promise<ITruckInfo> => {
  const response = await fetch(
    "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/shipservice/truckinfo",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinCode: pincode,
        tsdUUID: tsdUUID ? tsdUUID : "",
        code: docId,
      }),
    }
  );
  return response.json();
};
