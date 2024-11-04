import { generateContentMap, loadData } from './load-content.js';
import { loadConfig } from '../../app/config.js';
import { pipe } from 'pipe-and-combine';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export interface CollectionParams {
	only?: string[];
	sortBy?: keyof CollectionMeta;
	sortDirection?: 'asc' | 'desc';
	skip?: number;
	limit?: number;
}
export interface CollectionMeta {
	tag: string;
	url: string;
	updatedAt?: Date;
	createdAt?: Date;
	data: Record<string, unknown>;
}

type PreparedFunction = (collections: CollectionMeta[]) => CollectionMeta[];

const cfd = dirname(fileURLToPath(import.meta.url)); // Current file directory
const pathContentHelpers = resolve(cfd, '../../app/content-helper.js');

async function createCollectionsMeta(): Promise<CollectionMeta[]> {
	const config = await loadConfig(process.cwd());

	const pagesWithRef = await generateContentMap(config.inputDirs);
	const dataWithMeta = await loadData(...pagesWithRef);
	const dataWithTags = dataWithMeta.filter(({ data }) => data?.tags && Array.isArray(data.tags));

	const dataPerTag = dataWithTags
		.map((page) =>
			page.data.tags.map((tag: string) => ({
				...page,
				tag
			}))
		)
		.flat();

	return dataPerTag;
}

export const prepareFilter =
	(keep: string[]): PreparedFunction =>
	(collections: CollectionMeta[]) =>
		collections.filter((collection) => keep.includes(collection.tag));

type CollectionTuple = [CollectionMeta, CollectionMeta];

export const setDirection = (collections: CollectionTuple, direction: 'asc' | 'desc') => {
	return direction === 'asc' ? collections : (collections.reverse() as CollectionTuple);
};

export const getValue = <T>(collections: CollectionTuple, sortBy: keyof CollectionMeta) => {
	return collections.map((collection) => collection[sortBy]) as [T, T];
};

export const compareString =
	(sortBy: keyof CollectionMeta, direction: 'asc' | 'desc') =>
	(a: CollectionMeta, b: CollectionMeta) => {
		const [valueA, valueB] = getValue<string>(setDirection([a, b], direction), sortBy);
		return valueA.localeCompare(valueB);
	};

export const compareDate =
	(sortBy: keyof CollectionMeta, direction: 'asc' | 'desc') =>
	(a: CollectionMeta, b: CollectionMeta) => {
		const [valueA, valueB] = getValue<Date>(setDirection([a, b], direction), sortBy);
		return valueA.getTime() - valueB.getTime();
	};

export const prepareSort = (
	sortBy: keyof CollectionMeta,
	direction: 'desc' | 'asc' = 'asc'
): PreparedFunction => {
	if (['page', 'tag'].includes(sortBy)) {
		return (collections: CollectionMeta[]) => collections.sort(compareString(sortBy, direction));
	} else {
		return (collections: CollectionMeta[]) => collections.sort(compareDate(sortBy, direction));
	}
};

export const prepareLimit =
	(limit?: number, skip: number = 0) =>
	(collections: CollectionMeta[]) =>
		collections.slice(skip, skip + (limit ?? collections.length - skip));

export const convertCollectionParamsToPreparedFunctions = (params: CollectionParams) => {
	const { limit, skip, only, sortBy, sortDirection } = params;
	const prepared: PreparedFunction[] = [];
	only && prepared.push(prepareFilter(only));
	sortBy && prepared.push(prepareSort(sortBy, sortDirection));
	(limit || skip) && prepared.push(prepareLimit(limit, skip));
	return prepared;
};

const hasAnyFilter = (params: CollectionParams) => {
	return Object.values(params).some((value) => value !== undefined);
};

const dummyFunction: PreparedFunction = (d: CollectionMeta[]) => d;
const optional = <TV, TA>(value: TV | undefined, alternative: TA): NonNullable<TV> | TA =>
  value == null ? alternative : value;

export const initPipeline = (params: CollectionParams): PreparedFunction => {
	const { limit, skip, only, sortBy, sortDirection } = params;
	return pipe(
		optional(only && prepareFilter(only), dummyFunction),
		optional(sortBy && prepareSort(sortBy, sortDirection), dummyFunction)),
		optional((limit == null || skip == null) ? undefined : prepareLimit(limit, skip), dummyFunction)
	);
};

export async function generateCollectionsImportsCode(params: CollectionParams): Promise<string> {
	const collectionMetas = await createCollectionsMeta();

	const filterPipe = initPipeline(params);
	const filteredCollections = filterPipe(collectionMetas);
	const urls = filteredCollections.map(({ url }) => url);

	const pagesImport = `import { pages } from '$embodi/pages';`;
	const loadPagesImport = `import { loadPages } from '${pathContentHelpers}';`;

	const cleanMeta = filteredCollections.map(({ url, data: { title, name } }) => ({
		url,
		title: title ?? name
	}));

	console.log(`${pagesImport}
${loadPagesImport}
export const collections = loadPages(pages, ${JSON.stringify(urls)});
export const meta = ${JSON.stringify(cleanMeta)};`)

	return `${pagesImport}
${loadPagesImport}
export const collections = await loadPages(pages, ${JSON.stringify(urls)});
export const meta = ${JSON.stringify(cleanMeta)};`;
}
