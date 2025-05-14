import React from 'react';

export const Button = ({ children }: { children: React.ReactNode }) => {
	return <button style={{ padding: '8px 16px' }}>{children}</button>;
};
