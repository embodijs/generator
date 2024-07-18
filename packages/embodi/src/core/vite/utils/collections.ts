import { getAllPages, getPageImportPath, loadPageData, transformPathToUrl } from "./load-content.js";
import { loadConfig } from "../../app/config.js";
import { getUniqueAttributeName } from "./virtuals.js";



interface CollectionMeta {
	tag: string;
	page: string;
	importPath: string;
}

async function createCollectionsMeta (): Promise<CollectionMeta[]> {
	const config = await loadConfig(process.cwd());
	const rawData = await Promise.all((await getAllPages(config.inputDirs)).map(async (file, dir) => {
		const data = await loadPageData(file) as { tags?: string[] } | undefined;
		if(!data) {
			return undefined;
		}
		const { tags } = data ;
		if(!tags) {
			return undefined;
		}
		const page = transformPathToUrl(dir, file);
		const importPath = getPageImportPath(file);
		return tags.map((tag: string) => ({
			tag,
			page,
			importPath
		}));
	}));

	return rawData.filter((collection) => collection !== undefined).flat();
}


// export async function loadCollection(name: string) {
// 	const collections = await createCollectionsMeta();

// 	return Promise.all(collections.filter(({tag}) => tag === name).map(({ loadData }) => loadData()));
// }

// export async function loadCollections(max?: number) {
// 	const collections = await createCollectionsMeta();

// 	return Promise.all(collections.slice(0, max ?? collections.length).map(({ loadData }) => loadData()));
// }



export async function generateCollectionsImportsCode(max?: number) {
	const allCollections = await createCollectionsMeta();
	const collections = allCollections.slice(0, max ?? allCollections.length);

	const listOfImportsWithId =  collections.map(({ importPath }) => {
		const id = getUniqueAttributeName('col');
		return [id, `import { data as ${id} } from '${importPath}';`];
	});

	return `
		${listOfImportsWithId.map(([, importLine]) => importLine).join('\n')}
		export const collections = [${listOfImportsWithId.map(([id]) => id).join(', ')}];
	`;
}
