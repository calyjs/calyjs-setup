function isEmpty(value: unknown): boolean {
	if (__DEV__) {
		console.warn('----- Development mode ------');
	}
	return typeof value === 'undefined' || value === null;
}

function getString(): string {
	if (__DEV__) {
		console.warn('----- Development mode ------');
	}
	return 'string';
}

export { isEmpty, getString };
