import { prisma } from "./constants";
import { LoginProps } from "../../client/src/common/types";
import { decryptWeb } from "./crypto-web";
import { SessionStruct } from "./types";
import { sessionInit } from "./user-session";
import { FastifyRequest } from "fastify";

const userEmail = new Map<number, string>();

export async function dbUser({ idu }: { idu: number }) {
  const user = await prisma.users.findMany({
    where: { idu },
    select: { signature: true, name: true },
  });
  return { prefix: user[0]?.name, signature: user[0]?.signature };
}

export async function dbUserEmail(idu: number) {
  const email = userEmail.get(idu);
  if (email) return email;
  const res = await prisma.users.findFirst({
    where: { idu },
    select: { email: true },
  });
  if (res) {
    userEmail.set(idu, res.email);
    return res.email;
  }
  return "";
}

export async function dbUserByEmail(email: string) {
  return await prisma.users.findFirst({
    where: { email },
    select: { idu: true },
  });
}

export async function dbLogin(
  request: FastifyRequest,
  dataText: string,
  params: Pick<SessionStruct, "ip" | "key" | "browser">,
) {
  let data: undefined | LoginProps;
  try {
    data = JSON.parse(await decryptWeb(dataText));
  } catch (e) {}
  if (data) {
    const { user: userName, pass, mailbox } = data;
    if (userName && pass && mailbox) {
      const user = await prisma.users.findFirst({
        where: { email: mailbox, name: userName },
        select: { idu: true, password: true },
      });
      if (user?.password === pass) {
        return sessionInit(request, { ...params, idu: user.idu, time: new Date().getTime() });
      }
    }
  }
  return null;
}
