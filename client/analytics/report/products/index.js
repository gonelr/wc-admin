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
	getChartMeta() {
		const { query, isSingleProductView, isSingleProductVariable } = this.props;

		const isProductDetailsView =
			'top_items' === query.filter ||
			'top_sales' === query.filter ||
			( query.products && 1 < query.products.split( ',' ).length );

		const mode =
			isProductDetailsView || isSingleProductView ? 'item-comparison' : 'time-comparison';
		const compareObject =
			isSingleProductView && isSingleProductVariable ? 'variations' : 'products';
		const label =
			isSingleProductView && isSingleProductVariable
				? __( '%s variations', 'wc-admin' )
				: __( '%s products', 'wc-admin' );

		return {
			isProductDetailsView,
			compareObject,
			itemsLabel: label,
			mode,
		};
	}

	render() {
		const { compareObject, itemsLabel, mode } = this.getChartMeta();
		const {
			path,
			query,
			isProductsError,
			isProductsRequesting,
			isSingleProductVariable,
		} = this.props;

		if ( isProductsError || isProductsRequesting ) {
			return null;
		}

		const chartQuery = {
			...query,
		};

		if ( 'item-comparison' === mode ) {
			chartQuery.segmentby = 'products' === compareObject ? 'product' : 'variation';
		}

		return (
			<Fragment>
				<ReportFilters query={ query } path={ path } filters={ filters } />
				<ReportSummary
					mode={ mode }
					charts={ charts }
					endpoint="products"
					query={ chartQuery }
					selectedChart={ getSelectedChart( query.chart, charts ) }
				/>
				<ReportChart
					mode={ mode }
					filters={ filters }
					charts={ charts }
					endpoint="products"
					itemsLabel={ itemsLabel }
					path={ path }
					query={ chartQuery }
					selectedChart={ getSelectedChart( chartQuery.chart, charts ) }
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
		const { getProducts, isGetProductsRequesting, getProductsError } = select( 'wc-api' );
		const isSingleProductView = query.products && 1 === query.products.split( ',' ).length;
		if ( isSingleProductView ) {
			const includeArgs = { include: query.products };
			const products = getProducts( includeArgs );
			const isVariable =
				products[ query.products ] && 'variable' === products[ query.products ].type;
			const isProductsRequesting = isGetProductsRequesting( includeArgs );
			const isProductsError = getProductsError( includeArgs );
			return {
				query: {
					...query,
					'is-variable': isVariable,
				},
				isSingleProductView,
				isSingleProductVariable: isVariable,
				isProductsRequesting,
				isProductsError,
			};
		}

		return {
			query,
			isSingleProductView,
		};
	} )
)( ProductsReport );
