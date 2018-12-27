import {Page} from "./page";
import {elementIsVisible, findBy, log, TextInput, validate, WaitCondition} from "../lib/utils";
import {Key} from "selenium-webdriver";

@log
@validate
export class GoogleMainPage extends Page {
    @findBy('input[title="Search"]')
    protected searchBarTextInput!: TextInput;

    public loadCondition(): WaitCondition {
        return elementIsVisible(() => this.searchBarTextInput);
    }

    /**
     * Search for {@param query} using the search bar.
     * @param query
     */
    public async search(query: string): Promise<void> {
        await this.searchBarTextInput.click();
        await this.searchBarTextInput.type(query);
        await this.type(Key.ENTER);
    }
}