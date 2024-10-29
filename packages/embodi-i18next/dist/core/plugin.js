import { init } from "i18next";
export const embodi18next = (config) => ({
    name: "vite-embodi-i18n",
    async configResolved() {
        await init(config.i18next);
    },
});
