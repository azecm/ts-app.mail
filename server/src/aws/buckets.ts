import * as dotenv from "dotenv";
import { S3 } from "@aws-sdk/client-s3";
import { extTmp } from "../constants";
import * as fs from "fs";

dotenv.config();

// ts-node server/src/aws/buckets.ts

// https://www.npmjs.com/package/@aws-sdk/client-s3
// https://github.com/awsdocs/aws-doc-sdk-examples/tree/master/javascriptv3/example_code/s3/src
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/js-sdk-dg.pdf
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started-nodejs.html

const bucketName = "mail-attachments";

(async function () {
  if (require.main !== module) return;
  const s3 = openS3();
  closeS3(s3);
})();

export function openS3() {
  return new S3({ endpoint: process.env.AWS_ENDPOINT_URL });
}

export function closeS3(s3: S3) {
  s3.destroy();
}

export function getBucketKey(email: string, fileName: string) {
  return `${email}/${fileName}${fileName.endsWith(extTmp) ? "" : extTmp}`;
}

export async function putS3Object(s3: S3, email: string, fileName: string, data: string | Buffer) {
  try {
    const r = await s3.putObject({
      Bucket: bucketName,
      Key: getBucketKey(email, fileName),
      Body: typeof data == "string" ? fs.createReadStream(data) : data,
    });
    return r.$metadata.httpStatusCode === 200;
  } catch (e) {
    console.error("putS3Object", e);
    return false;
  }
}

export async function getS3Object(s3: S3, email: string, fileName: string) {
  return await s3.getObject({
    Bucket: bucketName,
    Key: getBucketKey(email, fileName),
  });
}

export async function getAttachmentSize(email: string, fileName: string) {
  const s3 = openS3();
  const res = await s3.headObject({
    Bucket: bucketName,
    Key: getBucketKey(email, fileName),
  });
  closeS3(s3);
  return res.ContentLength || 0;
}

export async function getAttachmentObject(email: string, fileName: string) {
  const s3 = openS3();
  const res = await getS3Object(s3, email, fileName);
  return {
    s3Object: res,
    s3Close: () => closeS3(s3),
  };
}
