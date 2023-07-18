import type { JsonMap } from "@types";

export function searchJsonByMongoQuery<T extends JsonMap> (query: Query<T>, data: T[]): T[] {
  const keysOfQuery = Object.keys(query);

  if(keysOfQuery.length === 0) {
    return data;
  }

  return data.filter((entrie) => {
    return keysOfQuery.every((key) => {
      if(Object.hasOwn(entrie, key)){
        if(Array.isArray(entrie[key])) {
          return (entrie[key] as Array<unknown>).includes(query[key]);
        } else if (entrie[key] === query[key]) {
          return true;
        }
      } else if (query[key] === false) { //Object do not have the attribute, so it is same as false
        return true;
      }

      return false;
    })
  })
}

export type Query<T> = {
  [x in keyof T]?: T[x] extends Array<infer S> ? S : T[x]
}