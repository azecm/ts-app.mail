import { MailNoteEvent, MailNotesModel, NoteRemove } from "../../client/src/common/types";
import { UserIDType } from "./types";
import { isNil, omit } from "lodash";
import { Prisma } from "@prisma/client";
import { prisma } from "./constants";

export async function dbNotes({ idu }: { idu: number }) {
  return await prisma.notes.findMany({ where: { idu }, orderBy: { position: "asc" } });
}

type UpResult = Pick<MailNotesModel, "idn"> & Partial<MailNotesModel & NoteRemove>;

type UpdateProps = Partial<MailNotesModel> & UserIDType & Partial<NoteRemove>;
export async function dbNotesUpdate({ idu, idn, remove, ...props }: UpdateProps) {
  const result = [] as UpResult[];

  if (!idn) {
    const data = {
      idp: props.idp || 0,
      label: props.label || "",
      email: props.email || "",
      content: "",
      position: props.position || 0,
    } as Omit<MailNotesModel, "event" | "idn">;

    const { idn } = await prisma.notes.create({
      data: { ...data, idu },
      select: { idn: true },
    });

    result.push({ ...omit(data, "position"), event: {} as MailNoteEvent, idn });

    await dbNotesOrder({ idu, idn, position: data.position, idp: data.idp }, result);
  } else {
    const res = await prisma.notes.findFirst({ where: { idn, idu } });
    if (res) {
      if (remove) {
        const resLength = await prisma.notes.count({ where: { idu, idp: idn } });
        if (!resLength) {
          await prisma.notes.delete({ where: { idn } });
          // ===
          await dbNotesOrder({ idu, idn: 0, position: -1, idp: res.idp || 0 }, result);
          result.push({ idn, remove: true });
        }
      } else {
        const data = {} as Omit<MailNotesModel, "event"> & { event: Prisma.JsonValue };
        if (!isNil(props.idp) && res.idp !== props.idp) {
          const position = { idp: props.idp, position: 1 };
          await prisma.notes.update({ where: { idn }, data: position });
          await dbNotesOrder({ idu, idn: 0, position: -1, idp: res.idp || 0 }, result);
          await dbNotesOrder({ idu, idn, ...position }, result);
          // ===
          result.push({ idn, remove: true });
          result.push({ idn, ...position });
        } else if (!isNil(props.position) && res.position !== props.position) {
          data.position = props.position;
          await dbNotesOrder(
            {
              idu,
              idn,
              position: props.position,
              idp: props.idp || 0,
            },
            result,
          );
        }
        if (!isNil(props.label) && res.label !== props.label) {
          data.label = props.label;
        }
        if (!isNil(props.email) && res.email !== props.email) {
          data.email = props.email;
        }
        if (!isNil(props.content) && res.content !== props.content) {
          data.content = props.content;
        }
        if (!isNil(props.event) && !eventEq(res.event as any, props.event)) {
          data.event = props.event as any;
        }
        // =====
        if (Object.keys(data).length) {
          await prisma.notes.update({ where: { idn }, data });
        }

        result.push({ ...omit(props, "position"), idn });
      }
    }
  }

  return result;
}

function eventEq(e1: MailNoteEvent | null, e2: MailNoteEvent | null) {
  return e1?.date === e2?.date && e1?.delta === e2?.delta && e1?.period === e2?.period;
}

async function dbNotesOrder(item: { idu: number; idp: number; idn: number; position: number }, result: UpResult[]) {
  const resList = await prisma.notes.findMany({
    where: { idp: item.idp, idu: item.idu },
    orderBy: { position: "asc" },
    select: { idn: true, position: true },
  });

  let flag = false;
  let position = 0;
  for (const row of resList) {
    if (row.idn === item.idn) continue;
    position++;
    if (position === item.position) {
      flag = true;
      if (item.idn) {
        await prisma.notes.update({ where: { idn: item.idn }, data: { position } });
        result.push({ idn: item.idn, position } as MailNotesModel & NoteRemove);
      }
      position++;
    }
    if (row.position !== position) {
      await prisma.notes.update({ where: { idn: row.idn }, data: { position } });
      result.push({ idn: row.idn, position } as MailNotesModel & NoteRemove);
    }
  }

  if (!flag && item.idn) {
    position++;
    await prisma.notes.update({ where: { idn: item.idn }, data: { position } });
    result.push({ idn: item.idn, position } as MailNotesModel & NoteRemove);
  }
}
