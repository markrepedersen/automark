import {WebComponent} from "./WebComponent";
import {Key} from "selenium-webdriver";

export class GridCell extends WebComponent {
    public async fillCell(text: string) {
        await this.click();
        await this.driver.actions().sendKeys(text).perform();
        await this.driver.actions().sendKeys(Key.ENTER).perform();
    }
}