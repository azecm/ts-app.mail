import { MailAttachments, MessageForwardProps } from "../../../client/src/common/types";
import { getTempFilePath, prisma } from "../constants";
import { closeS3, getS3Object, openS3 } from "../aws/buckets";
import * as fs from "fs";
import * as stream from "stream";

export async function messageForward({ idu, idb }: MessageForwardProps & { idu: number }) {
  const user = await prisma.users.findFirst({
    where: { idu },
    select: { email: true },
  });

  if (!user) return null;

  const message = await prisma.boxes.findFirst({ where: { idu, idb } });

  const attachments: MailAttachments = message?.attachments as any;
  if (attachments) {
    if (attachments.list && attachments.list.length) {
      const attach = { key: `${Date.now()}-${Math.round(Math.random() * 10000)}`, list: [] } as MailAttachments;
      const s3 = openS3();
      let id = 0;
      for (const row of attachments.list) {
        const s3Object = await getS3Object(s3, user.email, `${attachments.key}-${row.id}`);
        if (s3Object.Body) {
          const reader = s3Object.Body as stream.Readable;
          id++;
          const pathTarget = getTempFilePath(attach.key, id);
          await stream.promises.pipeline(reader, fs.createWriteStream(pathTarget));
          attach.list.push({ id: id, size: row.size, fileName: row.fileName });
        }
      }
      closeS3(s3);
      return attach;
    }
  }

  return null;
}
