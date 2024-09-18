const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchTruckInfo = async (
  pincode: string,
  tsdUUID: string,
  docId: string
): Promise<ITruckInfo> => {
  const response = await fetch(
    `${BASE_URL}/shipservice/truckinfo`,
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
