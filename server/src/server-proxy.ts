import * as path from "path";
import * as fs from "fs";
import { FastifyInstance } from "fastify";

//ReturnType<typeof Fastify>
export function frontProxy(app: FastifyInstance) {
  const pathToJs = path.resolve("./client-build/index.js");
  const pathToJsMap = path.resolve("./client-build/index.js.map");
  //const bufferIndexJs = fs.existsSync(pathToJs) ? fs.readFileSync(pathToJs) : "";
  const pathToFavicon = path.resolve("./favicon.ico");
  const bufferFavicon = fs.existsSync(pathToFavicon) ? fs.readFileSync(pathToFavicon) : "";
  //let jsSize = 0;
  app.setNotFoundHandler(async function (req, reply) {
    //reply.code(404).send({ error: 'Not Found', message: 'Four Oh Four 🤷‍♂️', statusCode: 404 })
    reply.type("text/html").send(indexHtml());
  });
  app.get("/", async function (req, reply) {
    reply.type("text/html").send(indexHtml());
  });
  app.get("/index.js", async function (req, reply) {
    const stream = fs.createReadStream(pathToJs);
    reply.type("text/javascript").send(stream);
  });
  app.get("/index.js.map", async function (req, reply) {
    const stream = fs.createReadStream(pathToJsMap);
    reply.type("text/plain").send(stream);
  });
  app.get("/favicon.ico", async function (req, reply) {
    reply.type("image/x-icon").send(bufferFavicon);
  });
  app.get("/client/*", async function (req, reply) {
    // client/src/index.tsx
    const pathBase = req.url.substr("/client/".length);
    const pathToFile = path.resolve(__dirname, "../..", pathBase);
    if (fs.existsSync(pathToFile)) {
      const stream = fs.createReadStream(pathToFile);
      reply.type("text/plain").send(stream);
    } else {
      reply.type("text/plain").send(pathBase + "\n not found \n" + pathToFile);
    }
  });
}

function indexHtml() {
  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mail</title>
</head>
<body>
<script src="/index.js" type="module"></script>
</body>
</html>
`;
}
