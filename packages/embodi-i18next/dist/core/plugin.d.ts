import { type InitOptions } from "i18next";
export interface EmbodiI18nConfig {
    localeDir: string;
    i18next: InitOptions;
}
export declare const embodi18next: (config: EmbodiI18nConfig) => {
    name: string;
    configResolved(this: void): Promise<void>;
};
