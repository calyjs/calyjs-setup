import { render } from '@testing-library/react';
import { Button } from '../../src/components/Button';

describe('Button', () => {
	it('adds two positive numbers correctly', () => {
		const { container } = render(<Button>Test</Button>);
		expect(container.textContent).toBe('Test');
	});
});
