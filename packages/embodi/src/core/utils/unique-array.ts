export class UniqueArray<T> extends Array<T> {
	constructor(...items: T[]) {
		super();
		this.push(...items);
	}

	push(...items: T[]): number {
		const i = this.findIndex((av) => av == items[0]);
		if (i === -1) {
			return super.push(...items) - 1;
		}
		return i;
	}

	unshift(...items: T[]): number {
		const i = this.findIndex((av) => av == items[0]);
		if (i === -1) {
			super.unshift(...items);
			return 0;
		}
		return i;
	}
}
