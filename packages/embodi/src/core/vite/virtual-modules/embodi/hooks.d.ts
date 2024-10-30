declare module '$embodi/hooks' {
	export const before: (event: { data: Record<string, any> }) => Promise<unknown> | unknown;
}
