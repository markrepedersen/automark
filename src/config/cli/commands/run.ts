import {cpus} from "os";

export const builder: any = {
  url: {
    describe: "The URL to send to the driver.",
    demandOption: true,
    string: true,
    nargs: 1,
  },
  reverseProxy: {
    describe: "Specify this option if the website is behind a reverse proxy.",
    demandOption: false,
    string: true,
    nargs: 1,
  },
  username: {
    describe: "The username to use when logging in.",
    demandOption: false,
    string: true,
    nargs: 1,
  },
  password: {
    describe: "The password to use when logging in.",
    demandOption: false,
    string: true,
    nargs: 1,
  },
  files: {
    describe: "The test files to run.",
    demandOption: false,
    array: true,
  },
  ignore: {
    describe: "The test files to exclude.",
    demandOption: false,
    array: true,
  },
  directories: {
    describe: `The test directories within which the program will search for <include> test files. 
				   If <include is not specified, then this will include all files within this directory, non-recursively. 
			       If recursive is desired, add <recursive=true>.`,
    demandOption: true,
    array: true,
  },
  ignoreDirectories: {
    describe: "The test directories to exclude.",
    demandOption: false,
    array: true,
  },
  recursive: {
    describe: "Whether to search in subdirectories or not. Default is true.",
    default: true,
    demandOption: false,
    boolean: true,
  },
  verbose: {
    describe:
      "Output console logs that describe which class and method are currently being executed.",
    default: false,
    demandOption: false,
    boolean: true,
  },
  processCount: {
    describe:
      "The number of processes to use. By default this will use the number of cpu cores available on the os.",
    default: cpus().length,
    demandOption: false,
    number: true,
    nargs: 1,
  },
  timeout: {
    describe: "The amount of time to wait for a test to timeout.",
    default: 325000,
    demandOption: false,
    number: true,
    nargs: 1,
  },
  headless: {
    describe:
      "This option will run the tests with the browser(s) running in the background.",
    demandOption: false,
    boolean: true,
  },
  screenWidth: {
    describe: "The width of the browser screen.",
    default: 1904,
    demandOption: false,
    number: true,
    nargs: 1,
  },
  screenHeight: {
    describe: "The height of the browser screen.",
    default: 1190,
    demandOption: false,
    number: true,
    nargs: 1,
  },
  maximized: {
    describe: "Whether to maximize the browser screen on test initialization.",
    demandOption: false,
    boolean: true,
  },
  retries: {
    describe: "The number of retries to use when a failed test occurs.",
    default: 0,
    demandOption: false,
    number: true,
    nargs: 1,
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
