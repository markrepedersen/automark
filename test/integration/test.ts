import {error, ThenableWebDriver} from "selenium-webdriver";
import {join, posix} from "path";
import {expect, should} from "chai";
import {Browser} from "../../src/lib/utils/browsers/browser";
import {Chrome} from "../../src/lib/utils/browsers/chrome";
import {WebComponent} from "../../src/lib/utils/components/WebComponent";
import {config} from "../../main";

describe("Browser Tests", function () {
  let browser: Browser;
  let driver: ThenableWebDriver;

  this.timeout(config.timeout);

  before(async function () {
    browser = new Chrome();
    driver = browser.driver;
    should();
  });

  it.only("Facebook", async function () {
    await browser.navigate("https://www.facebook.com/");
  });

  after(async () => {
    await browser.quit();
  });
});
