<?php
/**
 * REST API Reports orders controller
 *
 * Handles requests to the /reports/orders endpoint.
 *
 * @package WooCommerce Admin/API
 */

defined( 'ABSPATH' ) || exit;

/**
 * REST API Reports orders controller class.
 *
 * @package WooCommerce/API
 * @extends WC_Admin_REST_Reports_Controller
 */
class WC_Admin_REST_Reports_Orders_Controller extends WC_Admin_REST_Reports_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wc/v4';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'reports/orders';

	/**
	 * Maps query arguments from the REST request.
	 *
	 * @param array $request Request array.
	 * @return array
	 */
	protected function prepare_reports_query( $request ) {
		$args                     = array();
		$args['before']           = $request['before'];
		$args['after']            = $request['after'];
		$args['page']             = $request['page'];
		$args['per_page']         = $request['per_page'];
		$args['orderby']          = $request['orderby'];
		$args['order']            = $request['order'];
		$args['product_includes'] = (array) $request['product_includes'];
		$args['product_excludes'] = (array) $request['product_excludes'];
		$args['coupon_includes']  = (array) $request['coupon_includes'];
		$args['coupon_excludes']  = (array) $request['coupon_excludes'];
		$args['status_is']        = (array) $request['status_is'];
		$args['status_is_not']    = (array) $request['status_is_not'];
		$args['customer_type']    = $request['customer_type'];
		$args['extended_info']    = $request['extended_info'];
		return $args;
	}

	/**
	 * Get all reports.
	 *
	 * @param WP_REST_Request $request Request data.
	 * @return array|WP_Error
	 */
	public function get_items( $request ) {
		$query_args   = $this->prepare_reports_query( $request );
		$orders_query = new WC_Admin_Reports_Orders_Query( $query_args );
		$report_data  = $orders_query->get_data();

		$data = array();

		foreach ( $report_data->data as $orders_data ) {
			$item   = $this->prepare_item_for_response( $orders_data, $request );
			$data[] = $this->prepare_response_for_collection( $item );
		}

		$response = rest_ensure_response( $data );
		$response->header( 'X-WP-Total', (int) $report_data->total );
		$response->header( 'X-WP-TotalPages', (int) $report_data->pages );

		$page      = $report_data->page_no;
		$max_pages = $report_data->pages;
		$base      = add_query_arg( $request->get_query_params(), rest_url( sprintf( '/%s/%s', $this->namespace, $this->rest_base ) ) );
		if ( $page > 1 ) {
			$prev_page = $page - 1;
			if ( $prev_page > $max_pages ) {
				$prev_page = $max_pages;
			}
			$prev_link = add_query_arg( 'page', $prev_page, $base );
			$response->link_header( 'prev', $prev_link );
		}
		if ( $max_pages > $page ) {
			$next_page = $page + 1;
			$next_link = add_query_arg( 'page', $next_page, $base );
			$response->link_header( 'next', $next_link );
		}

		return $response;
	}

	/**
	 * Prepare a report object for serialization.
	 *
	 * @param stdClass        $report  Report data.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $report, $request ) {
		$data = $report;

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );
		$response->add_links( $this->prepare_links( $report ) );

		/**
		 * Filter a report returned from the API.
		 *
		 * Allows modification of the report data right before it is returned.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param object           $report   The original report object.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'woocommerce_rest_prepare_report_orders', $response, $report, $request );
	}

	/**
	 * Prepare links for the request.
	 *
	 * @param WC_Reports_Query $object Object data.
	 * @return array
	 */
	protected function prepare_links( $object ) {
		$links = array(
			'order' => array(
				'href' => rest_url( sprintf( '/%s/orders/%d', $this->namespace, $object['order_id'] ) ),
			),
		);

		return $links;
	}

	/**
	 * Get the Report's schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'report_orders',
			'type'       => 'object',
			'properties' => array(
				'order_id'           => array(
					'description' => __( 'Order ID.', 'wc-admin' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'date_created'       => array(
					'description' => __( 'Date the order was created.', 'wc-admin' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'status'             => array(
					'description' => __( 'Order status.', 'wc-admin' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'customer_id'        => array(
					'description' => __( 'Customer ID.', 'wc-admin' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'num_items_sold'     => array(
					'description' => __( 'Number of items sold.', 'wc-admin' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'net_total'          => array(
					'description' => __( 'Net total revenue.', 'wc-admin' ),
					'type'        => 'float',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'customer_type' => array(
					'description' => __( 'Returning or new customer.', 'wc-admin' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'extended_info'      => array(
					'products'   => array(
						'type'        => 'array',
						'readonly'    => true,
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'List of product IDs and names.', 'wc-admin' ),
					),
					'categories' => array(
						'type'        => 'array',
						'readonly'    => true,
						'context'     => array( 'view', 'edit' ),
						'description' => __( 'Category IDs.', 'wc-admin' ),
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get the query params for collections.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		$params                     = array();
		$params['context']          = $this->get_context_param( array( 'default' => 'view' ) );
		$params['page']             = array(
			'description'       => __( 'Current page of the collection.', 'wc-admin' ),
			'type'              => 'integer',
			'default'           => 1,
			'sanitize_callback' => 'absint',
			'validate_callback' => 'rest_validate_request_arg',
			'minimum'           => 1,
		);
		$params['per_page']         = array(
			'description'       => __( 'Maximum number of items to be returned in result set.', 'wc-admin' ),
			'type'              => 'integer',
			'default'           => 10,
			'minimum'           => 1,
			'maximum'           => 100,
			'sanitize_callback' => 'absint',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['after']            = array(
			'description'       => __( 'Limit response to resources published after a given ISO8601 compliant date.', 'wc-admin' ),
			'type'              => 'string',
			'format'            => 'date-time',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['before']           = array(
			'description'       => __( 'Limit response to resources published before a given ISO8601 compliant date.', 'wc-admin' ),
			'type'              => 'string',
			'format'            => 'date-time',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['order']            = array(
			'description'       => __( 'Order sort attribute ascending or descending.', 'wc-admin' ),
			'type'              => 'string',
			'default'           => 'desc',
			'enum'              => array( 'asc', 'desc' ),
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['orderby']          = array(
			'description'       => __( 'Sort collection by object attribute.', 'wc-admin' ),
			'type'              => 'string',
			'default'           => 'date',
			'enum'              => array(
				'date',
				'num_items_sold',
				'net_total',
			),
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['product_includes'] = array(
			'description'       => __( 'Limit result set to items that have the specified product(s) assigned.', 'wc-admin' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'integer',
			),
			'default'           => array(),
			'sanitize_callback' => 'wp_parse_id_list',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['product_excludes'] = array(
			'description'       => __( 'Limit result set to items that don\'t have the specified product(s) assigned.', 'wc-admin' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'integer',
			),
			'default'           => array(),
			'validate_callback' => 'rest_validate_request_arg',
			'sanitize_callback' => 'wp_parse_id_list',
		);
		$params['coupon_includes']  = array(
			'description'       => __( 'Limit result set to items that have the specified coupon(s) assigned.', 'wc-admin' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'integer',
			),
			'default'           => array(),
			'sanitize_callback' => 'wp_parse_id_list',
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['coupon_excludes']  = array(
			'description'       => __( 'Limit result set to items that don\'t have the specified coupon(s) assigned.', 'wc-admin' ),
			'type'              => 'array',
			'items'             => array(
				'type' => 'integer',
			),
			'default'           => array(),
			'validate_callback' => 'rest_validate_request_arg',
			'sanitize_callback' => 'wp_parse_id_list',
		);
		$params['status_is']        = array(
			'description'       => __( 'Limit result set to items that have the specified order status.', 'wc-admin' ),
			'type'              => 'array',
			'sanitize_callback' => 'wp_parse_slug_list',
			'validate_callback' => 'rest_validate_request_arg',
			'items'             => array(
				'enum' => $this->get_order_statuses(),
				'type' => 'string',
			),
		);
		$params['status_is_not']    = array(
			'description'       => __( 'Limit result set to items that don\'t have the specified order status.', 'wc-admin' ),
			'type'              => 'array',
			'sanitize_callback' => 'wp_parse_slug_list',
			'validate_callback' => 'rest_validate_request_arg',
			'items'             => array(
				'enum' => $this->get_order_statuses(),
				'type' => 'string',
			),
		);
		$params['customer_type']    = array(
			'description'       => __( 'Limit result set to returning or new customers.', 'wc-admin' ),
			'type'              => 'string',
			'default'           => '',
			'enum'              => array(
				'',
				'returning',
				'new',
			),
			'validate_callback' => 'rest_validate_request_arg',
		);
		$params['extended_info']    = array(
			'description'       => __( 'Add additional piece of info about each coupon to the report.', 'wc-admin' ),
			'type'              => 'boolean',
			'default'           => false,
			'sanitize_callback' => 'wc_string_to_bool',
			'validate_callback' => 'rest_validate_request_arg',
		);

		return $params;
	}
}
