export class TemplateException extends Error {}
export class ElementNotFoundException extends TemplateException {
    constructor(name: string) {
        super(`Element ${name} seems to be not registered or installed`);
    }  
}