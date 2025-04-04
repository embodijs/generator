import type { Preprocessor, PreprocessorGroup } from "svelte/compiler";

export const imagePreprocess = () => {
	return {
		name: 'svelte-preprocessor-name',
		markup: ({ content, filename}) => {
      if (content.includes('img:embodi')) {
        console.log(filename)
      }
		},

	} satisfies PreprocessorGroup
};
