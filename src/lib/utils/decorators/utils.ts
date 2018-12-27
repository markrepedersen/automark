import 'reflect-metadata';
import {readFileSync} from "fs";
import {includes, isString} from "lodash";
import sizeOf = require("image-size");
import pixelMatch = require('pixelmatch');

/**
 * Register new methods on a class.
 * This will iterate over all methods in the class and replace them with {@param newMethod}.
 * If {@param excludedMethods} is provided, then this will ignore all methods inside it.
 * @param constructor
 * @param newMethod
 * @param excludedMethods
 */
export function registerMethod(constructor: any, newMethod: (originalMethod: Function) => any, ...excludedMethods: string[]): any {
    for (const propertyName of Object.getOwnPropertyNames(constructor.prototype)) {
        const method = constructor.prototype[propertyName];
        if (method instanceof Function) {
            const descriptor: PropertyDescriptor = getMethodDescriptor(constructor, propertyName);
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                newMethod.bind(this);
                newMethod(originalMethod);
            };
            if (!includes(excludedMethods, propertyName)) {
                Object.defineProperty(constructor.prototype, propertyName, descriptor);
            }
        }
    }
}

/**
 * Gets the method's descriptor - inherited or not
 * @param {any} target
 * @param {string} propertyName
 * @returns {any}
 */
export function getMethodDescriptor(target: any, propertyName: string): any {
    if (target.prototype.hasOwnProperty(propertyName)) {
        return Object.getOwnPropertyDescriptor(target.prototype, propertyName);
    }
    return {
        configurable: true,
        enumerable: true,
        writable: true,
        value: target.prototype[propertyName]
    } as any;
}

/**
 * Register a decorator onto the target.
 * @param {object} target (The class)
 * @param {string} propertyKey (the name of the property)
 * @param {string} metadataKey (the specific decorator name, e.g. findBy)
 */
export function registerDecorator(target: object, propertyKey: string, metadataKey: string): void {
    let properties: string[] = Reflect.getMetadata(metadataKey, target);
    if (properties) {
        properties.push(propertyKey);
    } else {
        properties = [propertyKey];
        Reflect.defineMetadata(metadataKey, properties, target);
    }
}

/**
 * Gets all of {@param origin}'s properties that are decorated by {@param metadataKey}.
 * @param origin
 * @param {Symbol | string} metadataKey
 * @returns {Array<any>}
 */
export function getDecoratedProperties(origin: any, metadataKey: Symbol | string): Array<any> {
    const properties: string[] = Reflect.getMetadata(metadataKey, origin) || [];
    return properties.map((key: string) => origin[key]);
}

export async function getScreenshot(browser: any): Promise<Buffer> {
    return await browser.takeScreenshot();
}

export function getImageDimensions(image: Buffer): any {
    return sizeOf(image);
}

export function compareScreenshots(screenshot1: Buffer | string, screenshot2: Buffer | string): boolean {
    if (isString(screenshot1)) {
        screenshot1 = readFileSync(screenshot1) as Buffer;
    }
    if (isString(screenshot2)) {
        screenshot2 = readFileSync(screenshot2) as Buffer;
    }
    const imageSize1: any = getImageDimensions(screenshot1 as Buffer);
    const imageSize2: any = getImageDimensions(screenshot2 as Buffer);
    if (imageSize1 != imageSize2) {
        return pixelMatch(screenshot1 as Buffer, screenshot2 as Buffer, null, imageSize1.width, imageSize1.height) > 0;
    }
    return false;
}

export type AsyncFunction = (...args: any[]) => Promise<any>;

export interface ITypeOf<T> {
    new(...args: any[]): T
}