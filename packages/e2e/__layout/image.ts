import { extname } from 'path';
import sharp from 'sharp';

type ImageFormat =
  | {
      width?: number;
      format: 'png';
    }
  | {
      width?: number;
      format: 'webp' | 'jpg';
      quality?: number;
    };

export type ImageFile = {
  width: number;
  height: number;
  src: string;
};

export type DefaultImageFile = {
  original: true;
  src: string;
};

export type ImageFiles = [DefaultImageFile, ...ImageFile[]];

const generateImageWidths = (widths: number[], format: ImageFormat['format']): ImageFormat[] => {
  return widths.map((width) => ({ width, format }));
};

const replaceFileType = (path: string, newFormat: string) => {
  const ext = extname(path);
  const regEx = new RegExp(`${ext}$`);
  return path.replace(regEx, `.${newFormat}`);
};

const getFileType = (path: string) => {
  const ext = extname(path);
  return ext.slice(1);
};

const transformImage = (_image: sharp.Sharp, imageFormat: ImageFormat) => {
  const { width, format } = imageFormat;
  let image = _image.autoOrient();

  if (width) {
    image = image.resize({
      width
    });
  }

  if (format) {
    if (format === 'png') {
      image = image.png();
    } else if (format === 'webp') {
      image = image.webp({
        quality: imageFormat.quality ?? 80
      });
    } else if (format === 'jpg') {
      image = image.jpeg({
        quality: imageFormat.quality ?? 80
      });
    }
  }

  return image;
};

export const storeImage = async ({
  image,
  path,
  helper,
  original
}: {
  image: sharp.Sharp;
  path: string;
  helper: Helper;
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

export const loadImage = (path: string, helper) => {
  const fullPath = helper.resolvePath(path);
  return sharp(fullPath);
};
