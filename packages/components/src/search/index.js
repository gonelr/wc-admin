/** @format */
/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef, Fragment } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import { findIndex, noop } from 'lodash';
import Gridicon from 'gridicons';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Autocomplete from './autocomplete';
import {
	countries,
	coupons,
	customers,
	downloadIps,
	emails,
	orders,
	product,
	productCategory,
	taxes,
	usernames,
	variations,
} from './autocompleters';
import Tag from '../tag';

/**
 * A search box which autocompletes results while typing, allowing for the user to select an existing object
 * (product, order, customer, etc). Currently only products are supported.
 */
class Search extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			value: '',
			isActive: false,
		};

		this.input = createRef();

		this.selectResult = this.selectResult.bind( this );
		this.removeResult = this.removeResult.bind( this );
		this.updateSearch = this.updateSearch.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	selectResult( value ) {
		const { selected, onChange } = this.props;
		// Check if this is already selected
		const isSelected = findIndex( selected, { id: value.id } );
		if ( -1 === isSelected ) {
			this.setState( { value: '' } );
			onChange( [ ...selected, value ] );
		}
	}

	removeResult( id ) {
		return () => {
			const { selected, onChange } = this.props;
			const i = findIndex( selected, { id } );
			onChange( [ ...selected.slice( 0, i ), ...selected.slice( i + 1 ) ] );
		};
	}

	updateSearch( onChange ) {
		return event => {
			const value = event.target.value || '';
			this.setState( { value } );
			onChange( event );
		};
	}

	getAutocompleter() {
		switch ( this.props.type ) {
			case 'categories':
				return productCategory;
			case 'countries':
				return countries;
			case 'coupons':
				return coupons;
			case 'customers':
				return customers;
			case 'downloadIps':
				return downloadIps;
			case 'emails':
				return emails;
			case 'orders':
				return orders;
			case 'products':
				return product;
			case 'taxes':
				return taxes;
			case 'usernames':
				return usernames;
			case 'variations':
				return variations;
			default:
				return {};
		}
	}

	shouldRenderTags() {
		const { selected } = this.props;
		return selected.some( item => Boolean( item.label ) );
	}

	renderTags() {
		const { selected } = this.props;

		return this.shouldRenderTags() ? (
			<Fragment>
				{ selected.map( ( item, i ) => {
					if ( ! item.label ) {
						return null;
					}
					const screenReaderLabel = sprintf(
						__( '%1$s (%2$s of %3$s)', 'wc-admin' ),
						item.label,
						i + 1,
						selected.length
					);
					return (
						<Tag
							key={ item.id }
							id={ item.id }
							label={ item.label }
							remove={ this.removeResult }
							screenReaderLabel={ screenReaderLabel }
						/>
					);
				} ) }
			</Fragment>
		) : null;
	}

	onFocus() {
		this.setState( { isActive: true } );
	}

	onBlur() {
		this.setState( { isActive: false } );
	}

	render() {
		const autocompleter = this.getAutocompleter();
		const { placeholder, inlineTags, selected, instanceId, className, staticResults } = this.props;
		const { value = '', isActive } = this.state;
		const aria = {
			'aria-labelledby': this.props[ 'aria-labelledby' ],
			'aria-label': this.props[ 'aria-label' ],
		};
		const shouldRenderTags = this.shouldRenderTags();
		const inputType = autocompleter.inputType ? autocompleter.inputType : 'text';
		const searchIcon = <Gridicon className="woocommerce-search__icon" icon="search" size={ 18 } />;

		return (
			<div className={ classnames( 'woocommerce-search', className, {
				'has-inline-tags': inlineTags,
			} ) }>
				<Autocomplete
					completer={ autocompleter }
					onSelect={ this.selectResult }
					selected={ selected.map( s => s.id ) }
					staticResults={ staticResults }
				>
					{ ( { listBoxId, activeId, onChange } ) =>
						// Disable reason: The div below visually simulates an input field. Its
						// child input is the actual input and responds accordingly to all keyboard
						// events, but click events need to be passed onto the child input. There
						// is no appropriate aria role for describing this situation, which is only
						// for the benefit of sighted users.
						/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
						inlineTags ? (
							<div
								className={ classnames( 'woocommerce-search__inline-container', {
									'is-active': isActive,
								} ) }
								onClick={ () => {
									this.input.current.focus();
								} }
							>
								{ searchIcon }
								<div className="woocommerce-search__token-list">
									{ this.renderTags() }
									<input
										ref={ this.input }
										type={ inputType }
										size={
											( ( value.length === 0 && placeholder && placeholder.length ) ||
												value.length ) + 1
										}
										value={ value }
										placeholder={ ( ! shouldRenderTags && placeholder ) || '' }
										className="woocommerce-search__inline-input"
										onChange={ this.updateSearch( onChange ) }
										aria-owns={ listBoxId }
										aria-activedescendant={ activeId }
										onFocus={ this.onFocus }
										onBlur={ this.onBlur }
										aria-describedby={
											shouldRenderTags ? `search-inline-input-${ instanceId }` : null
										}
										{ ...aria }
									/>
									<span id={ `search-inline-input-${ instanceId }` } className="screen-reader-text">
										{ __( 'Move backward for selected items' ) }
									</span>
								</div>
							</div>
						) : (
							<Fragment>
								{ searchIcon }
								<input
									type="search"
									value={ value }
									placeholder={ placeholder }
									className="woocommerce-search__input"
									onChange={ this.updateSearch( onChange ) }
									aria-owns={ listBoxId }
									aria-activedescendant={ activeId }
									{ ...aria }
								/>
							</Fragment>
						)
					}
				</Autocomplete>
				{ ! inlineTags && this.renderTags() }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	}
}

Search.propTypes = {
	/**
	 * Class name applied to parent div.
	 */
	className: PropTypes.string,
	/**
	 * Function called when selected results change, passed result list.
	 */
	onChange: PropTypes.func,
	/**
	 * The object type to be used in searching.
	 */
	type: PropTypes.oneOf( [
		'categories',
		'countries',
		'coupons',
		'customers',
		'downloadIps',
		'emails',
		'orders',
		'products',
		'taxes',
		'usernames',
		'variations',
	] ).isRequired,
	/**
	 * A placeholder for the search input.
	 */
	placeholder: PropTypes.string,
	/**
	 * An array of objects describing selected values. If the label of the selected
	 * value is omitted, the Tag of that value will not be rendered inside the
	 * search box.
	 */
	selected: PropTypes.arrayOf(
		PropTypes.shape( {
			id: PropTypes.oneOfType( [
				PropTypes.number,
				PropTypes.string,
			] ).isRequired,
			label: PropTypes.string,
		} )
	),
	/**
	 * Render tags inside input, otherwise render below input.
	 */
	inlineTags: PropTypes.bool,
	/**
	 * Render results list positioned statically instead of absolutely.
	 */
	staticResults: PropTypes.bool,
};

Search.defaultProps = {
	onChange: noop,
	selected: [],
	inlineTags: false,
	staticResults: false,
};

export default withInstanceId( Search );
