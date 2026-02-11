<?php

namespace Forwp\Bundle;

final class Plugin {
	public static function path( string $path = '' ): string {
		return FORWP_MEGA_MENU_PATH . ltrim( $path, '/' );
	}

	public static function url( string $path = '' ): string {
		return FORWP_MEGA_MENU_URL . ltrim( $path, '/' );
	}

	public static function version(): string {
		return FORWP_MEGA_MENU_VERSION;
	}
}


























