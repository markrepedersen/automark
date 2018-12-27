import {getMethodDescriptor, ITypeOf, registerDecorator} from "./utils";
import {Page} from "../../../pages/page";
import {Browser} from "..";

export function validate<TCtor extends ITypeOf<Page>>(constructor: TCtor) {
    registerDecorator(constructor.prototype, constructor.name, 'validate');
    for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
        const method: any = constructor.prototype[propertyName];
        if (method instanceof Function) {
            const descriptor: any = getMethodDescriptor(constructor, propertyName);
            const originalMethod: any = descriptor.value;
            descriptor.value = function (...args: any[]) {
                const result: any = originalMethod.apply(this, args);
                if (result instanceof Promise) {
                    const browser: Browser = (this as any).browser;
                    const stackTrace: string | undefined = new Error().stack;
                    return result.then(async (originalResult) => {
                        for (const validator of browser.handlers) {
                            await validator.validate(stackTrace);
                        }
                        return originalResult;
                    });
                }
                return result;
            };
            if (propertyName != 'constructor') {
                Object.defineProperty(constructor.prototype, propertyName, descriptor);
            }
        }
    }
}