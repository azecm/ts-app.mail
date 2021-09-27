import { MailAddress, MailBoxes, MailBoxType } from "./types";
import { StoreState } from "../store";

export function viewAddress(props: MailAddress) {
  if (!props || !props.address) return "";
  return props.name ? `${props.name} <${props.address}>` : props.address;
}

export function getActiveEmail(state: StoreState) {
  const { idb, box } = state.users;
  if (box === MailBoxes.notes) {
    return void 0;
  } else {
    const data = state.boxes[MailBoxes[box] as MailBoxType];
    return data && data.items ? data.items.get(idb) : void 0;
  }
}

export function domDropElem<T extends HTMLElement>(elem: T) {
  const parent = elem.parentNode;
  if (parent) {
    while (elem.firstChild) {
      parent.insertBefore(elem.firstChild, elem);
    }
    elem.remove();
  }
}

export function tagParent(EL: HTMLElement | EventTarget | null, find: string) {
  let el = EL as HTMLElement | null;
  if (find.charAt(0) === ".") {
    const reFind = new RegExp("(^|\\s)(" + find.substr(1) + ")($|\\s)", "i");
    while (el && !reFind.test(el.className)) el = domParentNode(el) as HTMLElement | null;
  } else {
    find = find.toLowerCase();
    while (el && el.nodeName.toLowerCase() !== find) el = domParentNode(el) as HTMLElement | null;
  }
  return el;
}

function domParentNode(elem: Node) {
  return elem.parentNode;
}

export function toBase64(buffer: number[] | ArrayBuffer) {
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function getHash(text: string) {
  return crypto.subtle.digest("SHA-512", new TextEncoder().encode(text)).then(toBase64);
}

export function getUserState() {
  const { localStorage } = window;
  const box = getUserBox();
  return box ? localStorage.getItem(box) || "" : "";
}

export function setUserState(state: string) {
  const { localStorage } = window;
  const box = getUserBox();
  if (box) {
    localStorage.setItem(box, state);
  }
}

export function getUserBox() {
  const { location } = window;
  const mailbox = location.pathname.split("/")[1];
  return testEmail(mailbox) ? mailbox : "";
}

export function testEmail(val: string) {
  return /[a-z]+@[a-z-]+\.[a-z]+/.test(val || "");
}

export function genKey() {
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function getUrlHost(){
  return `${location.protocol}//${location.host}/`;
}
