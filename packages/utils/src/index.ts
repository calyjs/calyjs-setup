function isString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}
function isEmptyUtils(value: unknown): boolean {
	return typeof value === 'undefined' || value === null;
}

function isNumberUtils(value: unknown): value is number {
	return !isEmptyUtils(value) && typeof value === 'number';
}

export { isString, isNumberUtils, isEmptyUtils };
