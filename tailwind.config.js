import embodi from 'embodi-template/config';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: embodi.tailwindcss.theme ?? {}
};
