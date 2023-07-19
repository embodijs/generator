
import embodi from 'embodi-template/config'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}', '../example/content/**/*.json'],
  theme: embodi.tailwindcss.theme ?? {},
}
