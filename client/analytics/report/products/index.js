/** @format */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import PropTypes from 'prop-types';

/**
 * WooCommerce dependencies
 */
import { ReportFilters } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import { charts, filters } from './config';
import getSelectedChart from 'lib/get-selected-chart';
import ProductsReportTable from './table';
import ReportChart from 'analytics/components/report-chart';
import ReportSummary from 'analytics/components/report-summary';
import VariationsReportTable from './table-variations';
import withSelect from 'wc-api/with-select';

class ProductsReport extends Component {
	getChartTypes() {
		const { query, isSingleProductView, isSingleProductVariable } = this.props;
		const isProductDetailsView =
			( query.products && 1 < query.products.split( ',' ).length ) ||
			'top_items' === query.filter ||
			'top_sales' === query.filter;
		let compareMode = null;
		let itemsLabel = __( '%s products', 'wc-admin' );
		let mode = 'time-comparison';

		if ( isProductDetailsView ) {
			compareMode = 'products';
			mode = 'item-comparison';
		} else if ( isSingleProductView && isSingleProductVariable ) {
			compareMode = 'variations';
			itemsLabel = __( '%s variations', 'wc-admin' );
			mode = 'item-comparison';
		}

		const test = {
			isProductDetailsView,
			compareMode,
			itemsLabel,
			mode,
		};

		console.log( test );
		return test;
	}

	render() {
		const {
			path,
			query,
			isProductsError,
			isProductsRequesting,
			isSingleProductVariable,
		} = this.props;
		const { compareMode, itemsLabel, mode } = this.getChartTypes();

		if ( isProductsError || isProductsRequesting ) {
			return null;
		}

		return (
			<Fragment>
				<ReportFilters query={ query } path={ path } filters={ filters } />
				<ReportSummary
					mode={ mode }
					compareMode={ compareMode }
					charts={ charts }
					endpoint="products"
					query={ query }
					selectedChart={ getSelectedChart( query.chart, charts ) }
				/>
				<ReportChart
					mode={ mode }
					compareMode={ compareMode }
					filters={ filters }
					charts={ charts }
					endpoint="products"
					itemsLabel={ itemsLabel }
					path={ path }
					query={ query }
					selectedChart={ getSelectedChart( query.chart, charts ) }
				/>
				{ isSingleProductVariable ? (
					<VariationsReportTable query={ query } />
				) : (
					<ProductsReportTable query={ query } />
				) }
			</Fragment>
		);
	}
}

ProductsReport.propTypes = {
	path: PropTypes.string.isRequired,
	query: PropTypes.object.isRequired,
};

export default compose(
	withSelect( ( select, props ) => {
		const { query } = props;

		const isSingleProductView = query.products && 1 === query.products.split( ',' ).length;
		let isSingleProductVariable = false;
		let isProductsRequesting = false;
		let isProductsError = false;

		if ( isSingleProductView ) {
			const { getProducts, isGetProductsRequesting, getProductsError } = select( 'wc-api' );
			const products = getProducts( { include: query.products } );
			isSingleProductVariable =
				products[ query.products ] && 'variable' === products[ query.products ].type;
			query.isVariable = isSingleProductVariable;
			isProductsRequesting = isGetProductsRequesting( { include: query.products } );
			isProductsError = getProductsError( { include: query.products } );
		}

		return {
			query,
			isSingleProductView,
			isSingleProductVariable,
			isProductsRequesting,
			isProductsError,
		};
	} )
)( ProductsReport );
