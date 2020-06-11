import {error} from "selenium-webdriver";
import {WebComponent, AwaitableWebComponent} from "./components";
import {Browser} from '.';
import {Page, NewablePage} from '../../pages';

export type WaitCondition = (browser: Browser) => Promise<boolean>;

export function elementIsVisible<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => {
        const element: T = await locator();
        return await element.isDisplayed();
    }
}

export function elementIsClickable<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => {
        const element: T = await locator();
        return await element.isNotStale() && await element.isDisplayed() && await element.isEnabled();
    }
}

export function elementIsPresent<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => await locator() !== undefined;
}

export function elementIsAbove<T extends WebComponent>(element1: () => AwaitableWebComponent<T>, element2: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => {
        const zIndex1: number = await (await element1()).getZIndex();
        const zIndex2: number = await (await element2()).getZIndex();
        return zIndex1 > zIndex2;
    }
}

export function elementIsBelow<T extends WebComponent>(element1: () => AwaitableWebComponent<T>, element2: () => AwaitableWebComponent<T>): WaitCondition {
    return elementIsAbove(element2, element1);
}

export function elementIsEnabled<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => await (await locator()).isEnabled();
}

export function elementDoesNotExist<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => {
        try {
            const element: T = await locator();
            await element.isEnabled();
        } catch (e) {
            if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
                return true;
            } else {
                throw e;
            }
        }
        return false;
    }
}

export function elementIsNotVisible<T extends WebComponent>(locator: () => AwaitableWebComponent<T>): WaitCondition {
    return async () => {
        try {
            const element: T = await locator();
            return element.isNotDisplayed();
        } catch (e) {
            if (e instanceof error.StaleElementReferenceError || e instanceof error.NoSuchElementError) {
                return true;
            } else {
                throw e;
            }
        }
    }

}

export function pageHasLoaded<T extends Page>(page: NewablePage<T>): WaitCondition {
    return (browser: Browser) => {
        const condition: WaitCondition = new page(browser).loadCondition();
        return condition(browser);
    };
}

export type RequiresAtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]
