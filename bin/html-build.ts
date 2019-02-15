#!/usr/bin/env node

import * as nopt from "nopt";
import * as path from "path";

import { build } from "../index";
import { ParamsOptions } from "../lib/params";
import { Dictionary, expand } from "../lib/util";

const
    knownOpts = {
        "scripts": Array,
        "styles": Array,
        "sections": Array,
        "config": path,
        "help": Boolean,
        "beautify": Boolean,
        "logOptionals": Boolean,
        "replace": Boolean,
        "relative": Boolean,
        "keepTags": Boolean,
        "basePath": path,
        "parseTag": String,
        "processFiles": Boolean,
        "useFileName": Boolean,
        "allowUnknownTags": Boolean,
        "EOL": String,
        "target": String
    },
    shortHands = {
        "c": ["--config"]
    };

main();

function main() {
    let parsed = nopt(knownOpts, shortHands, process.argv, 2);
    const [srcPattern, dest] = parsed.argv.remain;

    if (!srcPattern || parsed.help) {
        return help();
    }

    if (parsed.config) {
        const config = require(parsed.config);
        parsed = Object.assign(parsed, config);
    }

    parsed.scripts = parseFiles(parsed.scripts || []);
    parsed.styles = parseFiles(parsed.styles || []);
    parsed.sections = parseFiles(parsed.sections || []);

    const srcs = expand(srcPattern.split(","));

    srcs.forEach(src => {
        build(src, dest, parsed as ParamsOptions);
        console.log("> File " + src + " processed !");
    });
}

function parseFiles(files: object | string[]): object {
    if (!Array.isArray(files)) {
        return files;
    }

    return files.reduce((res, f) => {
        const [target, files] = f.split("=");

        res[target] = expand(files.split(","));

        return res;
    }, {} as Dictionary<string[]>);
}

function help() {
    console.log("");
    console.log("$ build-html [options] {input} [dest]");
    console.log("");
    console.log("Replacements:");
    console.log("  --scripts target=file1.js,file2.js        Replace build:scripts tags of specified target with given files.");
    console.log("  --styles target=file1.css,file2.css       Replace build:styles tags of specified target with given files.");
    console.log("  --sections target=file1.html,file2.html   Replace build:sections tags of specified target with given files.");
    console.log("");
    console.log("Options:");
    console.log("  --beautify               Beautify HTML output using 'beautify-js'.");
    console.log("  --logOptionals           Log an alert in console if some optional tags are not rendered.");
    console.log("  --replace                Replace src file instead of creating a new file.");
    console.log("  --relative               Make generated path relative to dest path.");
    console.log("                           If this arguments is specified with false value, generated paths");
    console.log("                           will be written as you configure in your Gruntfile.");
    console.log("  --keepTags               Keep htmlbuild special tags after HTML compilation.");
    console.log("  --basePath {path}        Set to copy the whole folder structure.");
    console.log("  --parseTag {tag}         Specify the html-build tag name, default is 'build'.");
    console.log("  --allowUnknownTags       Do not fail the task if the parser meet unknown tags.");
    console.log("                           Useful when working with grunt-usemin.");
    console.log("  --EOL {eol}              Force output EOL.");
    console.log("                           If not specified, it will be detected from the input file.");
    console.log("  --target {target}        Specify build target to remove only targetted parts.");
    console.log("  --processFiles           Set to true to enable files src configuration replacement.");
    console.log("                           By enabling it, the following keywords will be replaced in src");
    console.log("                           for each file processed during build:");
    console.log("                             - $(filename): Current filename (without extension).");
    console.log("                             - $(file): Current filename (with extension).");
    console.log("                             - $(dirname): Current directory name.");
    console.log("                             - $(path): Current file path.");
    console.log("                             - $(dir): Current directory path.");
    console.log("                             - $(platform): The result of process.platform.");
    console.log("");
}
