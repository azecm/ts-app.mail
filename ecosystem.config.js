//  /usr/local/www/app.nestjs/node_modules/.bin/ts-node-dev -r tsconfig-paths/register /usr/local/www/app.nestjs/src/main.ts

// pm2 start ecosystem.config.js --only app-mail

// pm2 start ./node_modules/.bin/ts-node -- -P server/tsconfig.json ./server/src/server.ts
// pm2 start ts-node -P server/tsconfig.json ./server/src/server.ts

//"name": "app-name",
//             "script": "/usr/local/lib/node_modules/pm2/node_modules/.bin/ts-node",
//             "args":"-r ../node_modules/tsconfig-paths/register ./start.ts",

module.exports = {
  apps: [
    {
      name: "app-mail",
      //cwd: "./server/src/",
      script: "./server/src/server.ts",
      //interpreter: "ts-node",
      //interpreter: "./node_modules/.bin/ts-node",
      interpreter: "./node_modules/ts-node/dist/bin.js",
      interpreter_args: [
        //"--",
        "-P",
        "./server/tsconfig.json",
        //"-r",
        //"dotenv/config",
        //"-r",
        //"./ts-hook.js",
        //"-r",
        //"tsconfig-paths/register",
      ],
      env: {
        //NODE_ENV: "development"
        NODE_ENV: "production",
        //TZ: "America/Los_Angeles"
      },
      restart_delay: 500,
      //--restart-delay <delay in ms>
      //kill_timeout : 3000,

      //log_date_format: '', //“YYYY-MM-DD HH:mm Z”
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      retain: 7,
      time: true, // Prefix logs with time
      error_file: "./logs/errors.log",
      out_file: "./logs/access.log",
    },
  ],
};
