import { createContext, Dispatch, FunctionComponent, SetStateAction, useCallback, useContext } from "react";
import type { DialogParam } from "./types";
import constants from "./constants";

let idNext = 0;

type ContextProps = { addItem: Dispatch<SetStateAction<DialogParam<any>[]>> };

export const DialogContext = createContext<ContextProps>({} as ContextProps);

export function useDialogAlert() {
  const { addItem } = useContext(DialogContext);
  return useCallback(
    (message: string | FunctionComponent) => {
      const props = { message, type: constants.typeAlert, id: ++idNext } as DialogParam<any>;
      addItem((items) => [...items, props]);
    },
    [addItem],
  );
}

export function useDialogConfirm() {
  const { addItem } = useContext(DialogContext);
  return useCallback(
    (message: string | FunctionComponent) => {
      return new Promise<boolean>((resolve) => {
        const props = {
          message,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          type: constants.typeConfirm,
          id: ++idNext,
        } as DialogParam<any>;
        addItem((items) => [...items, props]);
      });
    },
    [addItem],
  );
}

type FormProps<Props> = Pick<DialogParam<Props>, "title" | "Form" | "props" | "result"> &
  Partial<Pick<DialogParam<Props>, "buttons" | "styleBackLeft">>;

export function useDialogForm() {
  const { addItem } = useContext(DialogContext);
  return useCallback(
    <Props,>(propsInit: FormProps<Props>) => {
      const props = {
        ...propsInit,
        type: constants.typeConfirm,
        id: ++idNext,
        check: { current: () => void 0 },
      } as DialogParam<Props>;
      addItem((items) => [...items, props]);
    },
    [addItem],
  );
}
