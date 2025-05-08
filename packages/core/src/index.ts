function isEmpty(value: unknown): boolean {
	return typeof value === 'undefined' || value === null;
}

function isNumber(value: unknown): value is number {
	return !isEmpty(value) && typeof value === 'number';
}

export { isEmpty, isNumber };
