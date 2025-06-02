function isString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}
function isStringOther(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

export { isString, isStringOther };
