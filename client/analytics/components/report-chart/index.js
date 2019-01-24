/** @format */
/**
 * External dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { format as formatDate } from '@wordpress/date';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';

/**
 * WooCommerce dependencies
 */
import {
	getAllowedIntervalsForQuery,
	getCurrentDates,
	getDateFormatsForInterval,
	getIntervalForQuery,
	getChartTypeForQuery,
	getPreviousDate,
} from '@woocommerce/date';
import { Chart } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import { getReportChartData, getTooltipValueFormat } from 'store/reports/utils';
import ReportError from 'analytics/components/report-error';
import withSelect from 'wc-api/with-select';
import { getChartMode } from './utils';

/**
 * Component that renders the chart in reports.
 */
export class ReportChart extends Component {
	getComparisonChartData() {
		const { segmentData, selectedChart } = this.props;
		const chartData = segmentData.data.intervals.map( function( interval ) {
			const intervalData = {};
			interval.subtotals.segments.forEach( function( segment ) {
				if ( segment.segment_label ) {
					intervalData[ segment.segment_label ] = {
						value: segment.subtotals[ selectedChart.key ] || 0,
					};
				}
			} );
			return {
				date: formatDate( 'Y-m-d\\TH:i:s', interval.date_start ),
				...intervalData,
			};
		} );
		return chartData;
	}

	getTimeChartData() {
		const { query, primaryData, secondaryData, selectedChart } = this.props;
		const currentInterval = getIntervalForQuery( query );
		const { primary, secondary } = getCurrentDates( query );
		const primaryKey = `${ primary.label } (${ primary.range })`;
		const secondaryKey = `${ secondary.label } (${ secondary.range })`;

		const chartData = primaryData.data.intervals.map( function( interval, index ) {
			const secondaryDate = getPreviousDate(
				interval.date_start,
				primary.after,
				secondary.after,
				query.compare,
				currentInterval
			);

			const secondaryInterval = secondaryData.data.intervals[ index ];
			return {
				date: formatDate( 'Y-m-d\\TH:i:s', interval.date_start ),
				[ primaryKey ]: {
					labelDate: interval.date_start,
					value: interval.subtotals[ selectedChart.key ] || 0,
				},
				[ secondaryKey ]: {
					labelDate: secondaryDate.format( 'YYYY-MM-DD HH:mm:ss' ),
					value: ( secondaryInterval && secondaryInterval.subtotals[ selectedChart.key ] ) || 0,
				},
			};
		} );

		return chartData;
	}

	render() {
		const {
			interactiveLegend,
			itemsLabel,
			legendPosition,
			path,
			primaryData,
			query,
			secondaryData,
			selectedChart,
			showHeaderControls,
			chartMode,
			segmentData,
		} = this.props;

		const currentInterval = getIntervalForQuery( query );

		let isRequesting;
		let chartData;
		let formats;

		if ( 'item-comparison' === chartMode ) {
			if ( segmentData.isError ) {
				return <ReportError isError />;
			}

			isRequesting = segmentData.isRequesting;
			chartData = this.getComparisonChartData();
			formats = getDateFormatsForInterval( currentInterval, segmentData.data.intervals.length );
		}

		if ( 'time-comparison' === chartMode ) {
			if ( ! primaryData || primaryData.isError || secondaryData.isError ) {
				return <ReportError isError />;
			}

			isRequesting = primaryData.isRequesting || secondaryData.isRequesting;
			chartData = this.getTimeChartData();
			formats = getDateFormatsForInterval( currentInterval, primaryData.data.intervals.length );
		}

		const allowedIntervals = getAllowedIntervalsForQuery( query );

		if ( isEmpty( chartData ) ) {
			return null;
		}

		return (
			<Chart
				allowedIntervals={ allowedIntervals }
				data={ chartData }
				dateParser={ '%Y-%m-%dT%H:%M:%S' }
				interactiveLegend={ interactiveLegend }
				interval={ currentInterval }
				isRequesting={ isRequesting }
				itemsLabel={ itemsLabel }
				legendPosition={ legendPosition }
				mode={ chartMode }
				path={ path }
				query={ query }
				showHeaderControls={ showHeaderControls }
				title={ selectedChart.label }
				tooltipLabelFormat={ formats.tooltipLabelFormat }
				tooltipTitle={ 'time-comparison' === chartMode && selectedChart.label }
				tooltipValueFormat={ getTooltipValueFormat( selectedChart.type ) }
				type={ getChartTypeForQuery( query ) }
				valueType={ selectedChart.type }
				xFormat={ formats.xFormat }
				x2Format={ formats.x2Format }
			/>
		);
	}
}

ReportChart.propTypes = {
	/**
	 * Filters available for that report.
	 */
	filters: PropTypes.array,
	/**
	 * Label describing the legend items.
	 */
	itemsLabel: PropTypes.string,
	/**
	 * `items-comparison` (default) or `time-comparison`, this is used to generate correct
	 * ARIA properties.
	 */
	mode: PropTypes.string,
	/**
	 * Current path
	 */
	path: PropTypes.string.isRequired,
	/**
	 * Primary data to display in the chart.
	 */
	primaryData: PropTypes.object.isRequired,
	/**
	 * The query string represented in object form.
	 */
	query: PropTypes.object.isRequired,
	/**
	 * Secondary data to display in the chart.
	 */
	secondaryData: PropTypes.object.isRequired,
	/**
	 * Properties of the selected chart.
	 */
	selectedChart: PropTypes.object.isRequired,
};

export default compose(
	withSelect( ( select, props ) => {
		const { query, endpoint, mode, filters, compareMode } = props;

		const chartMode = mode || getChartMode( filters, query ) || 'time-comparison';

		// TODO Clean this one up.. Rename "segment" since comparisons are not segments?
		if ( 'item-comparison' === mode ) {
			const segmentQuery = { ...query };
			segmentQuery.segmentby = 'products' === compareMode ? 'product' : 'variation';
			const segmentData = getReportChartData( endpoint, 'primary', segmentQuery, select );
			return {
				segmentData,
				chartMode,
			};
		}

		const primaryData = getReportChartData( endpoint, 'primary', query, select );
		const secondaryData = getReportChartData( endpoint, 'secondary', query, select );
		return {
			primaryData,
			secondaryData,
			chartMode,
		};
	} )
)( ReportChart );
