import type { DataSchema } from 'embodi/layout';
import * as v from 'valibot';
import { ImageFiles, loadImage, storeImage } from '@embodi/image';

export const schema: DataSchema = v.objectAsync({
  title: v.string(),
  hero: ImageFiles,
  lang: v.string(),
  subtitle: v.string(),
  loadContent: v.optional(v.string())
});

export const enrich = async (elements) => {
  const { data, helper } = elements;
  const image = loadImage(data.hero, helper);
  const webp = image.autoOrient().webp({ quality: 70 });
  const versions = await Promise.all(
    [300, 700, 1300].map(async (width) => {
      const version = webp.resize({ width });
      await storeImage({ image: version, path: data.hero, helper });
    })
  );

  return {
    ...elements,
    data: {
      ...data,
      hero: [await storeImage({ image, path: data.hero, helper, original: true }), ...versions]
    }
  };
};
