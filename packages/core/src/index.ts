function isEmpty(value: unknown): boolean {
	if (__DEV__) {
		console.warn('----- Development mode ------');
	}
	return typeof value === 'undefined' || value === null;
}

export { isEmpty };
