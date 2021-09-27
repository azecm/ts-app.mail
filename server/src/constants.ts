import { PrismaClient } from "@prisma/client";
import { PubSub } from "mercurius";

export const SUB_NOTES_GROUP_UPDATE = (email: string) => `SUB_NOTES_GROUP_UPDATE_${email}`;
export const SUB_NOTES_ITEM_UPDATE = (email: string) => `SUB_NOTES_ITEM_UPDATE_${email}`;
export const SUB_MESSAGE_UPDATE = (email: string) => `SUB_MESSAGE_UPDATE_${email}`;

export const appPubSub = { current: null as any } as { current: PubSub };
//export const appPubSub = {} as { [s: string]: PubSub };

export const dirDump = "/home/centos/app/dump/";
export const dirTempFiles = "/home/centos/app/temp/";
export const dirMailSource = "/home/centos/app/data/mail-source/";

export const prisma = new PrismaClient();

export const extTmp = ".tmp";

export function getTempFileName(key: string, id: number) {
  return `${key}-${id}`;
}

export function getTempFilePath(key: string, id: number) {
  return getTempFilePathByName(getTempFileName(key, id));
}

export function getTempFilePathByName(fileName: string) {
  return `${dirTempFiles}${fileName}${fileName.endsWith(extTmp) ? "" : extTmp}`;
}
