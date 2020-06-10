import {Button, By, error, ILocation, ISize, WebDriver, WebElement} from "selenium-webdriver";
import {retry} from "../decorators/retry";
import {log} from "..";
import NoSuchElementError = error.NoSuchElementError;
import StaleElementReferenceError = error.StaleElementReferenceError;

export type AwaitableWebComponent<T extends WebComponent> = T | Promise<T>;

@log
export class WebComponent {
    constructor(public element: WebElement,
                public selector: string,
                private readonly parentElement?: WebElement,
                protected driver: WebDriver = element.getDriver()) {
    }

    /**
     * Converts a string selector to its XPath or CSS selector {@class By}.
     * @param selector
     */
    public static convertSelector(selector: string): By {
        return selector.includes("//") ? By.xpath(selector) : By.css(selector);
    }

    /**
     * Checks if an element has any children.
     */
    public async hasChildren(): Promise<boolean> {
        return (await this.getChildren('*')).length != 0;
    }

    /**
     * Returns the element's location.
     */
    public async getLocation(): Promise<ILocation> {
        return await this.element.getLocation();
    }

    public async getSize(): Promise<ISize> {
        return await this.element.getSize();
    }

    public async getTopLeftCorner(): Promise<ILocation> {
        return await this.getLocation();
    }

    public async getTopRightCorner(): Promise<ILocation> {
        const elementLocation: ILocation = await this.getLocation();
        const elementSize: ISize = await this.getSize();
        return {
            x: elementLocation.x + elementSize.width,
            y: elementLocation.y
        };
    }

    public async getBottomLeftCorner(): Promise<ILocation> {
        const elementLocation: ILocation = await this.getLocation();
        const elementSize: ISize = await this.getSize();
        return {
            x: elementLocation.x,
            y: elementLocation.y + elementSize.height
        };
    }

    public async getBottomRightCorner(): Promise<ILocation> {
        const elementLocation: ILocation = await this.getLocation();
        const elementSize: ISize = await this.getSize();
        return {
            x: elementLocation.x + elementSize.width,
            y: elementLocation.y + elementSize.height
        };
    }

    /**
     * Finds an element that is a descendant of the current WebComponent.
     * @param selector The CSS/XPath selector for the element.
     */
    @retry((error: Error) => error instanceof NoSuchElementError)
    public async getChild(selector: string): Promise<WebComponent> {
        const child: WebElement = await this.element.findElement(WebComponent.convertSelector(selector));
        return new WebComponent(child, selector, this.element);
    }

    /**
     * Find a series of elements identified by either an XPath or CSS selector.
     * @param {string} selector
     * @returns {Array<WebComponent>}
     */
    @retry((error: Error) => error instanceof NoSuchElementError)
    public async getChildren(selector: string): Promise<WebComponent[]> {
        return (await this
            .element
            .findElements(WebComponent.convertSelector(selector)))
            .map((element: WebElement) => new WebComponent(element, selector, this.element));
    }

    /**
     * Checks whether this element has children matching the given selector.
     * @param selector
     */
    public async hasChild(selector: string): Promise<boolean> {
        return (await this.getChildren(selector)).length > 0;
    }

    /**
     * Gets the element's z index, if it exists.
     * @returns {Promise<number>}
     */
    public async getZIndex(): Promise<number> {
        const styleAttribute: string = await this.element.getAttribute('style');
        const styles: Array<string> = styleAttribute.split(' ');

        const tagIndex: number = styles.findIndex((value: string) => value == 'z-index:');
        const index = styles[tagIndex + 1]
            .trim()
            .replace(';', '');
        return Number.parseInt(index);
    }

    /**
     * Check if the element has any class in {@param classNames}.
     * @param {string} classNames
     * @returns {Promise<boolean>}
     */
    public async hasClass(...classNames: string[]): Promise<boolean> {
        const classes: Array<string> = (await this.getElementAttribute('class')).split(' ');
        for (const className of classNames) {
            if (classes.some((classAttribute: string) => classAttribute == className)) {
                return true;
            }
        }
        return false;
    }

    public async clear() {
        await this.element.clear();
    }

    public refetchElement(): WebElement {
        if (this.parentElement) {
            this.element = this.parentElement.findElement(WebComponent.convertSelector(this.selector));
        } else {
            this.element = this.driver.findElement(WebComponent.convertSelector(this.selector));
        }
        return this.element;
    }

    /**
     * Click an element on the screen.
     * If this fails, try clicking the element through pure javascript.
     * @returns {Promise<void>}
     */
    @retry((e: Error) => e instanceof StaleElementReferenceError)
    public async click(): Promise<void> {
        try {
            const element = await this.refetchElement();
            this.element = element;
            return await element.click();
        } catch (clickErr) {
            try {
                await this.element
                    .getDriver()
                    .executeScript('arguments[0].click();', this.element);
            } catch (jsErr) {
                throw clickErr;
            }
        }
    }

    /**
     * Right click an element on the screen.
     * @returns {Promise<void>}
     */
    public async rightClick(): Promise<void> {
        return await this.driver.actions().click(this.element, Button.RIGHT).perform();
    }

    public async dragToElement(target: WebElement): Promise<void> {
        await this.driver.actions().dragAndDrop(this.element, target).perform();
    }

    /**
     * Hover over this element
     * @returns {Promise<void>}
     */
    public async hover(): Promise<void> {
        await this
            .element
            .getDriver()
            .actions()
            .mouseMove(this.element)
            .perform();
    }

    /**
     * Drags the element by clicking, and moving the mouse by one pixel at a time
     * The start-offset is the offset from the top-left of the element where the drag starts
     * If no start-offset is given, the default is the center of the element
     * Note this method must be used for resizing ORCA UI elements
     * @param {ILocation | WebComponent} location: the location to move to
     * @param {ILocation} start_offset: the offset from the top-left of the element where the drag begins
     */
    public async dragTo(location: WebComponent, start_offset?: ILocation): Promise<void>;
    public async dragTo(location: ILocation, start_offset?: ILocation): Promise<void>;
    public async dragTo(location: WebComponent | ILocation, start_offset?: ILocation): Promise<void> {
        let xPos: number = 0;
        let yPos: number = 0;

        if (start_offset) {
            await this.driver.actions().mouseMove(this.element, start_offset).mouseDown().perform();
        } else {
            await this.driver.actions().mouseDown(this.element).perform();
        }

        location = location instanceof WebComponent ? await location.getLocation() : location;

        while (xPos !== location.x || yPos !== location.y) {
            let mouseXPos: number = 0;
            let mouseYPos: number = 0;

            if (xPos > location.x) {
                xPos--;
                mouseXPos = -1;
            } else if (xPos < location.x) {
                xPos++;
                mouseXPos = 1;
            }
            if (yPos > location.y) {
                yPos--;
                mouseYPos = -1;
            } else if (yPos < location.y) {
                yPos++;
                mouseYPos = 1;
            }
            await this.driver.actions().mouseMove({x: mouseXPos, y: mouseYPos}).perform();
        }
        await this.driver.actions().mouseUp().perform();
    }

    /**
     * Drags the element one pixel at a time to the given WebComponent ${element}
     * @param {WebComponent} element
     */
    public async dragToWebComponent(element: WebComponent): Promise<void> {
        await this.driver.actions().mouseDown(this.element).perform();

        let location: ILocation = await element.getLocation();
        let startlocation: ILocation = await this.getLocation();
        let xPos = startlocation.x;
        let yPos = startlocation.y;

        while (xPos !== location.x || yPos !== location.y) {
            let mouseXPos: number = 0;
            let mouseYPos: number = 0;

            if (xPos > location.x) {
                xPos--;
                mouseXPos = -1;
            } else if (xPos < location.x) {
                xPos++;
                mouseXPos = 1;
            }
            if (yPos > location.y) {
                yPos--;
                mouseYPos = -1;
            } else if (yPos < location.y) {
                yPos++;
                mouseYPos = 1;
            }
            await this.driver.actions().mouseMove({x: mouseXPos, y: mouseYPos}).perform();
        }
        await this.driver.actions().mouseUp().perform();
    }

    /**
     * Drags around the element size, and moves the mouse by one pixel at a time.
     */
    public async dragAroundElementBounds(): Promise<void> {
        let xPos: number = 0;
        let yPos: number = 0;

        const size: ISize = await this.getSize();

        await this.driver.actions().mouseMove(this.element, {x: 0, y: 0}).mouseDown().perform();

        while (xPos < size.width || yPos < size.height) {
            let mouseXPos: number = 0;
            let mouseYPos: number = 0;

            if (xPos < size.width) {
                xPos++;
                mouseXPos = 1;
            }
            if (yPos < size.height) {
                yPos++;
                mouseYPos = 1;
            }
            await this.driver.actions().mouseMove({x: mouseXPos, y: mouseYPos}).perform();
        }
        await this.driver.actions().mouseUp().perform();
    }

    /**
     * Get the attribute of an element named {@param attribute}
     * @param {string} attribute
     * @returns {Promise<string>}
     */
    public async getElementAttribute(attribute: string): Promise<string> {
        return await this.element.getAttribute(attribute);
    }

    /**
     * Check if an element contains {@param attributes}.
     * @param {string} attributes
     * @returns {Promise<any>}
     */
    public async hasAttribute(...attributes: string[]): Promise<boolean> {
        for (const attribute of attributes) {
            const elementAttribute: string = await this.getElementAttribute(attribute);
            if (elementAttribute) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if element has a {@param styles} in its style attribute values.
     * @param styles
     */
    public async hasStyle(...styles: string[]): Promise<boolean> {
        const styleValue: string = await this.getElementAttribute('style');
        for (const style of styles) {
            if (styleValue.includes(style)) {
                return true;
            }
        }
        return false;
    }


    /**
     * Check if this element is currently visible on the screen
     * @returns {Promise<boolean>}
     */
    public async isDisplayed(): Promise<boolean> {
        try {
            return await this.element.isDisplayed() &&
                !(await this.hasStyle('visibility: hidden')) &&
                !(await this.hasStyle('display: none'))
        } catch (ex) {
            return false;
        }
    }

    /**
     * Check if this element is NOT currently visible on the screen
     * @returns {Promise<boolean>}
     */
    public async isNotDisplayed(): Promise<boolean> {
        return !(await this.isDisplayed());
    }

    /**
     * Check if this element exists.
     */
    public async exists() {
        try {
            await this.element.isEnabled();
            return true;
        } catch (e) {
            return !(e instanceof StaleElementReferenceError || e instanceof error.NoSuchElementError);
        }
    }

    /**
     * Check if an element is stale. An element is deemed stale if
     * it has been deleted from the DOM.
     * @returns {Promise<boolean>}
     */
    public async isStale(): Promise<boolean> {
        try {
            await this.isEnabled();
            return false;
        } catch (e) {
            return e instanceof StaleElementReferenceError;
        }
    }

    /**
     * Check if an element is not stale. An element is deemed stale if
     * it has been deleted from the DOM.
     * @returns {Promise<boolean>}
     */
    public async isNotStale(): Promise<boolean> {
        return !(await this.isStale());
    }

    /**
     * Check if this element is currently selected
     * @returns {Promise<boolean>}
     */
    public async isSelected(): Promise<boolean> {
        return await this.element.isSelected();
    }

    /**
     * Check if this element is enabled.
     * @returns {Promise<boolean>}
     */
    public async isEnabled(): Promise<boolean> {
        try {
            return await this.element.isEnabled() &&
                await this.getElementAttribute('aria-disabled') !== 'true' &&
                !await this.hasClass(`sapMInputBaseDisabled`);
        } catch (exception) {
            await this.refetchElement();
            return false;
        }
    }

    /**
     * Checks if this element is disabled.
     */
    public async isDisabled(): Promise<boolean> {
        return !(await this.isEnabled());
    }

    /**
     * Get the text of this element, if any exists.
     * If there is no text on this element, then this method
     * will return throw an error
     * @returns {Promise<string>}
     */
    public async getText(): Promise<string> {
        return await this.element.getText();
    }

    /**
     * Re-sizes the element by dragging and dropping to the given {@param offset} from this.element.
     * Occasionally, selenium driver fails to correctly grab the element to perform drag and drop.
     * Therefore drag and drop function is placed in while loop.
     * Selenium drag and drop is not exactly accurate and the final size may be differ from expected by 1-2px.
     * @param offset
     */
    public async resizeByOffset(offset: ILocation): Promise<void> {
        let originalLocation: ILocation = await this.element.getLocation();
        let currentLocation: ILocation = originalLocation;

        while (currentLocation.x === originalLocation.x && currentLocation.y === originalLocation.y) {
            await this.element.getDriver().actions().dragAndDrop(this.element, offset).perform();
            currentLocation = await this.element.getLocation();
            console.log(currentLocation);
        }
    }
}
