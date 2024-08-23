export const unshipPallet = async (
    pincode: string,
    tsdUUID: string,
    docId: string,
    palletSSCC: string,
    info?: string,
    infoType?: string
  ): Promise<ITruckInfo> => {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/shipservice/unshippallet",
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
  