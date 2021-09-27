import { SessionStruct } from "./types";
import { decryptText, encryptText } from "./crypto";
import { FastifyRequest } from "fastify";
import * as crypto from "crypto";
import { setUserData } from "./user-params";
import { getHeaders } from "./utils";

export function sessionInit(request: FastifyRequest, props: Omit<SessionStruct, "pin">) {
  const session: SessionStruct = { ...props, pin: getSessionId(props) };
  const userState = sessionSave(session);
  sessionToMap(session);
  setUserData(request, { userState });
  return userState;
}

export function sessionSave(props: SessionStruct) {
  return encryptText(JSON.stringify(props));
}

function sessionLoad(text: string): SessionStruct | null {
  try {
    return JSON.parse(decryptText(text));
  } catch (e) {
    return null;
  }
}

const sessionDuration = 1000 * 15 * 60;
const sessionMax = 1000 * 24 * 3600 * 5;
const sessionsMap = new Map<number, { [pin: string]: number }>();

function sessionToMap(session: SessionStruct) {
  const userSessions = sessionsMap.get(session.idu);
  if (!userSessions) sessionsMap.set(session.idu, { [session.pin]: session.time });
  else userSessions[session.pin] = session.time;
}

export function testUserState(request: FastifyRequest, text: string) {
  const { ip, browser, userKey } = getHeaders(request);
  const session = sessionLoad(text);
  if (session && browser && userKey && ip) {
    if (userKey === session.key) {
      if (testBrowser(session.browser, browser) > 0.8) {
        const delta = new Date().getTime() - session.time;
        if (delta > sessionMax) return false;
        //if ((!isTest && delta > sessionDuration * 2) || (isTest && delta > sessionMax)) {
        //  return false;
        //}
        const userSessions = sessionsMap.get(session.idu);
        if (!userSessions || !userSessions[session.pin] || userSessions[session.pin] === session.time) {
          const update = session.browser !== browser || session.ip !== ip || delta > sessionDuration;
          if (update) {
            session.browser = browser;
            session.ip = ip;
            session.time = new Date().getTime();
            setUserData(request, { userState: sessionSave(session) });
          }
          sessionToMap(session);
          setUserData(request, { idu: session.idu });
          return true;
        }
      }
    }
  }
  return false;
}

function testBrowser(browserOld: string, browser: string) {
  let counter = 0;
  if (browserOld.length == browser.length) {
    for (let i = 0; i < browser.length; i++) {
      if (browser[i] === browserOld[i]) counter++;
    }
  }
  return browser.length ? counter / browser.length : 0;
}

function getSessionId(props: Pick<SessionStruct, "ip" | "browser" | "key">) {
  return crypto
    .createHash("sha256")
    .update([props.ip, props.browser, props.key, new Date().getTime()].join("-"))
    .digest("base64");
}
