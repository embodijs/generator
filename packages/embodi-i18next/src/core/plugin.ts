import { init, type InitOptions } from "i18next";
import type { Plugin } from "vite";

export interface EmbodiI18nConfig {
  localeDir: string;
  i18next: InitOptions;
}

export const embodi18next = (config: EmbodiI18nConfig) =>
  ({
    name: "vite-embodi-i18n",
    async configResolved() {
      await init(config.i18next);
    },
  }) satisfies Plugin;
