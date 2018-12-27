import {WebComponent} from "./WebComponent";
import {log} from "..";

@log
export class Button extends WebComponent {
    public async isDisabled(): Promise<boolean> {
        try {
            return await this.element.getAttribute('disabled') === 'disabled';
        } catch (ex) {
            return false;
        }
    }
}