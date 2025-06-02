function isEmpty(value: unknown): boolean {
	return typeof value === 'undefined' || value === null;
}

function isNumber(value: unknown): value is number {
	return typeof value !== 'undefined' && value !== null && isNumber(value);
}

function isTest(value: unknown): value is number {
	return typeof value !== 'undefined' && value !== null && isNumber(value);
}

export { isEmpty, isNumber, isTest };
