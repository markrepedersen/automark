import {AsyncFunction} from "..";

/**
 * Retry a method if {@param condition} is true.
 * If {@param retries} is provided, then this will retry the
 * method {@param retries} number of times, assuming {@param condition} is true for each time.
 * @param condition
 * @param retries
 */
export function retry(condition: ErrorCondition = (e: any) => true, retries: number = 5): any {
    return function (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<AsyncFunction>) {
        const originalMethod: any = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const retryFn = async (retries: number) => {
                try {
                    return originalMethod.apply(this, args);
                } catch (error) {
                    if (condition(error) && retries > 0) {
                        await retryFn(--retries)
                    } else throw error;
                }
            };

            return retryFn(retries);
        };
    };
}

type ErrorCondition = (e: Error) => boolean;