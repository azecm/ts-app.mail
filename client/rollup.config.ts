import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import url from "@rollup/plugin-url";
import svgr from "@svgr/rollup";
import { terser } from "rollup-plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
//import gql from "rollup-plugin-graphql-tag";

//const gql = require("rollup-plugin-graphql-tag");

// https://github.com/alexjoverm/typescript-library-starter/blob/master/rollup.config.ts

// npx rollup -c front/rollup.config.ts

// https://www.npmjs.com/package/rollup-plugin-sourcemaps

const production = !process.env.ROLLUP_WATCH;

const buildDir = "../client-build";

export default {
  input: "src/index.tsx",
  context: "window",
  output: {
    dir: buildDir,
    format: "esm", // cjs
    sourcemap: true,
  },
  plugins: [
    url(),
    svgr({
      //plugins:{
      //    removeViewBox: false
      //}
    }),
    replace({
      preventAssignment: false,
      "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
    }),
    resolve({
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    //gql(),
    typescript({ tsconfig: "tsconfig" + "." + "json" }),
    // ===
    production &&
      terser({
        toplevel: true,
        compress: {
          passes: 2,
        },
      }),

    visualizer({
      filename: buildDir + "/stats.html",
    }),
  ],
};
