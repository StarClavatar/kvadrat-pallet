const BASE_URL_SERIES_PHOTOS = import.meta.env.VITE_BASE_URL_SERIES_PHOTOS;
export type SeriesPhoto = {
  photoUUID: string;
  fileName: string;
  modifiedAt: string;
  modifiedBy: string;
};

export type TransferProduct = {
  name: string;
  gtin: string;
  series: string;
  productionDate: string;
  expirationDate: string;
  seriesUUID: string;
  photos: SeriesPhoto[];
};

export type TransferDocumentData = {
  documentUUID: string;
  documentNumber: string;
  documentDate: string;
  products: TransferProduct[];
};

export type TransferProductsResponse = {
  success?: boolean;
  data: TransferDocumentData | null;
  error: any;
  correlationId?: string;
};

export const getTransferProducts = async (
  documentNumber: string,
  pinCode: string,
  tsdUUID: string,
  userName?: string
): Promise<TransferProductsResponse> => {
  const response = await fetch(`${BASE_URL_SERIES_PHOTOS}/transfer-products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentNumber,
      pinCode,
      tsdUUID,
      userName: userName || "",
    }),
  });
  return response.json();
};

export type PhotoData = {
  photoUUID: string;
  base64: string;
};

export const getPhotos = async (
  photoUUIDs: string[],
  pinCode: string,
  tsdUUID: string,
  userName?: string
): Promise<{ success?: boolean; data: PhotoData[] | null; error: any }> => {
  const response = await fetch(`${BASE_URL_SERIES_PHOTOS}/photos/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(photoUUIDs),
  });
  return response.json();
};

export type EditPhotoPayload = {
  photoUUID?: string;
  fileName: string;
  base64: string;
};

export const editSeriesPhotos = async (
  seriesUUID: string,
  photos: EditPhotoPayload[],
  documentNumber: string,
  pinCode: string,
  tsdUUID: string,
  userName?: string
): Promise<TransferProductsResponse> => {
  const response = await fetch(`${BASE_URL_SERIES_PHOTOS}/series/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      seriesUUID,
      documentNumber,
      photos,
      pinCode,
      tsdUUID,
      userName: userName || "",
    }),
  });
  return response.json();
};
