import {faker} from '@faker-js/faker'

export const createRandomArray = (min: number, max: number) => {
    const amount = faker.number.int({min, max});
    const array = [];
    for (let i = 0; i < amount; i++) {
        const random = Math.random()*10;
        if(random > 9){
            array.push(faker.lorem.lines());
        } else if (random > 8) {
            array.push(faker.lorem.paragraph());
        } else if (random > 7) {
            array.push(faker.number.float());
        } else if (random > 6) {
            array.push(faker.number.int());
        } else if (random > 5) {
            array.push(faker.git.branch());
        } else if (random > 4) {
            array.push(faker.word.adverb());
        } else if (random > 3) {
            array.push(faker.git.commitMessage());
        } else if (random > 2) {
            array.push(faker.git.commitSha());
        } else if (random > 1) {
            array.push(faker.phone.number());
        } else {
            array.push(faker.number.hex());
        }
    }
    return array;
}

export const createRandomJson = () => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < 10; i++) {
        const random = Math.random()*11;
        if(random > 10){
            obj[faker.lorem.word()] = createRandomArray(3, 54);
        } else if(random > 9){
            obj[faker.lorem.word()] = faker.lorem.lines();
        } else if (random > 8) {
            obj[faker.lorem.word()] = faker.lorem.paragraph();
        } else if (random > 7) {
            obj[faker.lorem.word()] = faker.number.float();
        } else if (random > 6) {
            obj[faker.lorem.word()] = faker.number.int();
        } else if (random > 5) {
            obj[faker.lorem.word()] = faker.git.branch();
        } else if (random > 4) {
            obj[faker.lorem.word()] = faker.word.adverb();
        } else if (random > 3) {
            obj[faker.lorem.word()] = faker.git.commitMessage();
        } else if (random > 2) {
            obj[faker.lorem.word()] = faker.git.commitSha();
        } else if (random > 1) {
            obj[faker.lorem.word()] = faker.phone.number();
        } else {
            obj[faker.lorem.word()] = faker.number.hex();
        }
    }
    return obj;
}