import { FunctionComponent, MutableRefObject } from "react";
import constants from "./constants";

export interface DialogParam<Props> {
  id: number;
  title?: string;
  message?: string | FunctionComponent;
  type: DialogType;
  disableBackClose?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  // ===
  Form: FunctionComponent<Props>;
  props: Omit<Props, keyof DialogFormContext<any>>;
  result: (data: any) => void;
  check: MutableRefObject<() => boolean | void>;
  close: () => void;
  buttons: DialogButton[];
  styleBackLeft?: number;
}

export interface DialogFormContext<Returns> {
  result: (data: Returns) => void;
  check: MutableRefObject<() => boolean | void>;
}

type DialogType = typeof constants.typeAlert | typeof constants.typeConfirm | typeof constants.typeForm;

export type DialogButtonClick = { confirm: () => void; cancel: () => void };

interface DialogButton {
  text: string;
  title?: string;
  type?: "confirm" | "cancel";
  onClick?: (props: DialogButtonClick) => void;
}
