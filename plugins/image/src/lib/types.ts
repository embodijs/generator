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
