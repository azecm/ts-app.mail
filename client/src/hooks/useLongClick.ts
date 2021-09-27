import { MutableRefObject, useEffect, useRef } from "react";

export function useLongClick(call: () => void, ref: MutableRefObject<HTMLElement | null>) {
  const refTimer = useRef<any>();
  useEffect(() => {
    function onDown() {
      clearTimeout(refTimer.current);
      refTimer.current = setTimeout(call, 700);
    }
    function onUp() {
      clearTimeout(refTimer.current);
    }
    const elem = ref.current;
    if (elem) {
      elem.addEventListener("pointerdown", onDown);
      elem.addEventListener("pointerup", onUp);
    }
    return () => {
      clearTimeout(refTimer.current);
      if (elem) {
        elem.removeEventListener("pointerdown", onDown);
        elem.removeEventListener("pointerup", onUp);
      }
    };
  }, [call, ref]);

  return ref;
}
