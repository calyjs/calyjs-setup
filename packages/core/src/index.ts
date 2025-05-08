function isEmpty(value: unknown): boolean {
	return typeof value === 'undefined' || value === null;
}

export { isEmpty };
