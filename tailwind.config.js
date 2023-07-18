
import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}', '../example/content/**/*.json'],
  theme: {
    colors: {
      primary: colors.zinc,
      neutral: colors.neutral,
      success: colors.emerald,
      unvisible: colors.zinc['100'],
      info: colors.blue,
      warning: colors.orange,
      danger: colors.red,
      white: colors.white,
      black: colors.black,
      overlay: {
        text: "#FAFAFACF",
        light: "#EAEAEA4A"
      },
      transparent: colors.transparent,
      current: colors.current,
    },
    extend: {
      width: {
        '128': '32rem',
        '160': '40rem'
      },
      margin: {
        '128': '32rem',
        '160': '40rem'
      }
    },
  },
  plugins: [
    plugin(function ({addVariant}) {
      addVariant('hocus', ['&:hover', '&:focus'])
    })
  ],
}
