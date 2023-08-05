export class LoadException extends Error {

    constructor(
        protected statusCode: number, 
        message: string
    ) {
        super(message);
    }

    getHttpStatusCode(): number {
        return this.statusCode;
    }
}
export class PageLoadException extends LoadException {}