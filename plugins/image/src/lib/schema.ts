import * as v from 'valibot';

export const ImageFile = v.object({
	width: v.number(),
	height: v.number(),
	src: v.string()
});

export const DefaultImageFile = v.object({
	original: v.literal(true),
	src: v.string()
});

export const ImageFiles = v.tupleWithRest([DefaultImageFile], ImageFile);

export type ImageFile = v.InferInput<typeof ImageFile>;
export type DefaultImageFile = v.InferInput<typeof DefaultImageFile>;
export type ImageFiles = v.InferInput<typeof ImageFiles>;
