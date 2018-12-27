import 'reflect-metadata';
import {error} from "selenium-webdriver";
import {retry} from "../../../src/lib/utils/decorators/retry";
import {config} from "../../../main";
import chai = require('chai');
import StaleElementReferenceError = error.StaleElementReferenceError;
import ElementNotSelectableError = error.ElementNotSelectableError;

const expect = chai.expect;

describe("Test suite for @retry decorator", function () {
    this.timeout(config.timeout);

    class Test {
        public accumulator: number = 0;

        @retry((e: Error) => e instanceof Error, 10)
        public async testFn() {
            this.accumulator++;
            throw new Error();
        }

        @retry((e: Error) => e instanceof StaleElementReferenceError, 10)
        public async testOtherFn() {
            this.accumulator++;
            throw new ElementNotSelectableError();
        }
    }

    it('should retry 10 times', async function () {
        const test: Test = new Test();
        try {
            await test.testFn();
        } catch (e) {
        }
        expect(test.accumulator).to.eq(11);
    });

    it('should not retry at all', async function () {
        const test: Test = new Test();
        try {
            await test.testOtherFn();
        } catch (e) {
        }
        expect(test.accumulator).to.eq(1);
    });
});