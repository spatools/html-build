import * as path from "path";
import * as URL from "url";
import * as _ from "lodash";
import * as beautify from "js-beautify";

import * as log from "./log";
import { Tag, TagOptions, TagType, createTagOptions } from "./tag";
import { Params, ParamsFilesOptions } from "./params";
import { readFile, Dictionary, isFile } from "./util";

const
    processFileRegex = /\$\(([^\)]*)\)/,

    templates = {
        "script": "<script <%= attributes %> src=\"<%= src %>\"></script>",
        "script-inline": "<script <%= attributes %>><%= src %></script>",
        "style": "<link <%= attributes %> href=\"<%= src %>\" />",
        "style-inline": "<style <%= attributes %>><%= src %></style>"
    } as Dictionary<string>,

    validators = {
        script: validateBlockWithName,
        style: validateBlockWithName,
        section: validateBlockWithName,

        process: validateBlockAlways,
        remove: validateBlockAlways,

        //base method
        validate(tag: Tag, params: Params): boolean | string[] {
            if (!validators[tag.type]) {
                return false;
            }

            return validators[tag.type](tag, params);
        }
    },

    processors = {
        script: processHtmlTag,
        style: processHtmlTag,

        section(options: TagOptions) {
            return options.files.map(function (f) {
                const content = readFile(f);

                return options.recursive ?
                    transformContent(content, options.params, options.dest) :
                    content;
            }).join(options.EOL);
        },

        process(options: TagOptions) {
            return options.lines
                .map(l => processTemplate(l, options))
                .join(options.EOL)
                .replace(new RegExp(options.regexTagStart), "")
                .replace(new RegExp(options.regexTagEnd), "");
        },
        remove(options: TagOptions) {
            if (!options.name) return "";

            const targets = options.name.split(",");
            if (options.target && targets.indexOf(options.target) < 0) {
                return options.lines
                    .join(options.EOL)
                    .replace(new RegExp(options.regexTagStart), "")
                    .replace(new RegExp(options.regexTagEnd), "");
            }

            return "";
        },

        //base method
        transform(options: TagOptions) {
            return processors[options.type](options);
        }
    };

export function transformContent(content: string, params: Params, dest: string) {
    const tags = getBuildTags(content, params);

    tags.forEach(tag => {
        const
            raw = tag.lines.join(params.EOL),
            tagFiles = validators.validate(tag, params);

        let result = "", prefix = "", suffix = "";

        if (tagFiles) {
            const options = createTagOptions(tag, params, tagFiles === true ? [] : tagFiles, dest);
            result = processors.transform(options);
        }
        else if (tagFiles === false) {
            log.warn(`Unknown tag detected: "${tag.type}"`);

            if (!params.allowUnknownTags) {
                log.fail.warn(`Use "parseTag" or "allowUnknownTags" options to avoid this issue`);
            }
        }
        else if (tag.optional) {
            if (params.logOptionals) {
                log.warn(`Tag with type: "${tag.type}" and name: "${tag.name}" is not configured in your Gruntfile.js but is set optional, deleting block !`);
            }
        }
        else {
            log.fail.warn(`Tag with type "${tag.type}" and name: "${tag.name}" is not configured in your Gruntfile.js !`);
        }

        if (params.keepTags) {
            prefix = (<string[]>raw.match(new RegExp(params.regexTagStart + "\\s*")))[0];
            suffix = (<string[]>raw.match(new RegExp(params.regexTagEnd + "\\s*")))[0];
        }

        content = content.replace(raw, () => prefix + result + suffix);
    });

    if (params.beautify) {
        content = beautify.html(content, typeof params.beautify === "object" ? params.beautify : {});
    }

    return content;
}

function getBuildTags(content: string, params: Params): Tag[] {
    const
        lines = content.replace(/\r?\n/g, "\n").split(/\n/),
        tags = [] as Tag[];

    let tag = false,
        last: Tag;

    lines.forEach(l => {
        const
            tagStart = l.match(new RegExp(params.regexTagStart)),
            tagEnd = new RegExp(params.regexTagEnd).test(l);

        if (tagStart) {
            tag = true;
            last = {
                type: tagStart[1] as TagType,
                inline: !!tagStart[2],
                optional: !!tagStart[3],
                recursive: !!tagStart[4],
                noprocess: !!tagStart[5],
                name: tagStart[6],
                attributes: tagStart[7],
                lines: []
            };

            tags.push(last);
        }

        // switch back tag flag when endbuild
        if (tag && tagEnd) {
            last.lines.push(l);
            tag = false;
        }

        if (tag && last) {
            last.lines.push(l);
        }
    });

    return tags;
}

function validateBlockWithName(tag: Tag, params: Params): string[] | boolean {
    const
        keys = tag.name.split("."),
        ln = keys.length;

    let src = (<any>params)[tag.type + "s"];

    for (let i = 0; i < ln; i++) {
        src = src[keys[i]]; // Search target
    }

    if (src) {
        // check if we want to use current file name, if so update src where necessary
        if (params.useFileName && src.toString().match(/_CURRENT_FILE_NAME_/g)) {
            src = src.toString().replace("_CURRENT_FILE_NAME_", params.filesContext.path);
        }

        let opt = {} as ParamsFilesOptions,
            files = src as string[];

        if (typeof src === "object") {
            if (src.files) {
                opt = _.omit(src, "files");
                files = src.files;
            }
            else {
                // if paths are named, just take values
                files = _.values(src);
            }
        }

        if (!Array.isArray(files)) {
            files = [files];
        }

        if (params.processFiles) {
            const filesContext = params.filesContext;
            files = files.map(f =>
                f.replace(processFileRegex, (val, name) => (<any>filesContext)[name] || val)
            );
        }

        return params.processPath(files, params, opt);
    }

    return false;
}

function validateBlockAlways(tag: Tag, params: Params): boolean {
    return true;
}

function processHtmlTag(options: TagOptions): string {
    if (options.inline) {
        const content = options.files.map(readFile).join(options.EOL);
        return processHtmlTagTemplate(options, content);
    }
    else {
        const destDir = options.relative && isFile(options.dest) ? path.dirname(options.dest) : options.dest;

        return options.files.map(f => {
            let url = (options.relative && !/^((http|https):)?(\\|\/\/)/.test(f)) ? path.relative(destDir, f) : f;
            url = url.replace(/\\/g, "/");

            if (options.prefix) {
                url = URL.resolve(options.prefix.replace(/\\/g, "/"), url);
            }

            if (options.suffix) {
                const suffix = typeof options.suffix === "function" ?
                    options.suffix(f, url) :
                    options.suffix;

                if (suffix) {
                    url += "?" + suffix;
                }
            }

            return processHtmlTagTemplate(options, url);
        }).join(options.EOL);
    }
}

function processHtmlTagTemplate(options: TagOptions, src: string): string {
    const
        template = templates[options.type + (options.inline ? "-inline" : "")],
        attrs = createAttributes(options, src);

    if (!options.inline || options.noprocess) {
        return template
            .replace(/\<\%\= (src|attributes) \%\>/g, (_, p1) => {
                if (p1 === "src") return src;
                else if (p1 === "attributes") return attrs;
                else return "";
            });
    }
    else {
        return processTemplate(template, options, src, attrs);
    }
}

function processTemplate(template: string, options: TagOptions, src?: string, attrs?: string): string {
    const data = createTemplateData(options, src, attrs);
    return _.template(template)(data);
}

function createAttributes(options: TagOptions, src: string): string {
    let attrs = options.attributes || "";

    if (options.type === "script") {
        attrs = `type="text/javascript" ${attrs}`;
    }
    else if (options.type === "style" && !options.inline) {
        if (path.extname(src) === ".less") {
            attrs = `type="text/css" rel="stylesheet/less" ${attrs}`;
        }
        else {
            attrs = `type="text/css" rel="stylesheet" ${attrs}`;
        }
    }

    return attrs.trim();
}

function createTemplateData(options: TagOptions, src?: string, attrs?: string): any {
    const extend = {
        src: src || "",
        attributes: attrs || ""
    };

    return Object.assign({}, options.data, extend);
}
