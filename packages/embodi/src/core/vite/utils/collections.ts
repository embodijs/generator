import { getAllPages, getPageImportPath, loadPageData, transformPathToUrl } from "./load-content.js";
import { loadConfig } from "../../app/config.js";
import { getUniqueAttributeName } from "./virtuals.js";


interface CollectionMeta {
	tag: string;
	updateAt: Date;
	createdAt?: Date;
	page: string;
	importPath: string;
}

async function createCollectionsMeta (): Promise<CollectionMeta[]> {
	const config = await loadConfig(process.cwd());
	const rawData = await Promise.all((await getAllPages(config.inputDirs)).map(async (file, dir) => {
		const data = await loadPageData(file) as { tags?: string[] } | undefined;
		const { createdAt, updatedAt } = await file.getMeta();
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
			createdAt,
			updatedAt,
			page,
			importPath
		}));
	}));

	return rawData.filter((collection) => collection !== undefined).flat();
}




export async function generateCollectionsImportsCode(max?: number) {
	const allCollections = await createCollectionsMeta();
	const collections = allCollections.sort(( c1, c2 ) =>  c2.updatedAt.getTime() - c1.updatedAt.getTime()).slice(0, max ?? allCollections.length);

	const listOfImportsWithId =  collections.map(({ importPath }) => {
		const id = getUniqueAttributeName('col');
		return [id, `import { data as ${id} } from '${importPath}';`];
	});

	const cleanMeta = collections.map(({ tag, updatedAt, createdAt, page }) => ({
		tag,
		updatedAt: updatedAt.toISOString(),
		createdAt: createdAt?.toISOString(),
		page
	}));

	return `
		${listOfImportsWithId.map(([, importLine]) => importLine).join('\n')}
		export const collections = [${listOfImportsWithId.map(([id]) => id).join(', ')}];
		export const meta = ${JSON.stringify(cleanMeta)};
	`;
}
