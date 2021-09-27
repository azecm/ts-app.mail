import { Prisma } from "@prisma/client";

import {
  MailAddress,
  MailBoxes,
  MailBoxModel,
  MailNoteEvent,
  MailNotesModel,
  messageOperationMove,
  MessageOperationProps,
  messageOperationRead,
  messageOperationUnread,
} from "../../client/src/common/types";
import { prisma } from "./constants";

const byPage = 30;

const selectMessageProps = {
  date: true,
  idb: true,
  unread: true,
  subject: true,
  content: true,
  sender: true,
  attachments: true,
  recipient: true,
  box: true,
};

export type DbLoadProps = { box: MailBoxes; page: number; idu: number };

export async function dbBoxLoad({ idu, box, page }: DbLoadProps) {
  return await prisma.boxes.findMany({
    where: { idu, box },
    orderBy: { date: "desc" },
    skip: byPage * page,
    take: byPage,
    select: selectMessageProps,
  });
}

export async function dbMessage({ idu, idb, operation, box }: { idu: number } & MessageOperationProps) {
  const prev = await prisma.boxes.findFirst({ where: { idu, idb }, select: { box: true } });
  if (!prev) return null;
  switch (operation) {
    case messageOperationUnread:
    case messageOperationRead: {
      const unread = operation === messageOperationUnread;
      await prisma.boxes.update({ where: { idb }, data: { unread } });
      return { idb, unread } as MailBoxModel;
    }
    case messageOperationMove: {
      return await prisma.boxes.update({ where: { idb }, data: { box }, select: selectMessageProps });
    }
  }
  return null;
}

export async function dbToNotes({ idu, idb }: { idu: number; idb: bigint }) {
  const message = await prisma.boxes.findFirst({ where: { idu, idb } });
  const user = await prisma.users.findFirst({
    where: { idu },
    select: { email: true },
  });
  const notesGroup = await prisma.notes.findFirst({
    where: { idu, idp: 0 },
    orderBy: { position: "asc" },
  });
  if (!message || !user || !notesGroup) return null;

  const emailBox = user.email.toLowerCase();
  const sender = getAddress(message.sender);
  const recipient = getAddress(message.recipient);
  const { content } = message;

  let email = "";
  let label = "";
  if (sender.address.toLowerCase() != emailBox) {
    email = sender.address;
    label = sender.name;
  } else if (recipient.address.toLowerCase() != emailBox) {
    email = recipient.address;
    label = recipient.name;
  }

  const idp = notesGroup.idn;
  const position = 1 + (await prisma.notes.count({ where: { idu, idp } }));
  const data = { idp, label, email, content, position } as Omit<MailNotesModel, "event" | "idn">;

  const { idn } = await prisma.notes.create({
    data: { ...data, idu },
    select: { idn: true },
  });

  return { ...data, event: {} as MailNoteEvent, idn };
}

function getAddress(src: Prisma.JsonValue): MailAddress {
  return src as any;
}
