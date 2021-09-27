import { MailNotesModel, NoteGroup, NoteRemove, NotesGroupItem } from "../common/types";
import { viewAddress } from "../common/utils";
import { Action } from "redux";
import isNil from "lodash/isNil";
import omitBy from "lodash/omitBy";

const NOTES_INIT = "NOTES_INIT";
const NOTES_GROUP_UPDATE = "NOTES_GROUP_UPDATE";
const NOTES_ITEM_UPDATE = "NOTES_ITEM_UPDATE";

export function actionNotesInit(
  notes: MailNotesModel[],
): Action<typeof NOTES_INIT> & { payload: Pick<NotesState, "groups" | "datalist" | "reminders"> } {
  const dict = {} as NotesType;
  const reminders = [] as RemindersType;
  let datalist = [] as string[];
  const remindersStart = 1000 * 3600 * 24 * 3;
  for (const row of notes) {
    dict[row.idn] = row;
    if (row.email) {
      datalist.push(viewAddress({ name: row.label, address: row.email }));
    }
  }
  for (const row of notes) {
    const date = row?.event?.date;
    if (date && new Date(date).getTime() - Date.now() < remindersStart) {
      const group = dict[row.idp];
      reminders.push({ date, label: `${group.label}: ${row.label}` });
    }
  }
  reminders.sort((a, b) => a.date.localeCompare(b.date));
  datalist = [...new Set(datalist).values()].sort();
  return {
    type: NOTES_INIT,
    payload: { datalist, reminders, groups: getGroups(dict) },
  };
}

export function actionNotesGroupUpdate(
  data: (NoteGroup & NoteRemove)[],
): Action<typeof NOTES_GROUP_UPDATE> & { payload: (NoteGroup & NoteRemove)[] } {
  return {
    type: NOTES_GROUP_UPDATE,
    payload: data,
  };
}

export function actionNotesItemUpdate(
  data: (MailNotesModel & NoteRemove)[],
): Action<typeof NOTES_ITEM_UPDATE> & { payload: (MailNotesModel & NoteRemove)[] } {
  return {
    type: NOTES_ITEM_UPDATE,
    payload: data,
  };
}

export type NotesActions =
  | ReturnType<typeof actionNotesInit>
  | ReturnType<typeof actionNotesGroupUpdate>
  | ReturnType<typeof actionNotesItemUpdate>;

const initialState = {
  datalist: [] as string[],
  reminders: [] as RemindersType,
  groups: new Map<number, NotesGroupItem>(),
};

type NotesType = { [s: string]: MailNotesModel };
export type NotesState = typeof initialState;
export type RemindersType = { date: string; label: string }[];

export function notesReducer(state = initialState, action: NotesActions): NotesState {
  switch (action.type) {
    case NOTES_INIT:
      return { ...state, ...action.payload };
    case NOTES_GROUP_UPDATE:
      return { ...state, ...updateNotesGroup(state, action.payload) };
    case NOTES_ITEM_UPDATE:
      return { ...state, ...updateNotesItem(state, action.payload) };
    default:
      return state;
  }
}

function updateNotesGroup(state: NotesState, rows: (NoteGroup & NoteRemove)[]) {
  const { groups } = state;

  for (const { remove, ...dataRow } of rows) {
    const data = omitBy(dataRow, isNil) as NoteGroup;
    const item = groups.get(data.idn);
    if (remove) {
      if (item) {
        groups.delete(data.idn);
      }
    } else {
      if (item) {
        groups.set(data.idn, { ...item, ...data });
      } else {
        groups.set(data.idn, { ...data, items: [] });
      }
    }
  }

  state.groups = new Map([...groups.entries()].sort(([, a], [, b]) => a.position - b.position));
  return state;
}

function updateNotesItem(state: NotesState, rows: (MailNotesModel & NoteRemove)[]) {
  const { groups } = state;

  const pid = new Map<number, number>();
  for (const { items } of groups.values()) {
    for (const { idn, idp } of items) {
      pid.set(idn, idp);
    }
  }

  for (const { remove, ...dataRow } of rows) {
    if (isNil(dataRow.idp)) {
      const idp = pid.get(dataRow.idn);
      if (!isNil(idp)) dataRow.idp = idp;
    } else {
      pid.set(dataRow.idn, dataRow.idp);
    }
    const data = omitBy(dataRow, isNil) as MailNotesModel;

    const group = groups.get(data.idp);
    if (group) {
      if (remove) {
        group.items = group.items.filter(({ idn }) => idn !== data.idn);
      } else {
        const pos = group.items.map(({ idn }) => idn).indexOf(data.idn);
        if (pos > -1) {
          group.items[pos] = { ...group.items[pos], ...data };
        } else {
          group.items.push(data);
        }
      }
      group.items.sort((a, b) => a.position - b.position);
      group.items = [...group.items];
    }
  }

  state.groups = new Map(groups);
  return state;
}

function getGroups(dict: NotesType) {
  const map = new Map<number, NotesGroupItem>();

  for (const { idn, idp, label, position } of Object.values(dict)) {
    if (idp) continue;
    map.set(idn, { idn, label, position, items: [] });
  }

  for (const item of Object.values(dict)) {
    if (!item.idp) continue;
    const group = map.get(item.idp);
    if (group) group.items.push(item);
  }

  for (const group of map.values()) {
    group.items.sort((a, b) => a.position - b.position);
  }

  return new Map<number, NotesGroupItem>([...map.entries()].sort((a, b) => a[1].position - b[1].position));
}
