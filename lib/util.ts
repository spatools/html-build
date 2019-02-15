import * as fs from "fs";
import * as glob from "glob";

export type Dictionary<T = any> = { [key: string]: T };

const isFileRegex = /\.(\w+){2,4}$/;

export function expand(pattern: string | string[], options?: glob.IOptions): string[] {
    if (!Array.isArray(pattern)) {
        return glob.sync(pattern, options);
    }

    return Array.prototype.concat.apply(
        [],
        pattern.map(p => glob.sync(p, options))
    );
}

export function isFile(src: string): boolean {
    return isFileRegex.test(src);
}

export function readFile(src: string): string {
    return fs.readFileSync(src, { encoding: "utf8" });
}

export function writeFile(src: string, content: string): void {
    fs.writeFileSync(src, content, { encoding: "utf8" });
}
