import {BaseTest} from "../../../../test/BaseTest";
import {registerDecorator} from "./utils";
import {config} from "../../../../main";

export namespace Test {
  /**
   * Any method that is decorated by this decorator is declared a runnable test.
   *
   * @param options The message for the test or an options object.
   *
   * The options object may have the following properties:
   * {string} message: The message for the test
   * {boolean} only: Whether this test should be the only test to run or not.
   * {number} timeout: The timeout for this test.
   * {number} deflake: The number of times to run this test. Used when trying to reproduce an error on a flaky test.
   * {boolean} closeOnFinish: Whether to close the browser when the test has finished. Useful when debugging.
   */
  export function test<T extends BaseTest>(options: TestOptions) {
    const testObj = {
      message: options.message,
      only: options.only,
      timeout: options.timeout,
    };
    return function test(target: T, propertyKey: string) {
      Object.assign((target as any)[propertyKey], testObj);
      registerDecorator(target, propertyKey, "test");
    };
  }

  export function testable(
    options: TestableOptions
  ): (constructor: Function) => void {
    return function (constructor: Function): void {
      registerDecorator(constructor.prototype, constructor.name, "testable");
      constructor.prototype.filename = constructor.name;
      constructor.prototype.testSuiteName = options.testSuiteName;
      constructor.prototype.testBrowserType = options.testBrowserType;
      constructor.prototype.testTimeout = options.testTimeout;
      constructor.prototype.keepBrowserOpen = options.keepBrowserOpen;
      constructor.prototype.testUrl = options.testUrl;
      constructor.prototype.testUsername = options.testUsername;
      constructor.prototype.testPassword = options.testPassword;
      if (options.testUrl) {
        setBrowserTestableInfo(
          constructor.prototype,
          "testUrl",
          options.testUrl
        );
      }
      if (options.useReverseProxy) {
        if (config.reverseProxyUrl) {
          setBrowserTestableInfo(
            constructor.prototype,
            "testUrl",
            config.reverseProxyUrl
          );
        } else {
          throw Error(
            "Reverse proxy was not specified in the build parameters"
          );
        }
      }
      if (options.testUsername) {
        setBrowserTestableInfo(
          constructor.prototype,
          "testUsername",
          options.testUsername
        );
      }
      if (options.testPassword) {
        setBrowserTestableInfo(
          constructor.prototype,
          "testPassword",
          options.testPassword
        );
      }
    };

    function setBrowserTestableInfo(
      target: any,
      propertyKey: string,
      value: any
    ): any {
      if (propertyKey != "constructor") {
        Object.defineProperty(target, propertyKey, {
          configurable: true,
          enumerable: true,
          get() {
            return value;
          },
        });
      }
    }
  }

  type TestableOptions = {
    testSuiteName: string;
    testBrowserType?: "chrome" | "edge";
    testTimeout?: number;
    keepBrowserOpen?: boolean;
    testUrl?: string;
    useReverseProxy?: boolean;
    testUsername?: string;
    testPassword?: string;
  };

  type TestOptions = {
    message: string;
    only?: boolean;
    timeout?: number;
  };
}
