# Extractable reusable components

The repository has no formal design-system package. The strongest extraction candidates are existing shared components plus repeated page-level patterns.

## Layout components

## Root
- Source: `src/routes/root.tsx`
- Category: layout
- Description: Global route outlet with provider and loading overlay.
- Extractable props: none; route outlet and loading state are supplied by context.
- Hardcoded: `ValueContextProvider`, `Loader`, fragment-only shell, no visible navigation.

## ProtectedRoute
- Source: `src/auth/ProtectedRoute/ProtectedRoute.tsx`
- Category: layout
- Description: Authentication boundary used around every non-login route.
- Extractable props: `children`.
- Hardcoded: redirect URL `/`, `PinContext`, current-location redirect state.

## WorkmodeOperationMenu
- Source: `src/pages/Workmode/Workmode.tsx`
- Category: layout
- Description: Main mobile operation navigation shown after PIN authentication.
- Extractable props: operation visibility flags (`makePallets`, `workOrder`, `shipment`, `inventory`, `seriesPhotos`), worker/terminal labels.
- Hardcoded: route URLs, Russian operation labels, installation emoji, logout label, CSS class names.

## SeriesPhotosPageShell
- Source: repeated structure in `src/pages/SeriesPhotos/SeriesPhotosEntry.tsx`, `SeriesPhotosList.tsx`, and `SeriesPhotosDetails.tsx`
- Category: layout
- Description: Full-height mobile page with dark-blue header, back button, title, scrollable content, and optional floating action.
- Extractable props: `title`, `backHref`/`onBack`, `showAction`, action handler, children.
- Hardcoded: `BackspaceIcon`, header color and dimensions, mobile viewport behavior, spacing and CSS Module classes in `SeriesPhotos.module.css`.

## Basic components

## Popup
- Source: `src/components/Popup/Popup.tsx`
- Category: basic
- Description: Shared modal overlay and content container.
- Extractable props: `isOpen`, `onClose`, `title`, `fullScreen`, `children`, `containerClassName`.
- Hardcoded: `CloseIcon`, backdrop behavior, close-button placement, `popup*` CSS classes.

## Loader
- Source: `src/components/Loader/Loader.tsx`
- Category: basic
- Description: Blocking overlay with configurable spinner size and color.
- Extractable props: `size` (default `"m"`), `color` (default `"#fff"`).
- Hardcoded: twelve spinner spokes, full-viewport translucent overlay, spinner animation.

## ConfirmationDialog
- Source: `src/components/ConfirmationDialog/ConfirmationDialog.tsx`
- Category: basic
- Description: Popup-based confirmation with yes/no or continue actions.
- Extractable props: `isOpen`, `onClose`, `info`, `infoType`, `onConfirm`, `onCancel`.
- Hardcoded: Russian labels `Да`, `Нет`, `Продолжить`; green/red button styling.

## DeleteDialog
- Source: `src/components/DeleteDialog/DeleteDialog.tsx`
- Category: basic
- Description: Scanner-aware confirmation dialog with optional manual input.
- Extractable props: `isOpen`, `onClose`, `onScan`, `title`, `prompt`, `withoutInput`, `autoSubmit`.
- Hardcoded: Russian helper/action labels, scanner visualizer, `Popup`, CSS classes.

## CameraScanner
- Source: `src/components/CameraScanner/CameraScanner.tsx`
- Category: basic
- Description: Reusable camera barcode scanner with native Barcode Detection and ZXing fallback.
- Extractable props: `onScan`, `textButton`, `expectedCount`, `existingCodes`, `formats`, `closeOnScan`, `scannerText`, `defaultOpen`, `buttonDisabled`, `fullscreen`, `modalSessionCount`, `onModalOpenChange`, `forceZXing`, `muteDetectorSuccessSound`.
- Hardcoded: barcode and torch icons, detector mode label, camera constraints, green/yellow/red overlay colors, cooldown timings.

## UpdatePrompt
- Source: `src/components/UpdatePrompt/UpdatePrompt.tsx`
- Category: basic
- Description: Global two-action PWA update notification.
- Extractable props: `onUpdate`, `onClose`.
- Hardcoded: Russian update copy, button labels, inline loading state, CSS classes.

## GroupCard
- Source: `src/components/Group/Group.tsx`
- Category: basic
- Description: Pallet product group summary card that opens a box table.
- Extractable props: `productName`, `productSerial`, `cartCount`, `cartsOnCount`, `groupState`, `carts`.
- Hardcoded: collected/neutral background colors, Russian table title and columns, `Popup`, table CSS classes.

## SeriesProductCard
- Source: inline map item in `src/pages/SeriesPhotos/SeriesPhotosList.tsx`
- Category: basic
- Description: Tappable product/series card with index, metadata, photo-count badge, and chevron.
- Extractable props: product name, series, expiration date, index, `photoCount`, click/navigation handler.
- Hardcoded: inline `PhotoIcon` and `ChevronRight`, bullet separator, `до` label, CSS Module visual styling.

## SeriesPhotoThumbnail
- Source: inline gallery item in `src/pages/SeriesPhotos/SeriesPhotosDetails.tsx`
- Category: basic
- Description: Square photo thumbnail/placeholder integrated with full-screen photo preview.
- Extractable props: `src`, `alt`, loading state, retake handler.
- Hardcoded: 1:1 ratio, rounded thumbnail, `PhotoView`, Russian `Загрузка...` placeholder.

## SeriesStatusPopup
- Source: repeated blocks in all three `src/pages/SeriesPhotos/*.tsx` page components
- Category: basic
- Description: Error/success message treatment built on the shared Popup.
- Extractable props: `variant`, `message`, `isOpen`, `onClose`.
- Hardcoded: red/green surfaces, `OK` label for errors, width/max-width and typography classes.
