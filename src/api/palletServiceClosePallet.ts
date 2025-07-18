const BASE_URL = import.meta.env.VITE_BASE_URL;

export const closePallet = async (
    pincode: string,
    tsdUUID: string,
    palletSSCC: string,
    info?: string,
    infoType?: string
  ) => {
    const response = await fetch(
      `${BASE_URL}/palletservice/close`,
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
  