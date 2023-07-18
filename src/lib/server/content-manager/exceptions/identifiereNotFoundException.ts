export class IdentifierNotFoundException extends Error {
  identifier: string;
  constructor(identifier: string) {
    super(`Identifier is not registed: ${identifier}`)
    this.identifier = identifier;
  }
}