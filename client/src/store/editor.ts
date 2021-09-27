import { MailAttachmentItem, MailAttachments } from "../common/types";
import { Action } from "redux";
import { EditorType } from "../types";

const EDITOR_UPDATE = "EDITOR_UPDATE";
const EDITOR_AT_ADD = "EDITOR_AT_ADD";
const EDITOR_AT_REMOVE = "EDITOR_AT_REMOVE";

export function editorUpdate(
  props: Partial<EditorState>,
): Action<typeof EDITOR_UPDATE> & { payload: Partial<EditorState> } {
  return {
    type: EDITOR_UPDATE,
    payload: props,
  };
}

export function editorAttachmentAdd(
  items: MailAttachmentItem[],
): Action<typeof EDITOR_AT_ADD> & { payload: MailAttachmentItem[] } {
  return {
    type: EDITOR_AT_ADD,
    payload: items,
  };
}

export function editorAttachmentRemove(id: number): Action<typeof EDITOR_AT_REMOVE> & { payload: number } {
  return {
    type: EDITOR_AT_REMOVE,
    payload: id,
  };
}

export type EditorActions =
  | ReturnType<typeof editorUpdate>
  | ReturnType<typeof editorAttachmentAdd>
  | ReturnType<typeof editorAttachmentRemove>;

function getInitial() {
  return {
    opened: false,
    saved: false,
    editable: false,
    type: EditorType.none,
    idn: 0,
    idb: BigInt(0),
    mailFrom: "",
    mailTo: "",
    subject: "",
    content: "",
    attachments: {} as MailAttachments,
  };
}

export type EditorState = ReturnType<typeof getInitial>;

export function editorReducer(state = getInitial(), action: EditorActions): EditorState {
  switch (action.type) {
    case EDITOR_UPDATE:
      return action.payload.opened ? { ...getInitial(), ...action.payload } : { ...state, ...action.payload };
    case EDITOR_AT_ADD:
      return {
        ...state,
        attachments: { ...state.attachments, list: [...state.attachments.list, ...action.payload] },
      };
    case EDITOR_AT_REMOVE:
      return {
        ...state,
        attachments: {
          ...state.attachments,
          list: state.attachments.list.filter(({ id }) => id !== action.payload),
        },
      };
    default:
      return state;
  }
}
