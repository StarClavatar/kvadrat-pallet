import { GetDocResponse } from "./getDoc";

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface PrintLabelParams {
    pinCode: string;
    tsdUUID: string;
    kitNum: string;
    docNum: string
}

export type PrintLabelResponse = GetDocResponse;

export const printLabel = async (params: PrintLabelParams): Promise<PrintLabelResponse> => {
    const headers = {
        "Content-Type": "application/json",
    };

    const response = await fetch(`${BASE_URL}/kitservice/printLabel`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(params),
    });
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return { error: text } as any;
    }
};
