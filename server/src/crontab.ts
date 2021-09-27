import { CronJob } from "cron";
import { dirDump, dirMailSource, dirTempFiles } from "./constants";
import { execCommand } from "./utils";
import { format } from "date-fns";

//const { readdir: dirAsync, stat: statAsync, unlink: unlinkAsync } = fs.promises;

//   const dirDump = '/usr/local/www/data/dump/';
//   await execCommand(`pg_dump --format=custom --username=postgres sites --file=${dirDump}backup_all_${moment().format('YYYY-MM-DD_HH-mm-ss')}.dump`);
// https://crontab.guru/examples.html

// npx ts-node server/src/crontab.ts

(async function () {
  if (require.main !== module) return;
  await everyDay();
  process.exit();
})();

const job = new CronJob(
  // https://crontab.guru/examples.html
  "0 0 */12 * * *",
  //"0 1 * * * *",
  everyDay,
  null,
  true,
  "Europe/Moscow",
);

async function everyDay() {
  console.log("CronJob", new Date().toJSON());
  // find /home/centos/app/temp/ -type f -mtime +1 -delete

  // pg_dump --format=custom --username=postgres --no-owner --schema=emails sites --file=/usr/local/www/data/dump/db-emails-full.dump
  // pg_restore --clean --format=custom --username=centos --dbname=sites --no-owner --role=centos --if-exists /home/centos/app/dump/db-emails-full.dump

  const dumpParams = [
    "pg_dump",
    "--format=custom",
    "--username=centos",
    "--no-owner",
    "--schema=emails",
    "sites",
    `--file=${dirDump}db-emails-full_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.dump`,
  ];
  await execCommand(dumpParams.join(" "));

  // find /home/centos/app/data/mail-source/ -type f -ctime +5 -delete

  // удаляем оригиналы писем
  await execCommand(`find ${dirMailSource} -type f -ctime +5 -delete`);
  // удаляем временные файлы вложений
  await execCommand(`find ${dirTempFiles} -type f -ctime +1 -delete`);
  // удаляем старые dump
  await execCommand(`find ${dirDump} -type f -ctime +7 -delete`);
  // /home/centos/app/dump
}

job.start();

function closeCron() {
  job.stop();
  console.log("cron stop");
}

process.on("SIGINT", () => closeCron);
