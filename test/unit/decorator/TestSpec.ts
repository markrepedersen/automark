import 'reflect-metadata';
import {BaseTest} from "../../BaseTest";
import chai = require('chai');
import {config} from "../../../main";
import {getDecoratedProperties} from "../../../src/lib/utils";
import {Test} from "../../../src/lib/utils/decorators/test";
import testable = Test.testable;
import test = Test.test;

const expect = chai.expect;

@testable({
    testSuiteName: 'decorator test',
    testBrowserType: 'chrome',
    testTimeout: 500
})
class DecoratorTest extends BaseTest {
    @test({
        message: "test_message"
    })
    public async runTests1() {
    }

    @test({
        message: "test_message"
    })
    public async runTests2() {
    }

    @test({
        message: 'test_message',
        timeout: 58
    })
    public async runTests3() {
    }

    @test({message: "test_message", only: true})
    public async runTests4() {
    }
}

describe("Test suite for @test decorator", function () {
    this.timeout(config.timeout);

    const message: string = "test_message";
    let specClass: DecoratorTest;
    let runTests1: any;
    let runTests2: any;
    let runTests3: any;
    let runTests4: any;

    before(function () {
        specClass = new DecoratorTest();
        const decoratedTests: Array<Function> = getDecoratedProperties(Object.getPrototypeOf(specClass), 'test');
        runTests1 = decoratedTests.find((func: Function) => func.name == 'runTests1');
        runTests2 = decoratedTests.find((func: Function) => func.name == 'runTests2');
        runTests3 = decoratedTests.find((func: Function) => func.name == 'runTests3');
        runTests4 = decoratedTests.find((func: Function) => func.name == 'runTests4');
    });

    it('decorated class should have a test suite name', function () {
        expect((specClass as any).testSuiteName).to.eq('decorator test');
    });

    it('decorated class should have a browser type', function () {
        expect((specClass as any).testBrowserType).to.eq('chrome');
    });

    it('decorated class should have a timeout', function () {
        expect((specClass as any).testTimeout).to.eq(500);
    });

    it('decorated test should have message shown having only string as argument', function () {
        expect(runTests1.message).to.equal(message);
    });

    it('decorated test should have message shown having object as argument', function () {
        expect(runTests2.message).to.equal(message);
    });

    it('decorated test should have timeout', function () {
        expect(runTests3.timeout).to.equal(58);
    });

    it('decorated test should have message shown and only should be true', function () {
        expect(runTests4.message).to.equal(message);
        expect(runTests4.only).to.be.true;
    });
});