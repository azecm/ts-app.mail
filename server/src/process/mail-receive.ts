import { AddressObject, simpleParser } from "mailparser";
import {
  MailAddress,
  MailAttachmentItem,
  MailAttachments,
  MailBoxes,
  MailBoxModel,
} from "../../../client/src/common/types";
import {
  documentToString,
  elementToParent,
  getAttributeValue,
  getDocument,
  getText,
  insertTextBefore,
  removeAttribute,
  removeNode,
  selectAllByAttrName,
  selectAllByTagName,
  selectComments,
  selectFirstByTagName,
  TagA,
  TagImg,
} from "./html";
import { textOnly } from "../utils";
import { genKey } from "../../../client/src/common/utils";
import { dbUserByEmail } from "../db-users";
import { messageInbox } from "../message/create";
import { appPubSub, getTempFileName, SUB_MESSAGE_UPDATE } from "../constants";
import { SubMessageUpdated } from "../../../client/src/common/constants";
import { closeS3, openS3, putS3Object } from "../aws/buckets";

const reTrusted = /(talantiuspeh\.ru|sochisirius\.ru|amigeschool\.ru|zoom\.us)/;
const reBadZone = /\.(eu|au|us|ml|tk|de|nl|g.|bid|fr|xyz|icu|club|press|top|cyou|buzz)$/;
const reBadHost = /@(\d+\.com)$/;

const badContent = [
  / porn /i,
  /goo-gl\.ru.com/i,
  /www.google.com\/url/i,
  /495 480 89 48/i,
  /комплекс услуг по перевозке и доставке грузов/i,
  /предложени. для владельца сайта/i,
  /mayboroda_aleks/i,
] as RegExp[];

export async function parseEmail(email: string, sourceFileName: string, sourceText: Buffer) {
  const data = await simpleParser(sourceText);
  const fullList = [...getAddressList(data.to), ...getAddressList(data.cc), ...getAddressList(data.bcc)];

  const msgSubject = data.subject || "";
  const msgContent = cleanHtml(data.html || textToHtml(data.text || ""));

  const from = getAddressList(data.from);
  const fromTrusted = from.filter((val) => reTrusted.test(val)).length > 0;

  let isSpam = false;
  if (fromTrusted) {
  } else {
    if (!fullList.includes(email)) {
      isSpam = true;
    }
    if (from.filter((val) => reBadZone.test(val)).length > 0) {
      isSpam = true;
    }
    if (from.filter((val) => reBadHost.test(val)).length > 0) {
      isSpam = true;
    }
    const content = textOnly(data.html || "");
    const filtered = badContent.filter((re) => re.test(content) || re.test(data.text || ""));
    if (filtered.length > 0) {
      isSpam = true;
    }
  }

  let date = new Date(data.date || Date.now());
  if (isNaN(date.getTime())) date = new Date();
  if (!msgContent) return;

  const user = await dbUserByEmail(email);
  if (!user) return;
  const { idu } = user;

  // ====

  const attachments = { key: "", list: [] } as MailAttachments;
  if (data.attachments.length) {
    const s3 = openS3();
    let ind = 0;
    for (const row of data.attachments) {
      if (!row.filename) continue;
      if (!attachments.key) attachments.key = genKey();

      const rowAttach = { id: ++ind, size: row.size, fileName: row.filename } as MailAttachmentItem;
      attachments.list.push(rowAttach);

      const fileName = getTempFileName(attachments.key, rowAttach.id);
      await putS3Object(s3, email, fileName, row.content);
    }
    closeS3(s3);
  }

  // ====

  const sender = getEmails(data.from).filter((r) => r.address)[0] || { name: "", address: "" };
  const recipient = getEmails(data.to).filter((r) => r?.address?.toLowerCase() == email)[0] ||
    getEmails(data.to).filter((r) => r.address)[0] || {
      name: "",
      address: "",
    };

  const dataDB = {
    date,
    box: !isSpam ? MailBoxes.inbox : MailBoxes.trash,
    unread: true,
    subject: msgSubject,
    content: msgContent,
    sender,
    recipient,
    attachments,
  } as MailBoxModel;

  const res = await messageInbox({ idu, ...dataDB });

  if (appPubSub.current && res) {
    await appPubSub.current.publish({
      topic: SUB_MESSAGE_UPDATE(email),
      payload: {
        [SubMessageUpdated]: res,
      },
    });
  }
}

function getEmails(list?: AddressObject[] | AddressObject): MailAddress[] {
  const result = [] as MailAddress[];
  if (list) {
    for (const items of Array.isArray(list) ? list : [list]) {
      for (const { address, name } of items.value) {
        if (address) result.push({ address, name });
      }
    }
  }
  return result;
}

function getAddressList(list?: AddressObject[] | AddressObject): string[] {
  const result = [] as string[];
  if (list) {
    for (const items of Array.isArray(list) ? list : [list]) {
      for (const { address } of items.value) {
        if (address) result.push(address);
      }
    }
  }
  return result;
}

function textToHtml(text: string) {
  return "<p>" + text.replace(/\n/, "<br>") + "</p>";
}

function cleanHtml(html: string) {
  const doc = getDocument(html);

  for (const tagName of [TagImg, "style", "script", "meta", "link", "base"]) {
    for (const node of selectAllByTagName(doc, tagName)) {
      if (tagName === TagImg) {
        const alt = getAttributeValue(node, "alt");
        const title = getAttributeValue(node, "title");
        let text: string | undefined;
        if (alt && title) {
          text = alt === title ? title : `${alt} | ${title}`;
        } else {
          text = title || alt || "";
        }
        if (text) insertTextBefore(node, `[${text}]`);
      }
      removeNode(node);
    }
  }

  for (const node of selectComments(doc)) {
    removeNode(node);
  }

  for (const node of selectAllByTagName(doc, TagA)) {
    if (!getText(node).trim()) {
      elementToParent("b", null, node, ["[link]"]);
    }
  }

  for (const attrName of ["style", "bgcolor", "color", "bordercolor", "class", "id"]) {
    for (const node of selectAllByAttrName(doc, attrName)) {
      removeAttribute(node, attrName);
    }
  }

  return documentToString((selectFirstByTagName(doc, "body") as any) || doc);
}
