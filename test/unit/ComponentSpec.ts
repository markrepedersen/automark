import {ThenableWebDriver} from "selenium-webdriver";
import {join} from "path";
import {Browser, WebComponent} from "../../src/lib/utils";
import {config} from "../../main";
import {Chrome} from "../../src/lib/utils/browsers/chrome";
import {expect} from 'chai';

describe("Test suite for components", function () {
    let browser: Browser;
    let driver: ThenableWebDriver;
    const importPage: string = join(process.cwd(), "test", "unit", "testPages", "importNew.html");

    this.timeout(config.timeout);


    before(async function () {
        browser = new Chrome();
        driver = browser.driver;
    });

    after(async () => {
        await browser.quit();
    });

    it('getZIndex() should output the element\'s current z-index', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const index: number = await importOptionDialog.getZIndex();
        expect(index).to.equal(240);
    });

    it('hasStyle should return true if element has styles', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasStyle: boolean = await importOptionDialog.hasStyle('visibility: visible;', 'position: absolute;');
        expect(hasStyle).to.be.true;
    });

    it('hasStyle should return false if element does not have styles', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasStyle: boolean = await importOptionDialog.hasStyle('visibility: not visible;', 'position: not absolute;');
        expect(hasStyle).to.be.false;
    });

    it('hasAttribute should return true if element has attribute', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasAttribute: boolean = await importOptionDialog.hasAttribute('style', 'class');
        expect(hasAttribute).to.be.true;
    });

    it('hasAttribute should return false if element does not have attributes', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasAttribute: boolean = await importOptionDialog.hasAttribute('stlye', 'clurss');
        expect(hasAttribute).to.be.false;
    });

    it('hasClass should return true if element has class', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasClass: boolean = await importOptionDialog.hasClass('sapUiPopupWithPadding', 'sapUiShd');
        expect(hasClass).to.be.true;
    });

    it('hasClass should return false if element has classes', async function () {
        await browser.navigate(importPage);
        const importOptionDialog: WebComponent = await browser.findElement('div.fpaCenterImportOptionDialog');
        const hasClass: boolean = await importOptionDialog.hasClass('asdfsaf', 'uretyert');
        expect(hasClass).to.be.false;
    });
});