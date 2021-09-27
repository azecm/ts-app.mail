import { SendData } from "../../../client/src/common/types";
import * as nodemailer from "nodemailer";
import { Address } from "nodemailer/lib/mailer";
import { documentToString, getDocument } from "./html";
import { getTempFilePath } from "../constants";

// ptr
// spf
// dkim

// idu: number, email: string,
export async function sendEmail(data: SendData) {
  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail.exim",
  });
  // sendmail.exim
  // sendmail.postfix

  const { sender: from, recipient: to, subject, content, attachments } = data;
  const sendData = {
    from,
    to,
    subject,
  } as {
    from: Address;
    to: Address;
    subject: string;
    html: string;
    text: string;
    attachments: { filename: string; path: string }[];
  };

  const doc = getDocument(content);
  sendData.html = documentToString(doc);
  sendData.text = content
    .split(/<\/?(?:p|br|h\d)>/)
    .filter((r) => r.trim())
    .join("\n")
    .replace(/<[^>]+>/g, "");

  if (attachments.list.length) {
    sendData.attachments = [];
    for (const r of attachments.list) {
      sendData.attachments.push({
        filename: r.fileName,
        path: getTempFilePath(attachments.key, r.id),
      });
    }
  }

  const res = await transporter.sendMail(sendData);

  if (res.messageId && res.response === "Messages queued for delivery") {
    return true;
  }
  console.error("sendEmail(2)", res);
  return false;
}
