export const closePallet = async (
    pincode: string,
    tsdUUID: string,
    palletSSCC: string,
    info?: string,
    infoType?: string
  ) => {
    const response = await fetch(
      "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/palletservice/close",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pincode: pincode,
          tsdUUID: tsdUUID ? tsdUUID : "",
          palletSSCC: palletSSCC,
          info: info ? info : '',
          infoType: infoType ? infoType : '' 
        }),
      }
    );
    return response.json();
  };
  