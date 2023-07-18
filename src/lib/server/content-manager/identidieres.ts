import config from '../../../content.config';


const identifieresArray = config.map((obj) => obj.name);
export type ids = typeof identifieresArray extends (infer U)[] ? U : never;
export type upperIds = `${Uppercase<ids>}`

const identifierEnum = (function () {
  return <Record<upperIds, ids>>config.reduce<Record<string, string>>((acc, cur) => {
    const c: string = cur.name.toUpperCase()
    acc[c] = cur.name;
    return acc;
  }, {})
})();

export default identifierEnum