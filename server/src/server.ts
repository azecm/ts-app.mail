import Fastify from "fastify";
import mercurius, { MercuriusOptions } from "mercurius";
import { resolvers, schema } from "./schema";
import { frontProxy } from "./server-proxy";
import { headerUserState } from "../../client/src/common/constants";
import { getUserData, setUserData } from "./user-params";
import { testUserState } from "./user-session";
import FastifyMultipart, { MultipartFile, MultipartValue } from "fastify-multipart";
import * as crypto from "crypto";
import * as fs from "fs";
import * as stream from "stream";
import { MailAttachmentItem } from "../../client/src/common/types";
//import "./crontab";
import "./process/mail-watcher";
import { getTempFilePath, getTempFilePathByName } from "./constants";
import { exists, getHeaders } from "./utils";
import { getAttachmentObject } from "./aws/buckets";

const { pipeline: pump } = stream.promises;
const { stat: statAsync, rename: renameAsync } = fs.promises;

const app = Fastify({ logger: true });

// https://www.fastify.io/ecosystem/

app.register(FastifyMultipart);
app.register(mercurius, {
  schema,
  resolvers,
  queryDepth: 8,
  subscription: true,
} as MercuriusOptions);

app.addHook("preValidation", async (request) => {
  const userState = request.headers[headerUserState] as string;
  if (userState) {
    if (!testUserState(request, userState)) {
      request.validationError = { name: "", message: "", validationContext: "", validation: false };
    }
  }
});

app.addHook("onSend", async (request, reply) => {
  const userState = getUserData(request)?.userState;
  if (userState) {
    reply.header(headerUserState, userState);
  }
});

app.addHook("onResponse", async (request) => {
  const close = getUserData(request)?.close;
  if (close) close();
});

app.get("/file/:fileName", async (request, reply) => {
  const replyFileHeaders = async (size: number) => {
    const text = [browser, query.filename, referer, size].join("-");
    const key = crypto.createHash("sha512").update(text).digest("base64");
    if (key === query.user) {
      reply.header("Content-Type", "application/octet-stream");
      if (query.filename) {
        reply.header("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(query.filename)}`);
      }
      reply.header("Content-Length", size);
      return true;
    }
    return false;
  };

  const { browser, referer } = getHeaders(request);
  const query = request.query as {
    user: string;
    temp?: string;
    filename: string;
    email: string;
  };
  const params = request.params as { fileName: string };
  if (referer && browser && query?.filename && params?.fileName) {
    if (query.temp) {
      const filePath = getTempFilePathByName(params.fileName);
      if (await exists(filePath)) {
        const stat = await statAsync(filePath);
        if (await replyFileHeaders(stat.size)) {
          return reply.status(200).send(fs.createReadStream(filePath));
        }
      }
    } else {
      const { s3Object, s3Close: close } = await getAttachmentObject(query.email, params.fileName);
      setUserData(request, { close });
      if (s3Object && s3Object.ContentLength && (await replyFileHeaders(s3Object.ContentLength))) {
        return reply.status(200).send(s3Object.Body);
      }
    }
  }
  return reply.send({ success: false });
});

app.post("/files", async (request, reply) => {
  if (request.isMultipart() && getUserData(request)?.idu) {
    const parts = request.parts();
    const params = { key: "", last: "" };
    const paramsFiles = [] as { originName: string; tempName: string }[];
    for await (const part of parts) {
      if (part.file) {
        const { filename: originName, file } = part;
        const tempName = new Date().getTime() + "-" + Math.round(Math.random() * 1000);
        paramsFiles.push({ tempName, originName });
        await pump(file, fs.createWriteStream(getTempFilePathByName(tempName)));
      } else {
        const { fieldname, value } = part as MultipartValue<string> & MultipartFile;
        params[fieldname as keyof typeof params] = value;
      }
    }
    if (params.key && params.last && paramsFiles.length) {
      const result = [] as MailAttachmentItem[];
      let next = +params.last;
      for (const { originName, tempName } of paramsFiles) {
        const filePath = getTempFilePath(params.key, ++next);
        await renameAsync(getTempFilePathByName(tempName), filePath);
        const stat = await statAsync(filePath);
        result.push({ id: next, size: stat.size, fileName: originName });
      }

      return reply.send({ success: true, result });
    }
  }

  return reply.send({ success: false });
});

//app.register(frontProxy);
frontProxy(app);
app.listen(3000);

function closeServer() {
  app.close();
  console.log("server instance closed");
}

process.on("SIGINT", () => closeServer);
