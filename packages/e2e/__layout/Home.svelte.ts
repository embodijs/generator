import type { DataSchema, LayoutEvent } from 'embodi/layout';
import * as v from 'valibot';
import { ImageFile, ImageFiles, loadImage, storeImage } from '@embodi/image';

export const schema: DataSchema = v.objectAsync({
  title: v.string(),
  hero: ImageFiles,
  lang: v.string(),
  subtitle: v.string(),
  loadContent: v.optional(v.string())
});

const findAndReplaceImageInHTML = async (html: string, widths: number[], helper: LayoutEvent['helper']) => {
  const regex = /<img[^>]+src="(\$assets\/[^"]+)" alt="([^"]+)"[^>]*>/g;
  const images: ImageFile[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    const image = loadImage(src, helper);
    const webp = image.autoOrient().webp({ quality: 80 });
    const versions = await Promise.all(
      widths.map(async (width) => {
        const version = webp.resize({
          width,
          fit: 'cover'
        });
        return (await storeImage({ image: version, path: src, helper })) as ImageFile;
      })
    );
    images.push(...versions);
    const defaultVersion = await storeImage({ image, path: src, helper });
    html = html.replace(
      match[0],
      `<picture><source srcset="${versions.map((v) => `${v.src} ${v.width}w`).join(', ')}" type="image/webp"><img src="${defaultVersion.src}" alt="${match[2]}" /></picture>`
    );
  }
  return html;
};

export type Data = v.InferOutput<typeof schema>;

export const enrich = async (elements) => {
  const { data, html, helper } = elements;
  const image = loadImage(data.hero, helper);
  const webp = image.autoOrient().webp({ quality: 70 });
  const versions = await Promise.all(
    [].map(async (width) => {
      const version = webp.resize({ width });
      await storeImage({ image: version, path: data.hero, helper });
    })
  );

  return {
    html: await findAndReplaceImageInHTML(html, [100, 200, 300], helper),
    data: {
      ...data,
      hero: [await storeImage({ image, path: data.hero, helper, original: true }), ...versions]
    }
  };
};
