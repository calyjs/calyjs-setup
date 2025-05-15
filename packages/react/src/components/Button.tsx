import React from 'react';

export const Button = ({ children }: { children: React.ReactNode }) => {
	if (__DEV__) {
		console.warn('----- Development mode -----');
	}
	return <button style={{ padding: '8px 16px' }}>{children}</button>;
};
