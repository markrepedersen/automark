import {WebComponent} from "./WebComponent";
import {join} from 'path';
import * as os from "os";


export class FileImport extends WebComponent {
    /**
     * Imports a local file from local file system.
     * Expects an absolute path.
     * @param {string} fileName
     * @returns {Promise<void>}
     */
    public async importLocalFile(fileName: string): Promise<void> {
        await this.element.sendKeys(fileName);
    }

    /**
     * Imports a local file from a remote file system.
     * Expects a path separated by forward slashes.
     * @param {string} fileName
     * @returns {Promise<void>}
     */
    public async importRemoteFile(fileName: string): Promise<void> {
        await this.element.sendKeys(this.isWindows() ? '\\\\' : '/net/', join(...fileName.split('/')));
    }

    /**
     * Checks if current OS is Windows.
     * @returns {boolean}
     */
    private isWindows(): boolean {
        return os.platform() === 'win32';
    }
}