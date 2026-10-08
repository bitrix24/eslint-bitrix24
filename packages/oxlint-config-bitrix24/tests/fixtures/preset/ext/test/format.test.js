import { format } from '../src/format';

describe('format', () => {
	it('appends', () => {
		assert.equal(format('a'), 'a!?');
	});
});
