function isEmpty(value: unknown): boolean {
	return typeof value === 'undefined' || value === null;
}

function isRop(value: unknown): value is number {
	return typeof value !== 'undefined' && value !== null && Number.isInteger(value);
}

export { isEmpty, isRop };
