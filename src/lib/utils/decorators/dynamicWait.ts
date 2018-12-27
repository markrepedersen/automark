import {AsyncFunction} from "./utils";
import {config} from "../../../../main";
import {Browser} from "..";

/**
 * Injects a dynamic wait before and after this method executes.
 * The amount of time to wait will be determined by how slow the system is acting.
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function dynamicWait<T extends Browser>(target: T, propertyKey: string, descriptor: TypedPropertyDescriptor<AsyncFunction>) {
    const originalMethod: any = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        const result: any = originalMethod.apply(this, args);
        await delay(config.loadTime);
        return await result;
    };

    async function delay(timeout: number) {
        return new Promise<void>((resolve) => setTimeout(() => {
            resolve();
        }, timeout));
    }
}