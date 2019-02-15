import { Params, SuffixFunction } from "./params";

export interface Tag {
    name: string;
    type: TagType;

    optional: boolean;
    recursive: boolean;
    inline: boolean;
    noprocess: boolean;
    attributes: string;

    lines: string[];
}

export interface TagOptions extends Tag {
    files: string[];
    dest: string;
    src: string;

    prefix?: string;
    suffix?: string | SuffixFunction;
    data?: object;
    relative?: boolean;
    target?: string;
    regexTagStart: string;
    regexTagEnd: string;

    EOL: string;
    params: Params;
}

export type TagType = "script" | "style" | "section" | "process" | "remove";

export function createTagOptions(tag: Tag, params: Params, files: string[], dest: string): TagOptions {
    return Object.assign({}, tag, {
        src: params.filesContext.path,
        data: params.data || {},
        files: files,
        dest: dest,
        prefix: params.prefix,
        suffix: params.suffix,
        relative: params.relative,
        regexTagStart: params.regexTagStart,
        regexTagEnd: params.regexTagEnd,
        target: params.target,
        EOL: params.EOL,
        params: params
    }) as TagOptions;
}
