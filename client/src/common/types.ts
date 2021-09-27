export enum MailBoxes {
  inbox,
  ready,
  sent,
  trash,
  notes,
}

export const boxInbox = "inbox" as const;
export const boxReady = "ready" as const;
export const boxSent = "sent" as const;
export const boxTrash = "trash" as const;

export type MailBoxType = "inbox" | "ready" | "sent" | "trash";

export interface NotesGroupItem {
  idn: number;
  position: number;
  label: string;
  items: MailNotesModel[];
}

export type NoteGroup = Omit<NotesGroupItem, "items">;

export type RemindersType = { date: string; label: string }[];

export const messageOperationMove = "move" as const;
export const messageOperationRead = "read" as const;
export const messageOperationUnread = "unread" as const;

export type MessageForwardProps = {
  idb: bigint;
};

export type MessageOperationProps = {
  idb: bigint;
  operation: typeof messageOperationRead | typeof messageOperationMove | typeof messageOperationUnread;
  box?: MailBoxes;
};

export interface MailBoxModel {
  idb: bigint;
  box: number;
  date: Date;
  sender: MailAddress;
  recipient: MailAddress;
  unread: boolean;
  subject: string;
  content: string;
  attachments: MailAttachments;
}

export interface MailAttachments {
  key: string;
  list: MailAttachmentItem[];
}

export interface MailAttachmentItem {
  id: number;
  fileName: string;
  size: number;
}

export type MessageSendProps = {
  recipient: MailAddress;
  subject: string;
  content: string;
  attachments: MailAttachments;
};

export interface SendData {
  sender: MailAddress;
  recipient: MailAddress;
  subject: string;
  content: string;
  attachments: MailAttachments;
}

export interface MailAddress {
  name: string;
  address: string;
}

// ===========

export interface MailNotesModel {
  idn: number;
  idp: number;
  position: number;

  label: string;
  email: string;

  content: string;
  event: MailNoteEvent;
}

export interface MailNoteEvent {
  date: string;
  delta: number;
  period: MailEventPeriod;
}

export enum MailEventPeriod {
  day = 1,
  month,
  year,
}

export type NoteRemove = { remove: boolean };

export type LoginProps = { mailbox: string; user: string; pass: string };
