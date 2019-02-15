
let logger: Logger = console;
let failer: Failer = createDefaultFailer();

export interface Logger {
    log(...messages: string[]): void;
    warn(...messages: string[]): void;
}

export interface Failer {
    warn(...messages: string[]): void;
}

export function setLogger(newLogger: Logger): void {
    logger = newLogger;
}

export function log(...messages: string[]): void {
    logger.log(...messages);
}

export function warn(...messages: string[]): void {
    logger.warn(...messages);
}

export namespace fail {
    export function warn(...messages: string[]): void {
        failer.warn(...messages);
    }
}

export function createDefaultFailer() {
    return {
        warn(...messages: string[]): void {
            warn(...messages);
            throw new Error(messages[0]);
        }
    } as Failer;
}
