import { useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PinContext } from '../../../context/PinAuthContext';
import { GetDocResponse } from '../../../api/kitservice/getDoc';
import { createKit } from '../../../api/kitservice/createKit';
import { getKit } from '../../../api/kitservice/getKit';
import { changeKit } from '../../../api/kitservice/changeKit';
import { deleteKit } from '../../../api/kitservice/deleteKit';
import { printLabel } from '../../../api/kitservice/printLabel';

export const useKitActions = () => {
  const location = useLocation();
  const { pinAuthData } = useContext(PinContext);
  const [docData, setDocData] = useState<GetDocResponse>(location.state?.docData);
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Constants
  const pinCode = String(pinAuthData?.pinCode);
  const tsdUUID = String(localStorage.getItem("tsdUUID"));

  const SET_SIZE = useMemo(() => {
    if (!docData?.kitDetail) return 4;
    return docData.kitDetail.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [docData]);

  const validateCode = (code: string) => {
    if (!docData?.kitDetail) return false;
    const item = docData.kitDetail.find(d => code.includes(d.GTIN));
    if (!item) return false;
    return true; 
  };

  const handleApiCall = async <T,>(
    apiFn: (params: any) => Promise<T & { error?: string }>,
    params: any,
    successMessage?: string,
    updateDoc = true,
    updateCodes = false
  ) => {
    setIsLoading(true);
    try {
      const response = await apiFn({ ...params, pinCode, tsdUUID });
      if (response.error) {
        setErrorText(response.error);
        if (updateCodes) setCodes([]);
      } else {
        if (successMessage) setSuccessText(successMessage);
        if (updateDoc) setDocData(response as any);
        if (updateCodes) setCodes((response as any).scanCodes || []);
        else setCodes([]);
      }
    } catch (e: any) {
      setErrorText(e.message || String(e));
      if (updateCodes) setCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createKitAction = (scannedCodes: string[]) => {
      handleApiCall(createKit, { docNum: docData?.docNum, scanCodes: scannedCodes }, "Набор успешно агрегирован!", true, false);
  };

  const findKitAction = (scannedCodes: string[]) => {
      if (scannedCodes.length === 0) return;
      handleApiCall(getKit, { scanCod: scannedCodes[0], docNum: String(docData?.docNum) }, `Набор найден`, true, true);
  };

  const changeKitAction = (scannedCodes: string[]) => {
      handleApiCall(changeKit, { kitNum: docData?.KitNum, scanCodes: scannedCodes, docNum: docData?.docNum }, "Набор обновлен", true, true);
  };

  const deleteKitAction = () => {
    if (!window.confirm("Вы уверены, что хотите удалить набор?")) return;
    handleApiCall(deleteKit, { kitNum: docData?.KitNum, docNum: docData?.docNum }, "Набор удален", true, false);
  };

  const printLabelAction = () => {
     if (!window.confirm("Вы уверены, что хотите отправить этикетки на печать?")) return;
     handleApiCall(printLabel, { kitNum: docData?.KitNum, docNum: docData?.docNum }, "Этикетка отправлена на печать", true, false);
  };

  return {
    docData,
    codes,
    setCodes,
    isLoading,
    errorText,
    setErrorText,
    successText,
    setSuccessText,
    SET_SIZE,
    validateCode,
    actions: {
        createKit: createKitAction,
        findKit: findKitAction,
        changeKit: changeKitAction,
        deleteKit: deleteKitAction,
        printLabel: printLabelAction
    }
  };
};

