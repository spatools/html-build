import * as path from "path";

import { ParamsOptions, Params, getParams } from "./lib/params";
import { readFile, writeFile, isFile } from "./lib/util";
import { transformContent } from "./lib/processors";

export function build(src: string, dest: string, options: ParamsOptions): void {
    const params = getParams(src, options);

    const destPath = getDestPath(src, dest, params);
    const content = createContent(src, dest, params);

    // write the contents to destination
    writeFile(destPath, content);
}

function getDestPath(src: string, dest: string, params: Params): string {
    // replace files in the same folder
    if (params.replace) {
        return src;
    }
    // copy original folder structure into dest folder and compile templates
    else if (params.basePath || params.basePath === "") {
        // new path = dest + (src path without basePath at the beginning)
        return dest + src.substring(params.basePath.length, src.length);
    }
    // Regex for path
    else if (isFile(dest)) {
        return dest;
    }
    // default: copy all files into destination
    else {
        return path.join(dest, path.basename(src));
    }
}

function createContent(src: string, dest: string, params: Params): string {
    let content = readFile(src);

    content = ensureContent(content, params);
    content = transformContent(content, params, dest);

    return content;
}

function ensureContent(content: string, params: Params) {
    if (!params.EOL) {
        const match = content.match(/\r?\n/);
        params.EOL = match ? match[0] : "\n";
    }

    return content.replace(/\r?\n/g, params.EOL);
}
