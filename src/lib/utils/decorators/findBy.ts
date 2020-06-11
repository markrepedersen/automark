import {registerDecorator} from "./utils";
import {WebComponent} from "../components";
import {Page} from "../../../pages";
import {By} from "selenium-webdriver";

/**
 * This annotation will lazy load an element into the class property by extracting
 * metadata of the property and its class and injecting the element into the property.
 * @param {string} selector
 * @returns {(target: any, propertyKey: string) => void}
 */
export function findBy<T extends Page>(selector: string): (target: T, propertyKey: string) => void {
    return (target: any, propertyKey: string) => {
        registerDecorator(target, propertyKey, 'findBy');
        const type: any = Reflect.getMetadata('design:type', target, propertyKey);
        Object.defineProperty(target, propertyKey, {
            configurable: true,
            enumerable: true,
            get() {
                const browser: any = (this as any).browser;
                if (browser) {
                    const promise: any = browser.driver.findElement(selector.includes('//') ? By.xpath(selector) : By.css(selector));
                    return new type(promise, selector);
                }
            },
            set<T extends WebComponent>(component: T) {
                Object.defineProperty(target, propertyKey, component);
            }
        });
    };
}
