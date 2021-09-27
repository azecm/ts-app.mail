import { getUserState } from "../common/utils";
import { headerUserKey, headerUserState } from "../common/constants";
import { userKey } from "./request";

const url = "/files";

export function postFormData<T>(form: FormData, fnProgress: (proc: number) => void) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);

  xhr.setRequestHeader(headerUserKey, userKey.current);
  xhr.setRequestHeader(headerUserState, getUserState());

  xhr.upload.onprogress = (e) => fnProgress(Math.round((e.loaded * 1000) / e.total) / 10);

  xhr.send(form);

  return new Promise<T | null>((resolve) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let result = { success: false } as { success: boolean; result: T };
        try {
          result = JSON.parse(xhr.responseText);
        } catch (e) {}
        resolve(result.success && result.result ? result.result : null);
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
  });
}
