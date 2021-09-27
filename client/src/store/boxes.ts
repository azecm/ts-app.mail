import { Action } from "redux";
import { boxInbox, boxReady, boxSent, boxTrash, MailBoxes, MailBoxModel, MailBoxType } from "../common/types";
import isNil from "lodash/isNil";
import omitBy from "lodash/omitBy";

const MAILBOX_LOAD = "MAILBOX_LOAD";
const MESSAGE_UPDATED = "MESSAGE_UPDATED";

// ================

export interface LoadedPayload {
  box: MailBoxes;
  page: number;
  items: MailBoxModel[];
}

export function mailBoxLoaded(
  box: MailBoxes,
  page: number,
  items: MailBoxModel[],
): Action<typeof MAILBOX_LOAD> & { payload: LoadedPayload } {
  return {
    type: MAILBOX_LOAD,
    payload: { box, items, page },
  };
}

export function messageUpdated(message: MailBoxModel): Action<typeof MESSAGE_UPDATED> & { payload: MailBoxModel } {
  return {
    type: MESSAGE_UPDATED,
    payload: message,
  };
}

// ================

export type BoxesActions = ReturnType<typeof mailBoxLoaded> | ReturnType<typeof messageUpdated>;

// ================

const initialState = {
  inbox: boxInit(),
  ready: boxInit(),
  sent: boxInit(),
  trash: boxInit(),
} as { [K in MailBoxType]: MailBoxItem };

export interface MailBoxItem {
  initialized: boolean;
  page: number;
  items: Map<bigint, MailBoxModel>;
}

export type BoxesState = typeof initialState;

function boxInit(): MailBoxItem {
  return {
    initialized: false,
    page: 0,
    items: new Map(),
  };
}

export function boxesReducer(state = initialState, action: BoxesActions): BoxesState {
  switch (action.type) {
    case MAILBOX_LOAD:
      return { ...loaded(state, action.payload) };
    case MESSAGE_UPDATED:
      return { ...message(state, action.payload) };
    default:
      return state;
  }
}

function message(state: BoxesState, payload: MailBoxModel) {
  let data = omitBy(payload, isNil) as MailBoxModel;

  let updated = false;
  for (const boxName of [boxInbox, boxReady, boxSent, boxTrash]) {
    const { items } = state[boxName];
    const message = items.get(data.idb);
    if (message) {
      data = { ...message, ...data };
      if (!isNil(data.box)) {
        items.delete(data.idb);
      } else {
        items.set(data.idb, data);
        updated = true;
      }
      state[boxName] = { ...state[boxName], items: new Map(items) };
      break;
    }
  }

  if (!updated) {
    const boxNameNext = MailBoxes[data.box] as MailBoxType;
    const { items } = state[boxNameNext];
    items.set(data.idb, data);
    state[boxNameNext] = {
      ...state[boxNameNext],
      items: new Map([...items.entries()].sort((a, b) => +b[1].date - +a[1].date)),
    };
  }

  return state;
}

function loaded(state: BoxesState, payload: LoadedPayload) {
  const boxName = MailBoxes[payload.box] as MailBoxType;
  if (!state[boxName].initialized) {
    state[boxName].initialized = true;
  }

  const prevItems = state[boxName].items;
  let items = new Map<bigint, MailBoxModel>();
  if (payload.box === MailBoxes.inbox) {
    for (const row of payload.items) {
      items.set(row.idb, row);
    }
    for (const row of prevItems.values()) {
      items.set(row.idb, row);
    }
  } else {
    items = new Map(prevItems);
    for (const row of payload.items) {
      items.set(row.idb, row);
    }
  }

  state[boxName] = {
    ...state[boxName],
    ...{
      page: payload.page,
      items,
    },
  };

  return state;
}
