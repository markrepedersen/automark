import {Browser} from "..";

/**
 * Takes a screenshot of a failed test.
 */
export function screenshot(target: { browser: Browser }, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod: any = descriptor.value;
    descriptor.value = function (...args: any[]) {
        return originalMethod.apply(this, args);
    };
}
