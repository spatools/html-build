import * as path from "path";
import * as _ from "lodash";
import { IOptions } from "glob";

import { expand, Dictionary } from "./util";

const
    regexTagStartTemplate = "<!--\\s*%parseTag%:(\\w+)\\s*(inline)?\\s*(optional)?\\s*(recursive)?\\s*(noprocess)?\\s*([^\\s]*)\\s*(?:\\[(.*)\\])?\\s*-->", // <!-- build:{type} (inline) (optional) (recursive) {name} [attributes...] --> {} required () optional
    regexTagEndTemplate = "<!--\\s*\\/%parseTag%\\s*-->"; // <!-- /build -->

export interface ParamsOptions {
    beautify?: HTMLBeautifyOptions;
    logOptionals?: boolean;
    replace?: boolean;
    relative?: boolean;
    basePath?: string;
    keepTags?: boolean;
    scripts?: ParamsFiles;
    styles?: ParamsFiles;
    sections?: ParamsFiles;
    data?: Object;
    parseTag?: string;
    processFiles?: boolean;
    processPath?: ProcessPathFunction;
    useFileName?: boolean;
    EOL?: string;

    prefix?: string;
    suffix?: string | SuffixFunction;
    allowUnknownTags?: boolean;
    target?: string;
}

export interface Params {
    beautify?: HTMLBeautifyOptions | boolean;
    logOptionals: boolean;
    replace?: boolean;
    relative: boolean;
    basePath?: string;
    keepTags: boolean;
    scripts: ParamsFiles;
    styles: ParamsFiles;
    sections: ParamsFiles;
    data: Object;
    parseTag: string;
    processFiles: boolean;
    processPath: ProcessPathFunction;
    useFileName: boolean;
    EOL: string;

    prefix?: string;
    suffix?: string | SuffixFunction;
    allowUnknownTags?: boolean;
    target?: string;

    regexTagStart: string;
    regexTagEnd: string;
    filesContext: FilesContext;
}

export interface ParamsFilesOptions extends IOptions {
    files?: string[];
    required?: boolean;
}

export interface HTMLBeautifyOptions {
    indent_inner_html?: boolean;
    indent_body_inner_html?: boolean;
    indent_head_inner_html?: boolean;
    indent_size?: number;
    indent_char?: string;
    wrap_line_length?: number;
    preserve_newlines?: boolean;
    max_preserve_newlines?: number;
    indent_handlebars?: boolean;
    wrap_attributes?: "auto" | "force" | "force-expand-multiline" | "force-aligned" | "aligned-multiple";
    wrap_attributes_indent_size?: number;
    end_with_newline?: boolean;
    extra_liners?: string[];
    eol?: string;
    indent_with_tabs?: boolean;
    disabled?: boolean;
    inline?: string[];
    void_elements?: string[];
    unformatted?: string[];
    content_unformatted?: string[];
    indent_scripts?: "keep" | "separate";
}

export interface FilesContext {
    path: string;
    dir: string;
    file: string;
    filename: string;
    dirname: string;
    platform: string;
}

export type ParamsFiles = Dictionary<ParamsFilesContent | Dictionary<ParamsFilesContent | Dictionary<ParamsFilesContent>>>;

export type ParamsFilesContent = string | string[] | ParamsFilesOptions;

export type SuffixFunction = (path: string, url: string) => string;

export type ProcessPathFunction = (pathes: string[], params: Params, opt: ParamsFilesOptions) => string[];

export function getParams(src: string, opt?: ParamsOptions): Params {
    const params = Object.assign(
        {
            beautify: false,
            logOptionals: false,
            relative: true,
            keepTags: false,
            scripts: {},
            styles: {},
            sections: {},
            data: {},
            parseTag: "build",
            processFiles: false,
            processPath: defaultProcessPath
        } as any as Params,
        opt || {}
    );

    setTagRegexes(params, params.parseTag);
    params.filesContext = createFilesContext(src);

    return params;
}

/** Takes an array of paths and validates them. */
function defaultProcessPath(pathes: string[], params: Params, opt: ParamsFilesOptions): string[] {
    const
        flattenPaths = Array.isArray(pathes) ? _.flattenDeep(pathes) : pathes,
        remote = flattenPaths.filter(path => /^((http|https):)?(\\|\/\/)/.test(path)); //is http, https, or // (for loading from cdn)

    let local = expand(pathes, opt);
    if (params.relative && opt.cwd) {
        local = local.map(src => path.join(opt.cwd as string, src));
    }

    return _.uniq(local.concat(remote));
}

function setTagRegexes(params: Params, parseTag: string) {
    params.regexTagStart = regexTagStartTemplate.replace(/%parseTag%/, () => parseTag);
    params.regexTagEnd = regexTagEndTemplate.replace(/%parseTag%/, () => parseTag);
}

function createFilesContext(src: string): FilesContext {
    return {
        path: src,
        dir: path.dirname(src),
        file: path.basename(src),
        filename: path.basename(src, path.extname(src)),
        dirname: path.basename(path.dirname(src)),
        platform: process.platform
    };
}
