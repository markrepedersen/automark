import {WebComponent} from "./WebComponent";
import {retry} from "../decorators/retry";
import {error, IKey, Key} from "selenium-webdriver";
import StaleElementReferenceError = error.StaleElementReferenceError;

export class TextInput extends WebComponent {
    public async clear(): Promise<void> {
        return await this.element.clear();
    }

    @retry((e: Error) => e instanceof StaleElementReferenceError)
    public async type(...text: Array<string | IKey>): Promise<void> {
        try {
            this.element = await this.refetchElement();
            await this.clear();
        } catch (e) {
            console.log(`Element is stale after element.clear(). Exception:\n${e}`);
        }
        await this.element.sendKeys(Key.chord(...text));
    }

    /**
     * Returns whether the given value matches the current value.
     * @param value
     */
    protected async checkValue(value: string): Promise<boolean> {
        return await this.getText() === value || await this.getElementAttribute('value') === value;
    }

    public async fill(value: string): Promise<boolean> {
        if (await this.checkValue(value)) {
            return false;
        }
        await this.click();
        await this.type(value);
        return true;
    }
}
