import * as fs from "fs";
import * as child_process from "child_process";
import * as util from "util";
import { FastifyRequest } from "fastify";
import { headerUserKey } from "../../client/src/common/constants";
//import { dirname } from "path";

const exec = util.promisify(child_process.exec);
const { unlink, rename } = fs.promises;

export function exists(filePath: string) {
  return fs.promises
    .stat(filePath)
    .then(() => true)
    .catch(() => false);
}

export function getHeaders(request: FastifyRequest) {
  const { headers } = request;
  return {
    referer: (headers["referer"] as string) || "",
    browser: (headers["user-agent"] as string) || "",
    ip: (headers["ip"] as string) || "",
    userKey: (headers[headerUserKey] as string) || "",
  };
}

export function textOnly(html?: string | null, flagInline = true) {
  if (html === void 0 || html === null) {
    html = "";
  } else {
    html = html + "";
    html = html.replace(/<\/?[a-z][^>]*>/g, " ").replace(/&#?([a-z0-9]+);/g, " ");

    if (flagInline) {
      html = html.replace(/[\n\r\t\s]+/g, " ");
    } else {
      html = html.replace(/[\r\t\s]+/g, " ");
    }

    html = html.replace(/\s+/, " ").trim();
  }
  return html;
}

export async function pathMove(source: string, target: string, replace = true) {
  if (await exists(source)) {
    const flag = await exists(target);
    if (replace && flag) await unlink(target);
    if (!(await exists(target))) {
      await rename(source, target);
    }
  }
}

export async function execCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  let result: { stdout: string; stderr: string };
  try {
    result = await exec(cmd);
  } catch (e) {
    result = { stdout: "", stderr: e };
    console.error("execCommand", cmd);
    console.error(e);
  }
  return result;
}
