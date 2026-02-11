<?php

namespace Forwp\MegaMenu;

final class Blocks {
	public static function register(): void {
		register_block_type(
			'fse/mega-panel',
			array(
				'editor_script' => 'forwp-mega-menu-blocks',
				'style'         => 'forwp-mega-menu-frontend',
				'editor_style'  => 'forwp-mega-menu-editor',
			)
		);

		register_block_type(
			'fse/float-menu-container',
			array(
				'editor_script' => 'forwp-mega-menu-blocks',
				'style'         => 'forwp-mega-menu-frontend',
				'editor_style'  => 'forwp-mega-menu-editor',
			)
		);

		// Add filter to mark navigation links with isFloatMenu attribute as float menu triggers
		add_filter( 'render_block', array( self::class, 'filter_navigation_link_render' ), 10, 2 );
		// Add filter to preserve data-menu-selector attribute for float-menu-container
		add_filter( 'render_block', array( self::class, 'filter_float_menu_container_render' ), 10, 2 );
	}

	public static function filter_navigation_render( string $content, array $block ): string {
		if ( empty( $block['blockName'] ) || 'core/navigation' !== $block['blockName'] ) {
			return $content;
		}

		if ( empty( $block['attrs']['ref'] ) || empty( $block['innerBlocks'] ) ) {
			return $content;
		}

		if ( ! self::contains_mega_block( $block['innerBlocks'] ) ) {
			return $content;
		}

		if ( ! empty( $block['attrs']['forwp_skip_render'] ) ) {
			return $content;
		}

		$block['attrs']['ref'] = 0;
		$block['attrs']['forwp_skip_render'] = true;

		return render_block( $block );
	}

	public static function filter_navigation_link_render( string $content, array $block ): string {
		// Only process navigation-link and navigation-submenu blocks
		if ( empty( $block['blockName'] ) || 
			( 'core/navigation-link' !== $block['blockName'] && 'core/navigation-submenu' !== $block['blockName'] ) ) {
			return $content;
		}

		// Check if isFloatMenu attribute is set to true
		$is_float_menu = ! empty( $block['attrs']['isFloatMenu'] );
		$float_container_name = $block['attrs']['floatMenuContainerName'] ?? '';
		
		// Debug: log if float menu is enabled
		if ( $is_float_menu ) {
			error_log( 'Float Menu: isFloatMenu=true, containerName=' . $float_container_name );
		}
		
		if ( $is_float_menu && ! empty( $float_container_name ) ) {
			// Add float container name attribute
			if ( strpos( $content, 'data-float-container-name' ) === false ) {
				// Find the <li> tag and add data attribute after the class attribute
				// Pattern: match <li with any attributes, find the closing > of opening tag
				if ( preg_match( '/(<li\s+[^>]*?)(\s*>)/', $content, $matches ) ) {
					// Check if data-float-container-name is not already in the attributes
					if ( strpos( $matches[1], 'data-float-container-name' ) === false ) {
						$content = preg_replace(
							'/(<li\s+[^>]*?)(\s*>)/',
							'$1 data-float-container-name="' . esc_attr( $float_container_name ) . '"$2',
							$content,
							1 // Replace only first occurrence
						);
					}
				} else {
					error_log( 'Float Menu: Could not find <li> element to add data-float-container-name' );
				}
			}
		}

		return $content;
	}

	public static function filter_float_menu_container_render( string $content, array $block ): string {
		// Only process float-menu-container blocks
		if ( empty( $block['blockName'] ) || 'fse/float-menu-container' !== $block['blockName'] ) {
			return $content;
		}

		// Generate unique ID if not present in content
		if ( strpos( $content, 'id=' ) === false ) {
			$container_id = 'float-menu-' . wp_unique_id();
			$content = preg_replace(
				'/(<div\s+[^>]*class="[^"]*float-menu-container[^"]*)/',
				'$1 id="' . esc_attr( $container_id ) . '"',
				$content
			);
		}

		// Get technicalName attribute
		$technical_name = $block['attrs']['technicalName'] ?? '';
		
		// Add data-technical-name attribute if not present
		if ( ! empty( $technical_name ) && strpos( $content, 'data-technical-name' ) === false ) {
			$content = preg_replace(
				'/(<div\s+[^>]*class="[^"]*float-menu-container[^"]*)/',
				'$1 data-technical-name="' . esc_attr( $technical_name ) . '"',
				$content
			);
		}

		return $content;
	}

	private static function contains_mega_block( array $blocks ): bool {
		foreach ( $blocks as $inner ) {
			if ( ! empty( $inner['blockName'] ) && 'fse/mega-panel' === $inner['blockName'] ) {
				return true;
			}

			if ( ! empty( $inner['innerBlocks'] ) && self::contains_mega_block( $inner['innerBlocks'] ) ) {
				return true;
			}
		}

		return false;
	}
}

