import { ReactNode, useEffect, useRef, useState } from "react";
import { DialogParam } from "./types";
import DialogElement from "./element";
import { DialogContext } from "./context";

export function DialogProvider({ children }: { children: ReactNode }) {
  const [items, addItem] = useState<DialogParam<any>[]>([]);
  const obj = useRef({ addItem }).current;

  if (items.length === 1) {
    saveSelection();
  }

  useEffect(() => {
    if (items.length === 0) {
      loadSelection();
    }
  }, [items.length]);

  return (
    <DialogContext.Provider value={obj}>
      {children}
      {items.length ? <DialogElement {...items[items.length - 1]} /> : null}
    </DialogContext.Provider>
  );
}

let selectionMem: null | Range = null;

function saveSelection() {
  const selection = window.getSelection();
  selectionMem = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
}

function loadSelection() {
  if (selectionMem) {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selectionMem);
    }
  }
}
