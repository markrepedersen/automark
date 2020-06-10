import {should} from "chai";
import {Browser} from "../../src/lib/utils/browsers/browser";
import {Chrome} from "../../src/lib/utils/browsers/chrome";
import {FacebookLoginPage} from "../../src/pages/FacebookLoginPage";
import {FacebookHomePage} from "../../src/pages/FacebookHomePage";

describe("Browser Tests", function () {
  let browser: Browser;

  this.timeout(400000);

  before(async function () {
    browser = new Chrome({maximized: true, headless: false});
    should();
  });

  it.only("Facebook", async function () {
    const loginPage: FacebookLoginPage = new FacebookLoginPage(browser);
    await browser.navigate(FacebookLoginPage.URL);
    await browser.waitUntilPageHasLoaded(FacebookLoginPage);
    await loginPage.login("username", "pw");
    await browser.waitUntilPageHasLoaded(FacebookHomePage);
  });

  after(async () => await browser.quit());
});
