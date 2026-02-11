<?php

namespace Forwp\MegaMenu;

final class Plugin {
	public static function init(): void {
		add_action( 'init', array( Assets::class, 'register' ) );
		add_action( 'init', array( Blocks::class, 'register' ) );
		add_action( 'wp_enqueue_scripts', array( Assets::class, 'enqueue_frontend' ) );
		add_action( 'enqueue_block_editor_assets', array( Assets::class, 'enqueue_editor' ) );
		add_filter( 'render_block', array( Blocks::class, 'filter_navigation_render' ), 10, 2 );
	}
}

