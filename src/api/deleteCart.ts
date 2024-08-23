export const deleteCart = async (
  pincode: string,
  tsdUUID: string,
  palletSSCC: string,
  cartSSCC: string,
  info?: string,
  infoType?: string
) => {
  const response = await fetch(
    "https://markbaddev.kvadrat-c.org/mark_bad_dev/hs/palletservice/deleteCart",
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
