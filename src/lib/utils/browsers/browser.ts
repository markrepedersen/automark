import {
  Alert,
  Builder,
  Capabilities,
  error,
  IKey,
  Key,
  logging,
  ThenableWebDriver,
  WebElement,
} from "selenium-webdriver";
import {
  elementDoesNotExist,
  elementIsClickable,
  elementIsNotVisible,
  elementIsVisible,
  pageHasLoaded,
  WaitCondition,
} from "../conditions";
import {Options} from "selenium-webdriver/chrome";
import {Validatable, Validator} from "../../validators/Validator";
import {AwaitableWebComponent, Button, WebComponent} from "..";
import {retry} from "../decorators/retry";
import Logger from "../logger";
import {NewablePage, Page} from "../../../pages/page";
import {writeFileSync} from "fs";
import Level = logging.Level;
import Preferences = logging.Preferences;
import Type = logging.Type;
import NoSuchAlertError = error.NoSuchAlertError;

/**
 * This class is a wrapper for the built-in selenium web driver.
 */
export abstract class Browser {
  public headless: boolean = false;

  public maximized: boolean = true;

  public width: number = 1190;

  public height: number = 1904;

  public readonly driver: ThenableWebDriver;

  public readonly logger: Logger;

  protected readonly validators: Array<Validator> = [];

  protected isValid: boolean = false;

  protected load: number = 0;

  /**
   * Creates a new {@class Browser} object. This constructor will
   * configure all settings to be used in the session.
   * @param {string} type
   * @param {any} options
   */
  public constructor(type: BrowserTypes, options?: BrowserOptions) {
    this.driver = new Builder()
      .forBrowser(type)
      .withCapabilities(this.setBrowserCapabilities(options))
      .build();
    this.logger = new Logger(this.driver);
    this.valid = true;
  }

  public get loadTime() {
    return this.load;
  }

  public set loadTime(loadTime: number) {
    this.load = loadTime;
  }

  /**
     * Register a handler to check for behaviour on a web page.
     *
     * Validators can be used before a test to check if conditions appear.
     * @param handler will be used to validate for conditions to appear on the screen.

     * This is useful if certain tests expect behaviour to happen. In which case, one can
     * register a validator before the test to check for this behaviour.

     * The handler can either be a {@class Validator} or a function that returns a boolean.
     *
     * @param handler The handler to use to check for behaviour.
     */
  public registerValidator(handler: Handler): void {
    if (handler instanceof Function) {
      const validator = class extends Validator {
        public async validate(stack?: any): Promise<any> {
          return (handler as Function)();
        }
      };
      this.validators.push(new validator(this));
    } else this.validators.push(handler);
  }

  public get handlers(): Array<Validator> {
    return this.validators;
  }

  /**
   * Wait for any one of a list of conditions to be met
   * This will also do a check if an error is seen on the screen while waiting
   *
   * Note: While waiting, any errors will be suppressed. If using a custom function, make sure
   * that it works. Otherwise, any of its errors will be suppressed and this method will wait
   * forever.
   *
   * @param {WaitCondition | WaitCondition[]} conditions
   * @returns {Promise<void>}
   */
  public async waitForAny(...conditions: WaitCondition[]): Promise<void> {
    await this.driver.wait(async () => {
      for (const condition of conditions) {
        try {
          if ((await condition(this)) === true) {
            return true;
          }
        } catch (exception) {
        } finally {
          for (const validator of this.handlers) {
            await validator.validate(new Error().stack);
          }
        }
      }
    });
  }

  /**
   * A browser is valid iff it has not been quit.
   */
  public get valid(): boolean {
    return this.isValid;
  }

  public set valid(valid: boolean) {
    this.isValid = valid;
  }

  /**
   * Gets the current URL.
   */
  public async getCurrentUrl(): Promise<string> {
    return this.driver.getCurrentUrl();
  }

  /**
   * Waits for the current URL to contain {@param value}.
   * @param value
   */
  public async waitForUrlToContainValue(value: string): Promise<void> {
    await this.waitFor(async () =>
      (await this.getCurrentUrl()).includes(value)
    );
  }

  /**
   * Waits for the current URL to NOT contain {@param value}.
   * @param value
   */
  public async waitForUrlToNotContainValue(value: string): Promise<void> {
    await this.waitFor(
      async () => !(await this.getCurrentUrl()).includes(value)
    );
  }

  /**
   * Creates a new tab and sets focus on it instead of the current tab.
   * @param url The new url to which to navigate on the new tab.
   */
  public async newTab(url?: string): Promise<void> {
    await this.driver.executeScript("window.open()");
    const tabs: Array<string> = await this.driver.getAllWindowHandles();
    await this.driver.switchTo().window(tabs[tabs.length - 1]);
    if (url) {
      await this.navigate(url);
    }
  }

  /**
   * Opens a new tab, navigates to the chrome settings page, and clears the chrome browser cache, then closes the newly opened tab.
   * This can be used as a reliable logout, since this will log a user out of any signed in applications.
   */
  public async clearChromeCache(): Promise<void> {
    await this.newTab("chrome://settings/clearBrowserData");
    const clearCacheButton: Button = await this.waitUntilClickable(() =>
      this.findElement("* /deep/ #clearBrowsingDataConfirm")
    );
    await clearCacheButton.click();
    await this.waitUntilAppearanceAndDisappearanceOfElement(
      "* /deep/ #spinnerContainer.active"
    );
    await this.close();
    const tabs: Array<string> = await this.driver.getAllWindowHandles();
    await this.driver.switchTo().window(tabs[0]);
  }

  /**
   * Sets browser options.
   * Port 0 is special in that it means that the OS will assign a random, unused port
   * for this session.
   * @returns {Capabilities}
   */
  private setBrowserCapabilities(options?: BrowserOptions): Capabilities {
    const browserArguments: Array<string> = this.getBrowserArguments(options);
    const perfLoggingPrefs: any = {enableNetwork: true};
    return new Options()
      .addArguments(...browserArguments)
      .setLoggingPrefs(Browser.setPerformanceLogging())
      .setPerfLoggingPrefs(perfLoggingPrefs)
      .toCapabilities();
  }

  /**
   * Retrieve the arguments to be passed to the driver.
   * @returns {Array<string>}
   */
  private getBrowserArguments(options?: BrowserOptions): Array<string> {
    const args: Array<string> = [];
    if (options?.exit) {
      process.on("beforeExit", async () => {
        await this.quit();
        process.exit(0);
      });
    }
    if (options?.maximized) {
      console.log("[INFO] Maximizing screen.");
      args.push("start-maximized");
    } else {
      console.log(
        `[INFO] Using screen resolution of ${this.width}x${this.height}.`
      );
      args.push(`window-size=${this.width},${this.height}`);
    }
    if (options?.headless) {
      args.push("headless");
    }
    args.push("port=0");
    args.push("disable-infobars"); // disabling infobars
    args.push("--disable-extensions"); // disabling extensions
    args.push("--disable-notifications"); // disable notifications
    args.push("--disable-gpu"); // applicable to windows os only
    args.push("--disable-dev-shm-usage"); // overcome limited resource problems
    args.push("--no-sandbox"); // Bypass OS security model
    return args;
  }

  /**
   * This will be useful later on when the chrome logs will
   * be used to detect when page loads happen
   * @returns {logging.Preferences}
   */
  private static setPerformanceLogging(): logging.Preferences {
    const loggingPreferences: logging.Preferences = new Preferences();
    loggingPreferences.setLevel(Type.PERFORMANCE, Level.ALL);
    return loggingPreferences;
  }

  /**
   * Navigate to the specified URL.
   * @param {string} url
   */
  public async navigate(url: string): Promise<void> {
    await this.driver.navigate().to(url);
    if (await this.hasAlert()) {
      await this.acceptAlert();
    }
  }

  /**
   * Take a screenshot of the current screen.
   * If filename is provided, then this method will save the resulting screenshot to a file with name {@param filename}
   * and return undefined.
   * Otherwise, this method will return the screenshot as a buffer.
   * @param {string} filename
   * @returns {Promise<void>}
   */
  @retry()
  public async takeScreenshot(filename?: string): Promise<any> {
    const base64Img: string = await this.driver.takeScreenshot();
    if (filename) {
      return (await writeFileSync(filename, base64Img, "base64")) as undefined;
    }
    return Buffer.from(base64Img, "base64") as Buffer;
  }

  /**
   * Retrieves the browser console's logs.
   * @param {string} logType
   * @returns {Promise<logging.Entry[]>}
   */
  public async getLogs(logType: string): Promise<logging.Entry[]> {
    return this.driver.manage().logs().get(logType);
  }

  /**
   * Waits until {@param page} has finished loading.
   * @param {NewablePage<T>} page
   * @returns {Promise<void>}
   */
  public async waitUntilPageHasLoaded<T extends Page>(
    page: NewablePage<T>
  ): Promise<T> {
    await this.waitFor(pageHasLoaded(page));
    return new page(this);
  }

  /**
   * Waits until any of {@param pages} has finished loading.
   * @param pages
   */
  public async waitUntilAnyPageHasLoaded<T extends Page>(
    ...pages: NewablePage<T>[]
  ): Promise<void> {
    await this.waitForAny(
      ...pages.map((page: NewablePage<T>) => pageHasLoaded(page))
    );
  }

  /**
   * Finds an element if it exists.
   * @throws error if element is not found
   * @param {T extends WebComponent} ComponentType The type of the found element.
   * @param {string} selector : the CSS of the element
   * @returns {WebComponent}
   */
  public async findElement<T extends WebComponent>(
    selector: string,
    ComponentType?: {
      new (
        element: WebElement,
        selector: string,
        parentElement?: WebElement,
        ...args: any[]
      ): T;
    }
  ): Promise<T> {
    const element: WebElement = await this.driver.findElement(
      WebComponent.convertSelector(selector)
    );
    return ComponentType
      ? new ComponentType(element, selector)
      : (new WebComponent(element, selector) as T);
  }

  /**
   * Find a series of elements identified by either an XPath or CSS selector.
   * @param {T extends WebComponent} ComponentType : If this is included, then all elements will be of this type.
   * @param {string} selector
   * @returns {Array<WebComponent>}
   */
  public async findElements<T extends WebComponent>(
    selector: string,
    ComponentType?: {
      new (
        element: WebElement,
        selector: string,
        parentElement?: WebElement,
        ...args: any[]
      ): T;
    }
  ): Promise<Array<T>> {
    return (
      await this.driver.findElements(WebComponent.convertSelector(selector))
    ).map((element: WebElement) =>
      ComponentType
        ? new ComponentType(element, selector)
        : (new WebComponent(element, selector) as T)
    );
  }

  /**
   * Check if an element exists in the DOM or not.
   * @param {string} selector
   * @returns {Promise<boolean>}
   */
  public async exists<T extends WebComponent>(
    selector: string
  ): Promise<boolean> {
    const elements: T[] = await this.findElements<T>(selector);
    return elements.length !== 0;
  }

  /**
   * Clear all cookies in the session.
   * @param {string} url
   * @returns {Promise<void>}
   */
  public async clearCookies(url?: string): Promise<void> {
    if (url) {
      const currentUrl: string = await this.driver.getCurrentUrl();
      await this.navigate(url);
      await this.driver.manage().deleteAllCookies();
      await this.navigate(currentUrl);
    } else {
      await this.driver.manage().deleteAllCookies();
      this.driver.actions();
    }
  }

  /**
   * Type words or special key press globally, typing into any currently focused element, if any
   * @param {string} words : the phrase to type
   * @returns {Promise<void>}
   */
  public async typeToFocusedElement(
    ...words: Array<string | IKey>
  ): Promise<void> {
    await this.driver
      .actions()
      .sendKeys(Key.chord(...words))
      .perform();
  }

  /**
   * Waits for an element to disappear. If {@parent} is supplied, then performs the search under
   * parent only.
   * @param {string} selector
   * @param {string} parent
   * @returns {Promise<void>}
   */
  public async waitUntilElementDisappears(
    selector: string,
    parent?: string
  ): Promise<void> {
    const locator: string = parent ? `${parent} ${selector}` : selector;
    const exists: boolean = await this.exists(locator);
    if (exists) {
      await this.waitUntilElementIsNotVisible(() => this.findElement(locator));
    }
  }

  /**
   * Waits for the appearance of a web element and then its subsequent disappearance.
   * In some cases there could be multiple of these elements. In this case, use {@param parent} to only
   * search within the parent element for the element.
   * @param {string} selector
   * @param {string} parent
   * @returns {Promise<void>}
   */
  public async waitUntilAppearanceAndDisappearanceOfElement(
    selector: string,
    parent?: string
  ): Promise<void> {
    const locator: string = parent ? `${parent} ${selector}` : selector;
    await this.waitUntilElementIsVisible(() => this.findElement(locator));
    await this.waitUntilElementDisappears(locator);
  }

  /**
   * Waits for element found by {@param lowerZIndex} to be the web element with the highest z index.
   * For example, if there are two overlaid dialogs on the screen, then the top-most dialog has the highest z index.
   * @param {string} lowerZIndex
   * @param {string} higherZIndex
   * @returns {Promise<void>}
   */
  public async waitForElementToBeOnTop<T extends WebComponent>(
    lowerZIndex: string,
    higherZIndex: string
  ): Promise<void> {
    await this.waitFor(async () => {
      const element1: T = await this.findElement<T>(lowerZIndex);
      const element2: T = await this.findElement<T>(higherZIndex);

      const element1ZIndex: number = await element1.getZIndex();
      const element2ZIndex: number = await element2.getZIndex();
      return element1ZIndex >= element2ZIndex;
    });
  }

  /**
   * Waits for element located by {@param elementSelector} to have attributes {@param attributes}.
   * @param elementSelector
   * @param attributes
   */
  public async waitForElementToHaveAttributes(
    elementSelector: string,
    ...attributes: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return await element.hasAttribute(...attributes);
    });
  }

  /**
   * Waits for element located by {@param elementSelector} to not have attributes {@param attributes}.
   * @param elementSelector
   * @param attributes
   */
  public async waitForElementToNotHaveAttributes(
    elementSelector: string,
    ...attributes: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return !(await element.hasAttribute(...attributes));
    });
  }

  /**
   * Waits for an element to have a class.
   * @param elementSelector
   * @param classes
   */
  public async waitForElementToHaveClass(
    elementSelector: string,
    ...classes: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return await element.hasClass(...classes);
    });
  }

  /**
   * Waits for an element to not have a class.
   * @param elementSelector
   * @param classes
   */
  public async waitForElementToNotHaveClass(
    elementSelector: string,
    ...classes: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return !(await element.hasClass(...classes));
    });
  }

  /**
   * Waits for an element to not have a styles.
   * @param elementSelector
   * @param styles
   */
  public async waitForElementToNotHaveStyle(
    elementSelector: string,
    ...styles: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return !(await element.hasStyle(...styles));
    });
  }

  /**
   * Waits for an element to have a styles.
   * @param elementSelector
   * @param styles
   */
  public async waitForElementToHaveStyle(
    elementSelector: string,
    ...styles: string[]
  ): Promise<void> {
    await this.waitFor(async () => {
      const element: WebComponent = await this.findElement(elementSelector);
      return await element.hasStyle(...styles);
    });
  }

  /**
   * Waits for a locator and returns the first value that meets the condition
   * @param {string} locator
   * @param ComponentType?: {new(element: WebElementPromise, selector: string, ...args: any[]): T}
   * @returns {Promise<WebComponent>} an element that meets the condition or false if none found
   */
  public async waitForElementToAppear<T extends WebComponent>(
    locator: string,
    ComponentType?: {
      new (element: WebElement, selector: string, ...args: any[]): T;
    }
  ): Promise<T> {
    await this.waitUntilElementIsVisible(() => this.findElement(locator));
    return ((await this.findElements<T>(locator, ComponentType)) as T[])[0];
  }

  /**
   * Waits for a locator and returns all values that meets the condition
   * @param {string} locator
   * @param ComponentType?: {new(element: WebElementPromise, selector: string, ...args: any[]): T}
   * @returns {Promise<Array<WebComponent>>} elements that meets the condition or false if none found
   */
  public async waitForElements<T extends WebComponent>(
    locator: string,
    ComponentType?: {
      new (element: WebElement, selector: string, ...args: any[]): T;
    }
  ): Promise<Array<T>> {
    await this.waitUntilElementIsVisible(() => this.findElement(locator));
    return (await this.findElements<T>(locator, ComponentType)) as T[];
  }

  /**
   * Waits for any element found in list of locators : {@param locators}
   * @param {string} locators
   * @returns {Promise<WebComponent>}
   */
  public async waitForAnyElementToBeVisible<T extends WebComponent>(
    ...locators: string[]
  ): Promise<T | undefined> {
    const conditions: WaitCondition[] = locators.map((locator) =>
      elementIsVisible(() => this.findElement(locator))
    );
    await this.waitForAny(...conditions);
    return await this.findAny<T>(...locators);
  }

  /**
   * Find any of the elements defined by {@param locators}
   * If none are found, return undefined
   * @param {string} locators
   * @returns {Promise<WebComponent>}
   */
  public async findAny<T extends WebComponent>(
    ...locators: string[]
  ): Promise<T | undefined> {
    const elements: Promise<T>[] = Array.from(locators).map((locator) =>
      this.findElement(locator)
    );
    return await this.asyncFind(elements);
  }

  /**
   * Wait for an element, identified by some text.
   * @param {string} text
   */
  public async waitForElementWithText<T extends WebComponent>(
    text: string
  ): Promise<T> {
    const selector: string = `//*[text()="${text}"]`;
    return await this.waitForElementToAppear<T>(selector);
  }

  /**
   * Waits until element found from {@param clickable} is clickable.
   * An element is clickable if it has not been deleted and if it
   * is visible on the screen.
   * @param {() => WebComponent} clickable
   * @returns {Promise<void>}
   */
  public async waitUntilClickable<T extends WebComponent>(
    clickable: () => AwaitableWebComponent<T>
  ): Promise<AwaitableWebComponent<T>> {
    await this.waitFor(elementIsClickable(clickable));
    return clickable();
  }

  /**
   * Waits until element found from {@param stale} is stale.
   * @param {() => WebComponent} stale
   * @returns {Promise<void>}
   */
  public async waitUntilStale<T extends WebComponent>(
    stale: () => AwaitableWebComponent<T>
  ): Promise<void> {
    await this.waitFor(elementDoesNotExist(stale));
  }

  /**
   * Waits until an element is not visible
   * @param {() => WebComponent} element
   * @returns {Promise<void>}
   */
  public async waitUntilElementIsNotVisible<T extends WebComponent>(
    element: () => AwaitableWebComponent<T>
  ): Promise<void> {
    await this.waitFor(elementIsNotVisible(element));
  }

  /**
   * Waits until an element is visible
   * @param {() => WebComponent} element
   * @returns {Promise<void>}
   */
  public async waitUntilElementIsVisible<T extends WebComponent>(
    element: () => AwaitableWebComponent<T>
  ): Promise<void> {
    await this.waitFor(elementIsVisible(element));
  }

  /**
   * Waits on a condition to be true. If no second parameter, then this
   * method will wait forever, until the specified condition becomes true.
   * @param {WaitCondition} condition
   * @returns {Promise<void>}
   */
  public async waitFor(condition: WaitCondition): Promise<void> {
    await this.waitForAny(condition);
  }

  /**
   * Check if an alert is visible on the screen.
   */
  public async hasAlert(): Promise<boolean> {
    try {
      await this.driver.switchTo().alert();
      return true;
    } catch (e) {
      if (!(e instanceof NoSuchAlertError)) {
        throw e;
      }
      return false;
    }
  }

  /**
   * Dismiss an alert if it is visible on the screen.
   */
  public async dismissAlert(): Promise<void> {
    await this.driver.switchTo().alert().dismiss();
  }

  /**
   * Accept an alert if visible on the screen.
   */
  public async acceptAlert(): Promise<void> {
    await this.driver.switchTo().alert().accept();
  }

  /**
   * Refresh the page.
   * If an alert shows up, then accept it.
   */
  public async refreshPage(): Promise<void> {
    await this.driver.navigate().refresh();
    try {
      const alert: Alert = await this.driver.switchTo().alert();
      await alert.accept();
    } catch (error) {}
  }

  /**
   * Close the browser and clear the session.
   * @returns {Promise<void>}
   */
  public async quit(): Promise<void> {
    await this.driver.quit();
    this.valid = false;
  }

  /**
   * Close the browser window.
   */
  public async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Executes a javascript script to make the cursor visible on the browser window.
   */
  public async showCursor(): Promise<void> {
    const script: string =
      "// Create mouse following image.\n" +
      'var seleniumFollowerImg = document.createElement("img");\n' +
      "\n" +
      "// Set image properties.\n" +
      "seleniumFollowerImg.setAttribute('src', 'data:image/png;base64,'\n" +
      "    + 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAeCAQAAACGG/bgAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAA'\n" +
      "    + 'HsYAAB7GAZEt8iwAAAAHdElNRQfgAwgMIwdxU/i7AAABZklEQVQ4y43TsU4UURSH8W+XmYwkS2I0'\n" +
      "    + '9CRKpKGhsvIJjG9giQmliHFZlkUIGnEF7KTiCagpsYHWhoTQaiUUxLixYZb5KAAZZhbunu7O/PKf'\n" +
      "    + 'e+fcA+/pqwb4DuximEqXhT4iI8dMpBWEsWsuGYdpZFttiLSSgTvhZ1W/SvfO1CvYdV1kPghV68a3'\n" +
      "    + '0zzUWZH5pBqEui7dnqlFmLoq0gxC1XfGZdoLal2kea8ahLoqKXNAJQBT2yJzwUTVt0bS6ANqy1ga'\n" +
      "    + 'VCEq/oVTtjji4hQVhhnlYBH4WIJV9vlkXLm+10R8oJb79Jl1j9UdazJRGpkrmNkSF9SOz2T71s7M'\n" +
      "    + 'SIfD2lmmfjGSRz3hK8l4w1P+bah/HJLN0sys2JSMZQB+jKo6KSc8vLlLn5ikzF4268Wg2+pPOWW6'\n" +
      "    + 'ONcpr3PrXy9VfS473M/D7H+TLmrqsXtOGctvxvMv2oVNP+Av0uHbzbxyJaywyUjx8TlnPY2YxqkD'\n" +
      "    + 'dAAAAABJRU5ErkJggg==');\n" +
      "seleniumFollowerImg.setAttribute('id', 'selenium_mouse_follower');\n" +
      "seleniumFollowerImg.setAttribute('style', 'position: absolute; z-index: 99999999999; pointer-events: none;');\n" +
      "\n" +
      "// Add mouse follower to the web page.\n" +
      "document.body.appendChild(seleniumFollowerImg);\n" +
      "\n" +
      "// Track mouse movements and re-position the mouse follower.\n" +
      "$(document).mousemove(function(e) {\n" +
      '    $("#selenium_mouse_follower").css({ left: e.pageX, top: e.pageY });\n' +
      "});";
    await this.driver.executeScript(script);
  }

  /**
   * Find any element asynchronously
   * If none is found, return undefined
   * @param {WebComponent[]} elements
   * @returns {Promise<WebComponent>}
   */
  private async asyncFind<T extends WebComponent>(
    elements: Promise<T>[]
  ): Promise<T | undefined> {
    for (let element of elements) {
      try {
        if (await (await element).isDisplayed()) {
          return element;
        }
      } catch (e) {}
    }
  }
}

type Handler = Function | Validatable<Validator>;
export type BrowserTypes = "chrome" | "edge";
export type BrowserOptions = {
  exit?: boolean;
  headless?: boolean;
  maximized?: boolean;
  width?: number;
  height?: number;
};
