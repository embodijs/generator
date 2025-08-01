import * as v from 'valibot';

export const ImageFileSchema = v.object({
	width: v.number(),
	height: v.number(),
	src: v.string()
});

export const DefaultImageFileSchema = v.object({
	original: v.literal(true),
	src: v.string()
});

export const ImageFilesSchema = v.tupleWithRest([DefaultImageFileSchema], ImageFileSchema);

export type ImageFile = v.InferInput<typeof ImageFileSchema>;
export type DefaultImageFile = v.InferInput<typeof DefaultImageFileSchema>;
export type ImageFiles = v.InferInput<typeof ImageFilesSchema>;
