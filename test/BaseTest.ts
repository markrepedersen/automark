import {writeFileSync} from "fs";
import {isUndefined} from "lodash";
import {relative, resolve} from "path";
import {logging} from "selenium-webdriver";
import {Browser, getDecoratedProperties} from "../src/lib/utils";
import {BrowserFactory} from "../src/lib/utils/browsers/BrowserFactory";

/**
 * Each spec should extend this abstract class. This handles all of the necessary components for an E2E automation test suite
 * such as creating the browser and error handling like taking screenshots.
 */
export abstract class BaseTest {
    protected readonly name: string = (this as any).testSuiteName;

    protected readonly browserType: 'chrome' | 'edge' = (this as any).testBrowserType || 'chrome';

    protected readonly testTimeout: number = (this as any).testTimeout || 0;

    protected readonly keepBrowserOpen: number = (this as any).keepBrowserOpen || false;

    public browser!: Browser;

    /**
     * Runs a suite of tests. Call this method to run all methods decorated by "@test".
     * If wanting to run only a single test in the suite, decorate the method with
     * @test({
     *  message: "some message",
     *  only: true
     * }).
     */
    public run(): void {
        const self = this;
        const runnableTests: Array<Function> = getDecoratedProperties(Object.getPrototypeOf(self), 'test');

        describe(this.name, async function () {
            this.timeout(self.testTimeout);

            before(async function () {
                await setUp();
                await self.hook(getHook('before'));
            });

            beforeEach(async function () {
                await setUp();
                await self.hook(getHook('beforeEach'));
            });

            afterEach(async function () {
                if (this.currentTest.state != 'passed' || this.currentTest.timedOut) {
                    const name: string = `${self.getFilename()}_${this.currentTest.fullTitle()}`;
                    await self.screenshot(name);
                    await self.saveBrowserLogs(name);
                }
                await self.hook(getHook('afterEach'));
                await cleanUp();
            });

            after(async function () {
                await self.hook(getHook('after'));
                await cleanUp();
            });

            function getHook(hook: 'after' | 'afterEach' | 'before' | 'beforeEach'): Function {
                const afterHook: Array<Function> = getDecoratedProperties(Object.getPrototypeOf(self), hook);
                if (afterHook.length > 1) {
                    throw new Error('There can only be one hook of each kind.');
                }
                return afterHook[0];
            }

            async function setUp(): Promise<void> {
                if (!self.browser || !self.browser.valid) {
                    self.browser = BrowserFactory.create(self.browserType);
                }
            }

            async function cleanUp(): Promise<void> {
                if (self.browser && self.browser.valid) {
                    if (!self.keepBrowserOpen) {
                        await self.browser.quit();
                    } else self.browser.valid = false;
                }
            }

            function runTest(test: any): void {
                (test.only ? it.only : it)(test.message, async function () {
                    this.timeout(test.timeout || self.testTimeout);
                    await test.apply(self);
                });
            }

            runnableTests.forEach((test: any) => runTest(test));
        });
    }

    /**
     * Take a screenshot.
     * @param filename
     */
    protected async screenshot(filename: string): Promise<void> {
        if (this.browser && this.browser.valid) {
            await this.browser.takeScreenshot(`${filename}.png`);
        }
    }

    /**
     * Wraps a function to take screenshot on fail.
     * @param f : function to be wrapped
     */
    private async hook(f: Function): Promise<void> {
        try {
            await f.apply(this);
        } catch (e) {
            await this.screenshot(`${this.getFilename()}_${f.name}`);
            throw e;
        }
    }

    /**
     * Capture browser logs.
     * @param fileName Optional
     */
    private async saveBrowserLogs(fileName: string): Promise<void> {
        const logEntries: logging.Entry[] = await this.browser.getLogs(logging.Type.BROWSER);
        let logs: string = "";
        logEntries.forEach((entry: logging.Entry) => {
            logs = logs.concat(`[${entry.level}]: ${entry.message}\n`);
        });
        writeFileSync(`${fileName}.log`, logs);
    }

    /**
     * Gets the current filename of the test class.
     */
    private getFilename(): string {
        const path: string = (this as any).filename;
        if (isUndefined(path)) {
            throw new Error('"@testable" was not found on your testing class.');
        }
        return resolve('test', 'results', relative(process.cwd(), path));
    }
}
