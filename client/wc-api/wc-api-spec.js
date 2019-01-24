/** @format */

/**
 * Internal dependencies
 */
import categories from './categories';
import notes from './notes';
import orders from './orders';
import products from './products';
import reportItems from './reports/items';
import reportStats from './reports/stats';
import reviews from './reviews';
import user from './user';

function createWcApiSpec() {
	return {
		mutations: {
			...user.mutations,
		},
		selectors: {
			...categories.selectors,
			...notes.selectors,
			...orders.selectors,
			...products.selectors,
			...reportItems.selectors,
			...reportStats.selectors,
			...reviews.selectors,
			...user.selectors,
		},
		operations: {
			read( resourceNames ) {
				return [
					...categories.operations.read( resourceNames ),
					...notes.operations.read( resourceNames ),
					...orders.operations.read( resourceNames ),
					...products.operations.read( resourceNames ),
					...reportItems.operations.read( resourceNames ),
					...reportStats.operations.read( resourceNames ),
					...reviews.operations.read( resourceNames ),
					...user.operations.read( resourceNames ),
				];
			},
			update( resourceNames, data ) {
				return [ ...user.operations.update( resourceNames, data ) ];
			},
		},
	};
}

export default createWcApiSpec();
