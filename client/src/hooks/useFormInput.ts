import { FormEvent, MutableRefObject, useCallback } from "react";

export function useFormInput<T>(data: MutableRefObject<any>, after?: (fieldName: string, val: T) => T) {
  return useCallback(
    (e: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const el = e.currentTarget;
      let val = el.value.trim() as any;
      const obj = data.current;
      if (!obj) return;
      switch (typeof obj[el.name]) {
        case "number":
          val = +val;
          break;
        case "boolean":
          val = /^true$/i.test(val);
          break;
      }
      obj[el.name] = after ? after(el.name, val) || val : val;
    },
    [data, after],
  );
}
