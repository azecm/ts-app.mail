import * as chokidar from "chokidar";
import { basename, join } from "path";
import * as fs from "fs";
import * as os from "os";
import { parseEmail } from "./mail-receive";
import { pathMove } from "../utils";
import { dirMailSource } from "../constants";

const { readFile } = fs.promises;

const isUnix = os.platform() === "freebsd" || os.platform() === "linux";

const mailBaseDir = "/var/spool/mail/virtual";
const emails = [];

const reId = /^\w+\.\w+/;

const mailDirs = emails.map((email) => {
  const [box, domain] = email.split("@");
  return `${mailBaseDir}/${domain}/${box}/new`;
});

let watcher: chokidar.FSWatcher | undefined;

(async function () {
  if (require.main !== module) {
    await watcherStart();
  }

  //await startTest();
  //await testSingle();
  //await testSingle();
  //await dbPostgreConnect();
  //await mailReceive();
  //await dbPostgreClose();
})();

process.on("SIGINT", () => watcherClose);

async function watcherStart() {
  console.log("watcher start");
  if (!isUnix) return;
  watcher = chokidar.watch(mailDirs, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  watcher.on("add", onNewMail);

  //for (const pathToMail of mailDirs) {
  //  await onNewMail(`${pathToMail}/on-start`);
  //}
}

export function watcherClose() {
  console.log("watcher stop");
  if (watcher) watcher.close().then();
}

function getEmail(path: string) {
  const [domain, box] = path.split("/").slice(-4);
  return `${box}@${domain}`;
}

async function onNewMail(fullPath: string) {
  const email = getEmail(fullPath);
  const m = basename(fullPath).match(reId);
  if (m) {
    const sourceFileName = m[0];
    const content = await readFile(fullPath);
    await parseEmail(email, sourceFileName, content);
    await pathMove(fullPath, join(dirMailSource, email, sourceFileName));
  }
}
