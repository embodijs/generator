import { IdentifierAlreadyRegsiteredExcpetion } from './exceptions/identifierAlreadyRegisteredException';
import { IdentifierNotFoundException } from './exceptions/identifiereNotFoundException';
import type { ContentManager } from './contentManager';

const handlers: Record<string, ContentManager> = {};

export function Content<T extends ContentManager>(name: string): T {
	if (Object.hasOwn(handlers, name)) {
		return <T>handlers[name];
	}

	throw new IdentifierNotFoundException(name);
}

Content.register = <T extends ContentManager, E extends string>(name: E, handler: T) => {
	if (Object.hasOwn(handlers, name)) {
		throw new IdentifierAlreadyRegsiteredExcpetion(name);
	}

	handlers[name] = <ContentManager>(handler as unknown);
};
