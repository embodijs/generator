import type { LayoutEvent } from 'embodi/layout';
import { extname } from 'path';
import sharp from 'sharp';
import type { DefaultImageFile, ImageFile } from './schema.js';

const getFileType = (path: string) => {
	const ext = extname(path);
	return ext.slice(1);
};

export const storeImage = async ({
	image,
	path,
	helper,
	original
}: {
	image: sharp.Sharp;
	path: string;
	helper: LayoutEvent['helper'];
	original?: boolean;
}): Promise<DefaultImageFile | ImageFile> => {
	const { info, data } = await image.toBuffer({ resolveWithObject: true });
	const assetPath = helper.fileManager.addAsset(path, data, `image/${getFileType(path)}`);
	if (original) {
		return {
			original: true,
			src: assetPath
		};
	} else {
		return {
			width: info.width,
			height: info.height,
			src: assetPath
		};
	}
};

export const loadImage = (path: string, helper: LayoutEvent['helper']) => {
	const fullPath = helper.resolvePath(path);
	return sharp(fullPath);
};
