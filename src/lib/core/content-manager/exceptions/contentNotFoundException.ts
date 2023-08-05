export class ContentNotFoundException extends Error {
	identifier: string;

	constructor(identifier: string) {
		super(`Couldn't find a content with the identifier: ${identifier}`);
		this.identifier = identifier;
	}
}
