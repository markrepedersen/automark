import {logging, WebDriver} from "selenium-webdriver";
import Entry = logging.Entry;

let fs = require('fs');

export default class Logger {
    private driver: WebDriver;

    constructor(driver: WebDriver) {
        this.driver = driver;
    }

    public async getPerformanceLogs(): Promise<void> {
        const logs: Entry[] = await this
            .driver
            .manage()
            .logs()
            .get('performance');
        fs.writeFileSync('performance_log.json', JSON.stringify(logs, null, "\t"), 'utf-8');
    }
}