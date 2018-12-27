import {Browser, WaitCondition} from '../lib/utils';
import {IKey} from "selenium-webdriver";

export interface NewablePage<T extends Page> {
    new(browser: Browser, ...args: any[]): T;
}

/**
 * This abstract class represents a specific page or sub portion of a page.
 */
export abstract class Page {
    protected browser: Browser;

    public constructor(browser: Browser) {
        this.browser = browser;
    }

    /**
     * Type a phrase or special key press globally
     * This function will type into any currently focused element
     * @param {string} words : the words to type
     * @returns {Promise<void>}
     */
    public async type(...words: Array<string | IKey>): Promise<void> {
        await this.browser.typeToFocusedElement(...words);
    }

    /**
     * Refresh the current webpage.
     */
    public async refresh(): Promise<void> {
        await this.browser.refreshPage();
    }

    /**
     * Used to determine when the page is loaded enough
     * @returns {WaitCondition}
     */
    public abstract loadCondition(): WaitCondition;

    /**
     * Evaluates the page's load condition once and returns if it is currently visible.
     */
    public isVisible(): Promise<boolean> {
        return this.loadCondition()(this.browser);
    }
}