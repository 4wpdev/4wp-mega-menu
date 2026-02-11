<?php

namespace Forwp\MegaMenu;

use Forwp\Bundle\Plugin as Bundle;

final class Assets {
	public static function register(): void {
		$asset_path = Bundle::path( 'build/index.asset.php' );
		$asset_data = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
				'version'      => Bundle::version(),
			);

		wp_register_style(
			'forwp-mega-menu-frontend',
			Bundle::url( 'build/style-index.css' ),
			array(),
			$asset_data['version']
		);

		wp_register_style(
			'forwp-mega-menu-editor',
			Bundle::url( 'build/index.css' ),
			array(),
			$asset_data['version']
		);

		wp_register_script(
			'forwp-mega-menu-blocks',
			Bundle::url( 'build/index.js' ),
			$asset_data['dependencies'],
			$asset_data['version'],
			true
		);

		// Register float menu assets
		wp_register_style(
			'forwp-float-menu',
			Bundle::url( 'assets/css/float-menu.css' ),
			array(),
			Bundle::version()
		);

		wp_register_script(
			'forwp-float-menu',
			Bundle::url( 'assets/js/float-menu.js' ),
			array(),
			Bundle::version(),
			true
		);
	}

	public static function enqueue_frontend(): void {
		wp_enqueue_style( 'forwp-mega-menu-frontend' );
		wp_enqueue_style( 'forwp-float-menu' );
		wp_enqueue_script( 'forwp-float-menu' );
		
		// Add dynamic CSS with breakpoints from theme.json
		add_action( 'wp_head', array( self::class, 'add_responsive_float_menu_css' ), 100 );
	}
	
	public static function add_responsive_float_menu_css(): void {
		// Get breakpoints from theme.json or use defaults
		$breakpoints = self::get_breakpoints();
		$mobile_max = $breakpoints['mobile']['max'] ?? 599;
		
		?>
		<style id="forwp-float-menu-responsive">
		/* Float Menu Responsive Styles */
		@media (max-width: <?php echo esc_attr( $mobile_max ); ?>px) {
			.forwp-float-menu {
				max-width: 75%;
				width: 75%;
			}
		}
		</style>
		<?php
	}
	
	private static function get_breakpoints(): array {
		// Try to get breakpoints from theme.json
		$theme_breakpoints = wp_get_global_settings( array( 'custom', 'breakpoints' ) );
		
		if ( is_array( $theme_breakpoints ) && ! empty( $theme_breakpoints ) ) {
			return $theme_breakpoints;
		}
		
		// Try to get from 4wp-responsive plugin if available
		if ( class_exists( '\Forwp\Responsive\Plugin' ) && method_exists( '\Forwp\Responsive\Plugin', 'get_breakpoints' ) ) {
			$breakpoints = \Forwp\Responsive\Plugin::get_breakpoints();
			if ( ! empty( $breakpoints ) ) {
				return $breakpoints;
			}
		}
		
		// Default breakpoints
		return array(
			'mobile'  => array( 'max' => 599 ),
			'tablet'  => array( 'min' => 600, 'max' => 1023 ),
			'desktop' => array( 'min' => 1024 ),
		);
	}

	public static function enqueue_editor(): void {
		wp_enqueue_style( 'forwp-mega-menu-editor' );
		wp_enqueue_script( 'forwp-mega-menu-blocks' );
	}
}

