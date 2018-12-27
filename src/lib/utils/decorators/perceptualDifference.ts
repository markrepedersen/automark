import {AsyncFunction, compareScreenshots, getScreenshot, registerDecorator} from "./utils";
import {Page} from "../../../pages/page";

/**
 * Takes a screenshot of the decorated page and compares the screenshot with a previously taken screenshot.
 * The comparison will be executed after the page's load condition has finished.
 * This function will look in location ../../screenshot/<class name>_<method name>.png for the screenshot
 * with which to compare.
 * NOTE: A clean run is expected to have been done.
 * A clean run means that the page that uses this decorator was used in a test
 * and a screenshot was generated for this run.
 * @param target
 * @param {string} propertyKey
 * @param {PropertyDescriptor} descriptor
 */
export function perceptualDifference<T extends Page>(target: T, propertyKey: string, descriptor: TypedPropertyDescriptor<AsyncFunction>) {
    registerDecorator(target, propertyKey, 'perceptualDifference');
    const originalMethod: any = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        const result: any = originalMethod.apply(this, args);
        const path: string = getPDiffPath(target.constructor.name, propertyKey);
        const page: Buffer = await getScreenshot((this as any).browser);
        const isDifferent: boolean = compareScreenshots(path, page);
        if (isDifferent) {
            throw new Error("There was a perceptual difference between this page and a previously taken screenshot. Do you accept or reject this change?");
        }
        return result;
    };

    function getPDiffPath(className: string, methodName: string): string {
        return `../../screenshot/${className}_${methodName}.png`;
    }
}