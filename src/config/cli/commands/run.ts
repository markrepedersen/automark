import {cpus} from "os";

export const builder: any = {
  url: {
    describe: "The URL to send to the driver.",
    demandOption: false,
    string: true,
    nargs: 1,
    alias: "u",
  },
  reverseProxy: {
    describe: "Specify this option if the website is behind a reverse proxy.",
    demandOption: false,
    string: true,
    nargs: 1,
    alias: "rp",
  },
  username: {
    describe: "The username to use when logging in.",
    demandOption: false,
    string: true,
    nargs: 1,
    alias: "U",
  },
  password: {
    describe: "The password to use when logging in.",
    demandOption: false,
    string: true,
    nargs: 1,
    alias: "P",
  },
  files: {
    describe: "The test files to run.",
    demandOption: false,
    array: true,
    alias: "f",
  },
  ignore: {
    describe: "The test files to exclude.",
    demandOption: false,
    array: true,
    alias: "i",
  },
  directories: {
    describe: `The test directories within which the program will search for <include> test files. 
If <include is not specified, then this will include all files within this directory recursively.`,
    demandOption: false,
    array: true,
    alias: "d",
  },
  ignoreDirectories: {
    describe: "The test directories to exclude.",
    demandOption: false,
    array: true,
    alias: "id",
  },
  recursive: {
    describe: "Whether to search in subdirectories or not. Default is true.",
    default: true,
    demandOption: false,
    boolean: true,
    alias: "r",
  },
  verbose: {
    describe:
      "Output console logs that describe which class and method are currently being executed.",
    default: false,
    demandOption: false,
    boolean: true,
    alias: "v",
  },
  processCount: {
    describe:
      "The number of processes to use. By default this will use the number of cpu cores available on the os.",
    default: cpus().length,
    demandOption: false,
    number: true,
    nargs: 1,
    alias: "pc",
  },
  timeout: {
    describe: "The amount of time to wait for a test to timeout.",
    default: 325000,
    demandOption: false,
    number: true,
    nargs: 1,
    alias: "t",
  },
  headless: {
    describe:
      "This option will run the tests with the browser(s) running in the background.",
    demandOption: false,
    boolean: true,
    alias: "H",
  },
  screenWidth: {
    describe: "The width of the browser screen.",
    default: 1904,
    demandOption: false,
    number: true,
    nargs: 1,
    alias: "W",
  },
  screenHeight: {
    describe: "The height of the browser screen.",
    default: 1190,
    demandOption: false,
    number: true,
    nargs: 1,
    alias: "H",
  },
  maximized: {
    describe: "Whether to maximize the browser screen on test initialization.",
    demandOption: false,
    boolean: true,
    alias: "M",
  },
  retries: {
    describe: "The number of retries to use when a failed test occurs.",
    default: 0,
    demandOption: false,
    number: true,
    nargs: 1,
    alias: "R",
  },
  loadTime: {
    describe:
      "Increasing this will increase the wait time before executing any functions.",
    default: 200,
    demandOption: false,
    number: true,
    nargs: 1,
  },
  buildHelperId: {
    number: true,
    default: 0,
    hidden: true,
    nargs: 1,
  },
  helperCount: {
    number: true,
    default: 1,
    hidden: true,
    nargs: 1,
  },
};
