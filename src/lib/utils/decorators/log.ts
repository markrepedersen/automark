import {getMethodDescriptor, registerDecorator} from "./utils";

/**
 * Injects logging before and after methods in classes decorated with this function.
 * Methods that wait will be ignored, since they will poll constantly.
 * NOTE: This will not log the page's loadCondition method
 * due to how many times it is called. Keep this in mind if using these logs
 * to debug.
 */
export function log(constructor: Function) {
    registerDecorator(constructor.prototype, constructor.name, 'log');
    for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
        if (propertyName != 'loadCondition') {
            const method = constructor.prototype[propertyName];
            if (method instanceof Function) {
                const descriptor: PropertyDescriptor = getMethodDescriptor(constructor, propertyName);
                const originalMethod = descriptor.value;
                descriptor.value = function (...args: any[]) {
                    const methodCallerClass: string = constructor.name;
                    logMessage(`[${methodCallerClass}] Attempting: ${propertyName}`);

                    let result = originalMethod.apply(this, args);
                    if (result instanceof Promise) {
                        result.then((result: any) => {
                            logMessage(`[${methodCallerClass}] Finished: ${propertyName}`);
                            return result;
                        });
                    } else logMessage(`[${methodCallerClass}] Finished: ${propertyName}`);
                    return result;
                };
                if (propertyName != 'constructor') {
                    Object.defineProperty(constructor.prototype, propertyName, descriptor);
                }
            }
        }
    }

    function logMessage(message: string) {
        console.log(message);
    }
}