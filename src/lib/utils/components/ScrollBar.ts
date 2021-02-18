import {WebComponent} from "./WebComponent";
import {Key} from "selenium-webdriver";
import {isEmpty} from "lodash";
import {retry} from "../decorators/retry";

type ScrollDirection =
    typeof Key.ARROW_RIGHT |
    typeof Key.ARROW_LEFT |
    typeof Key.ARROW_UP |
    typeof Key.ARROW_DOWN;

abstract class ScrollDirectionHandler extends WebComponent {
    /**
     * Checks if scrolling has finished.
     * Scrolling is finished if it has successfully scrolled all the way in some direction.
     */
    protected abstract hasFinishedScrolling(): Promise<boolean>;

    protected async getScrollId(): Promise<string> {
        return this.element.getAttribute('id');
    }

    /**
     * Scroll in direction defined by {@param direction} until {@param elementSelector} is found.
     * @param elementSelector
     * @param direction
     */
    @retry()
    public async scroll(elementSelector: string, direction: ScrollDirection): Promise<void> {
        if (await this.isDisplayed() && !await this.isFound(elementSelector)) {
            await this.element.click();
            while (!await this.isFound(elementSelector) && !await this.hasFinishedScrolling()) {
                await this.move(direction);
                await this.driver.sleep(100);
            }
        }
    }

    /**
     * Check if the element was found.
     * @param elementSelector
     */
    protected async isFound(elementSelector: string): Promise<boolean> {
        return !isEmpty(await this.driver.findElements(WebComponent.convertSelector(elementSelector)));
    }

    /**
     * Move the scroll bar in direction {@param direction}.
     * @param direction
     */
    protected async move(direction: ScrollDirection): Promise<void> {
        await this.driver.actions().sendKeys(direction).perform();
    }
}

class ScrollUpHandler extends ScrollDirectionHandler {
    protected async hasFinishedScrolling(): Promise<boolean> {
        const scrollId: string = await this.getScrollId();
        return await this.driver.executeScript(`return document.getElementById("${scrollId}").scrollTop == 0`) as boolean;
    }
}

class ScrollDownHandler extends ScrollDirectionHandler {
    protected async hasFinishedScrolling(): Promise<boolean> {
        const scrollId: string = await this.getScrollId();
        return await this.driver.executeScript(`return (document.getElementById("${scrollId}").scrollHeight - document.getElementById("${scrollId}").offsetHeight) == document.getElementById("${scrollId}").scrollTop`) as boolean;
    }
}

class ScrollLeftHandler extends ScrollDirectionHandler {
    protected async hasFinishedScrolling(): Promise<boolean> {
        const scrollId: string = await this.getScrollId();
        return await this.driver.executeScript(`return (document.getElementById("${scrollId}").scrollLeft == 0`) as boolean;
    }
}

class ScrollRightHandler extends ScrollDirectionHandler {
    protected async hasFinishedScrolling(): Promise<boolean> {
        const scrollId: string = await this.getScrollId();
        return await this.driver.executeScript(`return (document.getElementById("${scrollId}").scrollLeft == (document.getElementById("${scrollId}").scrollWidth`) as boolean;
    }
}

export class ScrollBar extends WebComponent {
    /**
     * Scroll DOWN until {@param elementSelector} is found or until it cannot scroll anymore.
     * @param elementSelector
     */
    public async scrollDown(elementSelector: string): Promise<void> {
        await new ScrollDownHandler(this.element, elementSelector).scroll(elementSelector, Key.ARROW_DOWN);
    }

    /**
     * Scroll UP until {@param elementSelector} is found or until it cannot scroll anymore.
     * @param elementSelector
     */
    public async scrollUp(elementSelector: string): Promise<void> {
        await new ScrollUpHandler(this.element, elementSelector).scroll(elementSelector, Key.ARROW_UP);
    }

    /**
     * Scroll LEFT until {@param elementSelector} is found or until it cannot scroll anymore.
     * @param elementSelector
     */
    public async scrollLeft(elementSelector: string): Promise<void> {
        await new ScrollLeftHandler(this.element, elementSelector).scroll(elementSelector, Key.ARROW_LEFT);
    }

    /**
     * Scroll RIGHT until {@param elementSelector} is found or until it cannot scroll anymore.
     * @param elementSelector
     */
    public async scrollRight(elementSelector: string): Promise<void> {
        await new ScrollRightHandler(this.element, elementSelector).scroll(elementSelector, Key.ARROW_RIGHT);
    }
}