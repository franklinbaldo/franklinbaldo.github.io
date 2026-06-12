import fs from "fs";
import { spawnSync } from "child_process";
const argsObj = JSON.parse(fs.readFileSync("temp_decide_args.json", "utf-8"));
const decideArgs = [
  "run",
  "hronir:decide",
  "--",
  "--after-mood",
  argsObj.afterMood,
  "--rate-a",
  argsObj.rateA,
  "--rate-b",
  argsObj.rateB,
  "--review-a",
  argsObj.reviewA,
  "--review-b",
  argsObj.reviewB,
  "--clash",
  argsObj.clash,
];
spawnSync("npm", decideArgs, { stdio: "inherit", shell: false });
