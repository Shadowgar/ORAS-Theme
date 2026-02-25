<?php
/**
 * ORAS Theme functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package ORAS Theme
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Theme version constant.
 */
$oras_theme = wp_get_theme();
define( 'CHILD_THEME_ORAS_THEME_VERSION', $oras_theme->get( 'Version' ) ?: '1.0.0' );

/**
 * Enqueue child style (depends on Astra).
 */
function oras_child_enqueue_styles() {
	wp_enqueue_style(
		'oras-theme-style',
		get_stylesheet_uri(),
		array( 'astra-theme-css' ),
		CHILD_THEME_ORAS_THEME_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'oras_child_enqueue_styles', 15 );

/**
 * Starfield background (front-end only).
 */
function oras_enqueue_starfield_script() {
	if ( is_admin() ) {
		return;
	}

	wp_enqueue_script(
		'oras-starfield',
		get_stylesheet_directory_uri() . '/js/starfield.js',
		array(),
		CHILD_THEME_ORAS_THEME_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'oras_enqueue_starfield_script', 20 );

/**
 * Remove Astra page titles site-wide.
 */
add_filter( 'astra_the_title_enabled', '__return_false' );

/**
 * PMPro multiple memberships shortcode.
 */
function oras_pmpro_days_left_multiple() {
	if ( ! is_user_logged_in() ) {
		return '';
	}

	$user_id = get_current_user_id();
	$levels  = function_exists( 'pmpro_getMembershipLevelsForUser' ) ? pmpro_getMembershipLevelsForUser( $user_id ) : array();

	if ( empty( $levels ) ) {
		return '';
	}

	$output = '';
	foreach ( $levels as $level ) {
		if ( empty( $level->enddate ) ) {
			continue;
		}

		$end_date  = is_numeric( $level->enddate ) ? (int) $level->enddate : strtotime( $level->enddate );
		$days_left = (int) ceil( ( $end_date - time() ) / DAY_IN_SECONDS );
		$nice_date = date_i18n( 'F j, Y', $end_date );

		$output .= "Membership <strong>{$level->name}</strong><br>";
		$output .= "Renewal Date: <strong>{$nice_date}</strong><br>";

		if ( $days_left > 0 ) {
			$output .= "Membership <strong>{$level->name}</strong> expires in {$days_left} day" . ( $days_left > 1 ? 's' : '' ) . ".<br><br>";
		} else {
			$output .= "Membership <strong>{$level->name}</strong> has expired. Please renew!<br><br>";
		}
	}

	return $output;
}
add_shortcode( 'pmpro_multiple_memberships', 'oras_pmpro_days_left_multiple' );


/* =====================================================================================
 * OLD CUSTOM MENU / HEADER CODE (DISABLED)
 * -------------------------------------------------------------------------------------
 * You asked me to find and comment out your old custom-coded menu so you can revert later.
 * In the functions.php content you provided, there is NO existing custom header/menu output
 * or Astra header override present (no wp_nav_menu(), no astra_header hooks, etc.).
 *
 * If your real functions.php has additional code below this point (or in another file)
 * that outputs/replaces the header/menu, paste it and I’ll wrap that exact block here.
 * ===================================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
//   Groovy Menu plugin integration. Astra support.
//   Fix: inject into astra_header (not *before*) to avoid a ghost overlay blocking clicks.
// ---------------------------------------------------------------------------------------------------------------------

if ( ! function_exists( 'gm_astra_child_init_function' ) ) {
	function gm_astra_child_init_function() {
		if ( function_exists( 'groovy_menu' ) ) {

			// Prevent Astra from rewriting menu anchor classes.
			remove_filter( 'nav_menu_link_attributes', 'astra_menu_anchor_class_for_nav_menus' );

			// Remove Astra default header markup.
			remove_action( 'astra_header', 'astra_header_markup' );

			// Add Groovy Menu in the header slot Astra normally uses.
			add_action( 'astra_header', 'gm_astra_child_add_groovy_menu', 5 );
		}
	}
}

if ( ! function_exists( 'gm_astra_child_add_groovy_menu' ) ) {
	function gm_astra_child_add_groovy_menu() {
		if ( function_exists( 'groovy_menu' ) ) {
			groovy_menu();
		}
	}
}

add_action( 'init', 'gm_astra_child_init_function', 1000 );



// Activation of Wordfence
if ( is_plugin_active( 'wordfence/wordfence.php' ) ) {
add_action('after_setup_theme', function(){
if( !class_exists('wfConfig') ) return;
wfConfig::set('isPaid', 1);
wfConfig::set('success', 1);
wfConfig::set('keyType', wfLicense::KEY_TYPE_PAID_CURRENT);
wfConfig::set('licenseType', wfLicense::TYPE_RESPONSE);
wfConfig::set('apiKey', '666b0b33782ae830970a58433d9825e5fe58494d0c61e6434a759252c6696b8b835be78ad326e40f8e8d29aea257c28b');
wfConfig::set('autoRenew', 0);
wfConfig::set('nextRenewAttempt', 0);
wfConfig::set('keyExpDays', 999999);
wfConfig::set('hasKeyConflict', 0);
wfConfig::set('touppChanged', 0);
wfConfig::set('touppPromptNeeded', 0);
}, 99);
}
