import { MailBoxes } from "../common/types";
import { Action } from "redux";
import { getUserBox } from "../common/utils";

const USER_INIT = "USER_INIT";
const USER_SET_BOX = "USER_SET_BOX";
const USER_CHOICE_ITEM = "USER_CHOICE_ITEM";
const USER_CHOICE_NOTE = "USER_CHOICE_NOTE";
const USER_AUTH = "USER_AUTH";

export enum DetailsState {
  reminders,
  email,
  notes,
}

// ========

type ActiveBoxProps = Pick<UsersState, "box"> & Partial<Pick<UsersState, "details">>;

export function setActiveBox(box: MailBoxes): Action<typeof USER_SET_BOX> & { payload: ActiveBoxProps } {
  const payload = { box } as ActiveBoxProps;
  if (box === MailBoxes.notes) {
    payload.details = DetailsState.notes;
  }
  return {
    type: USER_SET_BOX,
    payload: payload,
  };
}

export function initMailUser(
  props: Pick<UsersState, "signature" | "prefix">,
): Action<typeof USER_INIT> & { payload: Pick<UsersState, "signature" | "prefix"> } {
  return {
    type: USER_INIT,
    payload: props,
  };
}

export function userAuth(authorized: boolean): Action<typeof USER_AUTH> & { payload: Pick<UsersState, "authorized"> } {
  return {
    type: USER_AUTH,
    payload: { authorized },
  };
}

export function mailItemChoice(
  idb: bigint,
  box: MailBoxes,
): Action<typeof USER_CHOICE_ITEM> & { payload: Pick<UsersState, "idb" | "box" | "details"> } {
  return {
    type: USER_CHOICE_ITEM,
    payload: { idb, box, details: DetailsState.email },
  };
}

export function mailNoteChoice(
  idn: number,
): Action<typeof USER_CHOICE_NOTE> & { payload: { idn: number; details: DetailsState } } {
  return {
    type: USER_CHOICE_NOTE,
    payload: { idn, details: DetailsState.notes },
  };
}

// ========

export type UsersActions =
  | ReturnType<typeof setActiveBox>
  | ReturnType<typeof mailItemChoice>
  | ReturnType<typeof initMailUser>
  | ReturnType<typeof mailNoteChoice>
  | ReturnType<typeof userAuth>;

const initialState = {
  authorized: false,
  prefix: "",
  signature: "",
  idn: 0,
  idb: BigInt(0),
  box: MailBoxes.inbox,
  details: DetailsState.reminders,
  mailbox: getUserBox(),
};

export type UsersState = typeof initialState;

export function usersReducer(state = initialState, action: UsersActions): UsersState {
  switch (action.type) {
    case USER_INIT:
    case USER_SET_BOX:
    case USER_CHOICE_NOTE:
    case USER_CHOICE_ITEM:
    case USER_AUTH:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
