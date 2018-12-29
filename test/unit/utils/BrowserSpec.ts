import {error, ThenableWebDriver} from "selenium-webdriver";
import {Browser, WebComponent} from "../../../src/lib/utils";
import {join, posix} from "path";
import {config} from "../../../main";
import {Chrome} from "../../../src/lib/utils/browsers/chrome";
import {expect, should} from 'chai';

describe("Browser Tests", function () {
    let browser: Browser;
    let driver: ThenableWebDriver;
    const loginPage: string = `file:///${join(process.cwd(), "test", "unit", "testPages", "login_page.html")}`;
    const emptyPage: string = `file:///${join(process.cwd(), "test", "unit", "testPages", "empty.html")}`;

    this.timeout(config.timeout);

    before(async function () {
        browser = new Chrome();
        driver = browser.driver;
        should();
    });

    it('navigate should work on local files', async function () {
        const expectedURL: string = `file:///${loginPage}`.replace(/\\/g, posix.sep);
        await browser.navigate(expectedURL);
        expect(await driver.getCurrentUrl()).to.equal(expectedURL);
    });

    it("findElement should work with a CSS selector", async function () {
        await browser.navigate(loginPage);
        const body: WebComponent = await browser.findElement('body');
        expect(await body.getElementAttribute("data-pagetype")).to.equal("Login");
    });

    it("findElement should work with an XPath selector", async function () {
        await browser.navigate(loginPage);
        const body: WebComponent = await browser.findElement('//button[text()="Log On"]');
        expect(await body.getText()).to.equal("Log On");
    });

    it("findElement should throw on element that is not present", async function () {
        await browser.navigate(emptyPage);
        try {
            await browser.findElement('div.slfjksdlfdsj');
        } catch (err) {
            expect(err).to.be.instanceof(error.NoSuchElementError);
        }
    });

    after(async () => {
        await browser.quit();
    });
});
