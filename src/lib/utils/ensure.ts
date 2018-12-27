import {WebComponent} from "./components/WebComponent";
import {Button} from "./components/Button";
import {TextInput} from "./components/TextInput";

class WebComponentEnsurer {
    private component: WebComponent;

    constructor(component: WebComponent) {
        this.component = component;
    }

    public async textIs(expected: string): Promise<void> {
        const text: string = await this.component.getText();

        if (expected.trim() !== text.trim()) {
            throw new Error(`Element ${this.component.selector} text is '${text}'. Expected value is '${expected}'`);
        }
    }

    public async isVisible(): Promise<void> {
        if (!await this.component.isDisplayed()) {
            throw new Error(`Element ${this.component.selector} is not visible`);
        }
    }

    public async isNotVisible(): Promise<void> {
        if (await this.component.isDisplayed()) {
            throw new Error(`Element ${this.component.selector} is visible`);
        }
    }
}

class ButtonEnsurer extends WebComponentEnsurer {
    protected button: Button;

    constructor(button: Button) {
        super(button);
        this.button = button;
    }

    public async isEnabled(): Promise<void> {
        if (await this.button.isDisabled()) {
            throw new Error(`Button ${this.button.selector} is disabled`);
        }
    }
}

class TextInputEnsurer extends WebComponentEnsurer {
    constructor(element: TextInput) {
        super(element);
    }
}

export function ensure(component: Button): ButtonEnsurer;
export function ensure(component: TextInput): TextInputEnsurer;
export function ensure(component: WebComponent): WebComponentEnsurer;
export function ensure(component: WebComponent | Button): any {
    if (component instanceof Button) {
        return new ButtonEnsurer(component);
    } else if (component instanceof WebComponent) {
        return new WebComponentEnsurer(component);
    }
}
