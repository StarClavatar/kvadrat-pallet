# Key page dependency trees

All protected pages are additionally composed by `src/main.tsx` through `src/routes/root.tsx`, `src/auth/ProtectedRoute/ProtectedRoute.tsx`, `src/context/PinAuthContext.tsx`, `src/context/valueContext.tsx`, and `src/components/Loader/Loader.tsx`. Trees below trace page-local relative imports recursively; package imports are omitted.

## `/` — PIN entry
Entry: `src/App.tsx`

Dependencies:
- `src/App.css` (empty)
- `src/pages/EntryPage/EntryPage.tsx`
  - `src/pages/EntryPage/EntryPage.css`
  - `src/assets/backspaceIcon.tsx`
  - `src/context/PinAuthContext.tsx`
  - `src/api/pinAuth.ts`
  - `src/components/Loader/Loader.tsx`
    - `src/components/Loader/Loader.css`
- `src/components/UpdatePrompt/UpdatePrompt.tsx`
  - `src/components/UpdatePrompt/UpdatePrompt.css`

## `/workmode` — operation hub
Entry: `src/pages/Workmode/Workmode.tsx`

Dependencies:
- `src/pages/Workmode/Workmode.css`
- `src/context/PinAuthContext.tsx`

## `/series-photoes` — Series Photos document entry
Entry: `src/pages/SeriesPhotos/SeriesPhotosEntry.tsx`

Dependencies:
- `src/assets/backspaceIcon.tsx`
- `src/context/PinAuthContext.tsx`
- `src/api/seriesPhotos.ts`
- `src/pages/SeriesPhotos/SeriesPhotos.module.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`

## `/series-photoes/:docNumber` — Series Photos product list
Entry: `src/pages/SeriesPhotos/SeriesPhotosList.tsx`

Dependencies:
- `src/assets/backspaceIcon.tsx`
- `src/context/PinAuthContext.tsx`
- `src/api/seriesPhotos.ts`
- `src/pages/SeriesPhotos/SeriesPhotos.module.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`

## `/series-photoes/:docNumber/:seriesUUID` — Series Photos detail/gallery
Entry: `src/pages/SeriesPhotos/SeriesPhotosDetails.tsx`

Dependencies:
- `src/assets/backspaceIcon.tsx`
- `src/context/PinAuthContext.tsx`
- `src/api/seriesPhotos.ts`
- `src/pages/SeriesPhotos/SeriesPhotos.module.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`

External visual dependency: `react-photo-view/dist/react-photo-view.css`.

## `/set-aggregation` — kit aggregation
Entry: `src/pages/KitAggregation/KitAggregation.tsx`

Dependencies:
- `src/pages/KitAggregation/KitAggregation.module.css`
- `src/components/Loader/Loader.tsx`
  - `src/components/Loader/Loader.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`
- `src/pages/KitAggregation/components/ReviewModal.tsx`
  - `src/pages/KitAggregation/components/ReviewModal.module.css`
  - `src/pages/KitAggregation/utils/imageProcessing.ts`
    - `src/api/kitservice/getDoc.ts`
- `src/components/CameraScanner/CameraScanner.tsx`
  - `src/components/CameraScanner/CameraScanner.module.css`
  - `src/assets/scanSuccess.mp3`
  - `src/assets/barCodeIcon.tsx`
  - `src/hooks/useBarcodeDetector.ts`
- `src/assets/printIcon.tsx`
- `src/pages/KitAggregation/hooks/useKitActions.ts`
  - `src/context/PinAuthContext.tsx`
  - `src/api/kitservice/getDoc.ts`
  - `src/api/kitservice/createKit.ts`
    - `src/api/kitservice/getDoc.ts`
  - `src/api/kitservice/getKit.ts`
    - `src/api/kitservice/getDoc.ts`
  - `src/api/kitservice/changeKit.ts`
    - `src/api/kitservice/getDoc.ts`
  - `src/api/kitservice/deleteKit.ts`
    - `src/api/kitservice/getDoc.ts`
  - `src/api/kitservice/printLabel.ts`
    - `src/api/kitservice/getDoc.ts`
- `src/pages/KitAggregation/utils/imageProcessing.ts`
  - `src/api/kitservice/getDoc.ts`

## `/pallet/:sscc` — pallet workflow
Entry: `src/pages/Pallet/Pallet.tsx`

Dependencies:
- `src/pages/Pallet/config.tsx`
- `src/pages/Pallet/Pallet.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`
- `src/components/DeleteBoxInteractive/DeleteBoxInteractive.tsx`
  - `src/components/DeleteBoxInteractive/DeleteBoxInteractive.css`
  - `src/assets/barCodeIcon.tsx`
  - `src/hooks/useCustomScanner.ts`
  - `src/assets/scanSuccess.mp3`
  - `src/assets/scanFailed.mp3`
  - `src/api/deleteCart.ts`
  - `src/context/PinAuthContext.tsx`
  - `src/components/Loader/Loader.tsx`
    - `src/components/Loader/Loader.css`
  - `src/api/unshipPallet.ts`
  - `src/pages/Pallet/config.tsx`
  - `src/context/valueContext.tsx`
    - `src/pages/Pallet/config.tsx`
    - `src/pages/Order/types.ts`
- `src/components/Group/Group.tsx`
  - `src/components/Group/Group.css`
  - `src/pages/Pallet/config.tsx`
  - `src/components/Popup/Popup.tsx`
- `src/context/PinAuthContext.tsx`
- `src/hooks/useCustomScanner.ts`
- `src/api/addCart.ts`
- `src/assets/scanFailed.mp3`
- `src/assets/scanSuccess.mp3`
- `src/components/Loader/Loader.tsx`
- `src/api/palletServiceClosePallet.ts`
- `src/context/valueContext.tsx`
- `src/assets/backspaceIcon.tsx`

## `/truck-filling/:docId` — truck loading
Entry: `src/pages/TruckFilling/TruckFilling.tsx`

Dependencies:
- `src/pages/TruckFilling/TruckFilling.css`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`
- `src/components/DeleteBoxInteractive/DeleteBoxInteractive.tsx`
  - `src/components/DeleteBoxInteractive/DeleteBoxInteractive.css`
  - `src/assets/barCodeIcon.tsx`
  - `src/hooks/useCustomScanner.ts`
  - `src/assets/scanSuccess.mp3`
  - `src/assets/scanFailed.mp3`
  - `src/api/deleteCart.ts`
  - `src/context/PinAuthContext.tsx`
  - `src/components/Loader/Loader.tsx`
  - `src/api/unshipPallet.ts`
  - `src/pages/Pallet/config.tsx`
  - `src/context/valueContext.tsx`
- `src/context/PinAuthContext.tsx`
- `src/hooks/useCustomScanner.ts`
- `src/assets/scanFailed.mp3`
- `src/assets/scanSuccess.mp3`
- `src/components/Loader/Loader.tsx`
  - `src/components/Loader/Loader.css`
- `src/api/truckinfo.ts`
- `src/api/shipPallet.ts`
- `src/api/palletServiceCloseShipment.ts`
- `src/api/unshipPallet.ts`
- `src/context/valueContext.tsx`
  - `src/pages/Pallet/config.tsx`
  - `src/pages/Order/types.ts`
- `src/assets/backspaceIcon.tsx`

## `/box-aggregation` — box aggregation
Entry: `src/pages/BoxAggregation/BoxAggregation.tsx`

Dependencies:
- `src/pages/BoxAggregation/BoxAggregation.css`
- `src/context/PinAuthContext.tsx`
- `src/assets/backspaceIcon.tsx`
- `src/context/valueContext.tsx`
  - `src/pages/Pallet/config.tsx`
  - `src/pages/Order/types.ts`
- `src/hooks/useCustomScanner.ts`
- `src/api/addPack.ts`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`
- `src/assets/scanSuccess.mp3`
- `src/assets/scanFailed.mp3`
- `src/api/removePack.ts`
- `src/components/DeleteDialog/DeleteDialog.tsx`
  - `src/components/DeleteDialog/DeleteDialog.css`
  - `src/hooks/useCustomScanner.ts`
  - `src/components/Popup/Popup.tsx`
- `src/api/finishCart.ts`
- `src/api/printCartLabel.ts`
- `src/assets/PencilIcon.tsx`
- `src/assets/printIcon.tsx`
- `src/api/changeQuantity.ts`

## `/mass-marking-scan` — returns entry
Entry: `src/pages/MassMarkingEntry/MassMarkingEntry.tsx`

Dependencies:
- `src/pages/MassMarkingEntry/MassMarkingEntry.module.css`
- `src/components/CameraScanner/CameraScanner.tsx`
  - `src/components/CameraScanner/CameraScanner.module.css`
  - `src/assets/scanSuccess.mp3`
  - `src/assets/barCodeIcon.tsx`
  - `src/hooks/useBarcodeDetector.ts`
- `src/components/Popup/Popup.tsx`
  - `src/components/Popup/Popup.css`
  - `src/assets/closeIcon.tsx`
- `src/assets/backspaceIcon.tsx`
- `src/assets/scanSuccess.mp3`
- `src/assets/scanFailed.mp3`
- `src/context/PinAuthContext.tsx`
- `src/api/refundInfo.ts`
