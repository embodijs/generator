export class IdentifierAlreadyRegsiteredExcpetion extends Error {
  identifier: string;
  
  constructor(identifier: string) {
    super(`Identifier is already registed: ${identifier}`);
    this.identifier = identifier;
  }
}