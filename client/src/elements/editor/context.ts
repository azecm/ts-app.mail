import { createContext, MutableRefObject } from "react";

export type ContextProps = MutableRefObject<{
  content: null | HTMLElement;
  subject: null | HTMLInputElement;
  recipient: null | HTMLInputElement;
}>;
export const EditorContext = createContext<ContextProps>({} as ContextProps);
