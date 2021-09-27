import { MailAddress, MailAttachments, MailBoxes, MailBoxModel, SendData } from "../../../client/src/common/types";
import { getTempFileName, getTempFilePath, prisma } from "../constants";
import { closeS3, openS3, putS3Object } from "../aws/buckets";
import { dbUserEmail } from "../db-users";
import * as fs from "fs";
import { exists } from "../utils";

export async function getSender(idu: number) {
  const user = await prisma.users.findFirst({
    where: { idu },
    select: { name: true, email: true },
  });

  return user ? ({ name: user.name, address: user.email } as MailAddress) : null;
}

type MailAddModel = Omit<MailBoxModel, "idb">;

async function messageCreate({ idu, ...data }: MailAddModel & { idu: number }) {
  data.attachments = data.attachments.list.length ? data.attachments : ({} as MailAttachments);

  const { idb } = await prisma.boxes.create({
    data: { idu, ...(data as any) },
    select: { idb: true },
  });

  return { ...data, idb } as MailBoxModel;
}

export async function messageSend({ idu, ...props }: SendData & { idu: number }) {
  const { attachments } = props;
  if (attachments && attachments.list && attachments.key && attachments.list.length) {
    const s3 = openS3();
    for (const row of attachments.list) {
      const fileName = getTempFileName(attachments.key, row.id);
      const pathTempFile = getTempFilePath(attachments.key, row.id);
      if (await exists(pathTempFile)) {
        if (await putS3Object(s3, await dbUserEmail(idu), fileName, pathTempFile)) {
          await fs.promises.unlink(pathTempFile);
        }
      }
    }
    closeS3(s3);
  }

  return (await messageCreate({
    ...props,
    idu,
    box: MailBoxes.sent,
    unread: false,
    date: new Date(),
  })) as MailBoxModel;
}

export async function messageInbox(props: MailAddModel & { idu: number }) {
  return (await messageCreate(props)) as MailBoxModel;
}
