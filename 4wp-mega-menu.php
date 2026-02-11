<?php
/**
 * Plugin Name: Forwp Mega Menu
 * Description: Float Menu functionality for WordPress block editor. Create floating side menus that open on click, similar to WooCommerce cart.
 * Version: 1.0.0
 * Author: 4WP Development Team
 * Author URI: https://4wp.dev
 * Text Domain: forwp-mega-menu
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'FORWP_MEGA_MENU_PATH', plugin_dir_path( __FILE__ ) );
define( 'FORWP_MEGA_MENU_URL', plugin_dir_url( __FILE__ ) );
define( 'FORWP_MEGA_MENU_VERSION', '1.0.0' );

require_once FORWP_MEGA_MENU_PATH . 'inc/bootstrap.php';

