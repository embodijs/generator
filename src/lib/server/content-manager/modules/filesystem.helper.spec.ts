import { faker } from "@faker-js/faker";
import { searchJsonByMongoQuery } from "./filesystem.helper";

const defaultData = [{
  "type": "Template",
  "id": "Item:icon-focused",
  "name": "Item:icon-focused",
  "base": true,
  "secondary": true,
  "description": "Link to other sides like social media",
  "categories": [
    "Social"
  ],
  "component": {}
}, {
  "type": "Template",
  "name": "Social",
  "base": true,
  "description": "List of links with a big Icons, good to link social media",
  "categories": [
    "Social"
  ],
  "component": {}
},{
  "type": "Template",
  "name": "Text",
  "base": true,
  "categories": [
    "Text"
  ],
  "description": "Text input filed with multiple sizes",
  "component": {
    "type": "Text"
  }
}]

describe('test serachJsonByMongoQuery', () => {
  it('compare one string', () => {
    const data = [{
      test: 'value'
    }, {
      test: 'other'
    }]
    const query = {
      test: 'other'
    }
    const result = searchJsonByMongoQuery(query, data)

    expect(Array.isArray(result)).toBeTruthy()
    expect(result.length).toBe(1);
    expect(result).toEqual([query]);
  })

  it('get all values with empty search object', () => {
    const data = JSON.parse(faker.datatype.json());

    const result = searchJsonByMongoQuery({}, Array.isArray(data) ? data : [data]);
    expect(result).toEqual(Array.isArray(data) ? data : [data]);
  })

  it('find in arraies', () => {
    const query = {
      categories: "Social"
    }

    const result = searchJsonByMongoQuery(query, defaultData);
    expect(result).toEqual([defaultData[0], defaultData[1]])
  })


  it('handle false same as undefined', () => {
    
    const query = {
      categories: "Social",
      secondary: false
    }

    const result = searchJsonByMongoQuery(query, defaultData);
    expect(result).toEqual([defaultData[1]])
  })

  it('find a simple string value', () => {
    const query = {
      name: defaultData[0].name
    }

    const result = searchJsonByMongoQuery(query, defaultData);
    expect(result).toEqual([defaultData[0]])
  })

})