import { getAllPages, getPageImportPath, loadPageData, transformPathToUrl } from "./load-content.js";
import { loadConfig } from "../../app/config.js";
import { getUniqueAttributeName } from "./virtuals.js";

export interface CollectionParams {
	only?: string[];
	sortBy?: keyof CollectionMeta;
	sortDirection?: 'asc' | 'desc';
	skip?: number;
	limit?: number;
}
export interface CollectionMeta {
	tag: string;
	updatedAt: Date;
	createdAt?: Date;
	page: string;
	importPath: string;
}

type PreparedFunction = (collections: CollectionMeta[]) => CollectionMeta[];

async function createCollectionsMeta (): Promise<CollectionMeta[]> {
	const config = await loadConfig(process.cwd());
	const rawData = await Promise.all((await getAllPages(config.inputDirs)).map(async (file, dir) => {
		const data = await loadPageData(file) as { tags?: string[], title?: string, name?: string } | undefined;
		const { createdAt, updatedAt } = await file.getMeta();
		if(!data) {
			return undefined;
		}
		const { tags, title, name } = data ;
		if(!tags) {
			return undefined;
		}
		const page = transformPathToUrl(dir, file);
		const importPath = getPageImportPath(file);
		return tags.map((tag: string) => ({
			title: title ?? name,
			tag,
			createdAt,
			updatedAt,
			page,
			importPath
		}));
	}));

	return rawData.filter((collection) => collection !== undefined).flat();
}



export const prepareFilter =
	(keep: string[]): PreparedFunction =>
		(collections: CollectionMeta[]) =>
			collections.filter((collection) => keep.includes(collection.tag));


type CollectionTuple = [CollectionMeta, CollectionMeta];

export const setDirection = ( collections: CollectionTuple,  direction: 'asc' | 'desc') => {
	return direction === 'asc' ? collections : collections.reverse() as CollectionTuple;
}

export const getValue = <T>( collections: CollectionTuple, sortBy: keyof CollectionMeta) => {
	return collections.map((collection) => collection[sortBy]) as [T, T];
}

export const compareString = (sortBy: keyof CollectionMeta, direction: 'asc' | 'desc') => (a: CollectionMeta, b: CollectionMeta) => {
	const [valueA, valueB] = getValue<string>(setDirection([a, b], direction), sortBy);
	return valueA.localeCompare(valueB);
}

export const compareDate = (sortBy: keyof CollectionMeta, direction: 'asc' | 'desc') => (a: CollectionMeta, b: CollectionMeta) => {
	const [valueA, valueB] = getValue<Date>(setDirection([a, b], direction), sortBy);
	return valueA.getTime() - valueB.getTime();
}

export const prepareSort = (sortBy: keyof CollectionMeta, direction: 'desc' | 'asc' = 'asc'): PreparedFunction => {
	if(['page', 'tag'].includes(sortBy)) {
		return (collections: CollectionMeta[]) => collections.sort(compareString(sortBy, direction));
	} else {
		return (collections: CollectionMeta[]) => collections.sort(compareDate(sortBy, direction));
	}
}

export const prepareLimit = (limit?: number, skip: number = 0) => (collections: CollectionMeta[]) => collections.slice(skip, skip + (limit ?? (collections.length - skip)));

export const convertCollectionParamsToPreparedFunctions = (params: CollectionParams) => {
	const { limit, skip, only, sortBy, sortDirection } = params;
	const prepared: PreparedFunction[] = [];
	only && prepared.push(prepareFilter(only));
	sortBy && prepared.push(prepareSort(sortBy, sortDirection));
	(limit || skip) && prepared.push(prepareLimit(limit, skip));
	return prepared;
}

export async function generateCollectionsImportsCode(params: CollectionParams): Promise<string> {
	const allCollections = await createCollectionsMeta();
	const collections = convertCollectionParamsToPreparedFunctions(params).reduce((collections, prepare) => prepare(collections), allCollections);


	const listOfImportsWithId =  collections.map(({ importPath }) => {
		const id = getUniqueAttributeName('col');
		return [id, `import { data as ${id} } from '${importPath}';`];
	});

	const cleanMeta = collections.map(({ importPath, ...exportAbles}) => exportAbles);

	return `
		${listOfImportsWithId.map(([, importLine]) => importLine).join('\n')}
		export const collections = [${listOfImportsWithId.map(([id]) => id).join(', ')}];
		export const meta = ${JSON.stringify(cleanMeta)};
	`;
}
