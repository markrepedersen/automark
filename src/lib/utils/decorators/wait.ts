import {AsyncFunction} from "./utils";
import {Page} from "..";

/**
 * Uses the browser's load variable to wait a set amount of time after the method executes before continuing.
 */
export function wait<T extends Page>(target: T, propertyKey: string, descriptor: TypedPropertyDescriptor<AsyncFunction>) {
    const originalMethod: any = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        const result: any = originalMethod.apply(this, args);
        await delay((this as any).browser.loadTime);
        return await result;
    };

    async function delay(timeout: number) {
        return new Promise<void>((resolve) => setTimeout(() => {
            resolve();
        }, timeout));
    }
}