#!/usr/bin/env node

import {sync} from "glob";
import * as path from "path";
import {builder} from "./src/config/cli/commands/run";

export class TestRunner {
    public run(): void {
        const Mocha = require('mocha-parallel-tests').default;
        const mocha = new Mocha();

        this.parseArguments();
        const runnableSpecs: Array<string> = this.getRunnableSpecs({
            directories: config.directories,
            files: config.files,
            exclusions: {
                directories: config.ignoreDirectories,
                files: config.ignore
            }
        });

        runnableSpecs.forEach((spec: string) => mocha.addFile(spec));

        mocha.setMaxParallel(config.processCount);
        mocha.reporter('spec');
        mocha.retries(config.retries);
        mocha.run();
    }

    private parseArguments(): void {
        const args: any = require('yargs')
            .command('run', 'Run tests.', builder)
            .config()
            .demandCommand(1, 'Please provide at least one command.')
            .recommendCommands()
            .help()
            .config()
            .strict()
            .argv;

        Object.keys(args).forEach((key: any) => config[key] = args[key]);
    }

    /**
     * Get the list of runnable specs for each worker thread.
     * @returns {Array<Array<string>>}
     */
    private getRunnableSpecs(filter: Filter): Array<string> {
        return filter
            .directories
            .reduce((prev: Array<string>, directory: string) => this.filterSpecs({
                directories: [directory],
                files: filter.files,
                exclusions: filter.exclusions,
                recursive: filter.recursive
            }), []);
    }

    /**
     * Matches all files in a directory according to a glob pattern.
     * @param filter
     */
    private filterSpecs(filter: Filter): Array<string> {
        const options: any = {
            absolute: true,
        };
        if (filter.exclusions && (filter.exclusions.directories || filter.exclusions.files)) {
            options.ignore = this.getExclusions({
                directories: filter.exclusions.directories,
                files: filter.exclusions.files
            });
        }
        if (filter.files) {
            return filter
                .files
                .reduce((prev: Array<string>, filename: string, index: number) =>
                    this
                        .isNodeSpec(index) ? sync(filter.recursive ? `**/${filename}.ts` : `${filename}.ts`, options)
                        .concat(prev) : prev, []);
        }
        options.cwd = path.resolve(__dirname, filter.directories[0]);
        return sync(filter.recursive ? `**/*Spec.ts` : `*Spec.ts`, options)
            .filter((spec: string, index: number) => this.isNodeSpec(index));
    }

    /**
     * Checks if this spec should be run on this node.
     */
    private isNodeSpec(index: number): boolean {
        return index % config.helperCount == config.buildHelperId;
    }

    /**
     * Gets glob patterns for excluded directories and files.
     */
    private getExclusions(exclusions: Exclusions): Array<string> {
        return exclusions.directories
            .map((directory: string) => `**/${directory}/**/*`)
            .concat(exclusions.files
                .map((file: string) => `**/${file}.ts`));
    }
}

type Filter = {
    directories: Array<string>,
    files?: Array<string>,
    exclusions?: Exclusions,
    recursive?: boolean
};
type Exclusions = {
    directories: Array<string>,
    files: Array<string>
};

export const config: any = {
    recursive: true,
    verbose: false,
    timeout: 325000,
    headless: false,
    retries: 0,
};

if (require.main && require.main.filename == __filename) {
    new TestRunner().run();
}