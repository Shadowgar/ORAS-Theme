<?php
/**
 * Footer template (Astra child)
 *
 * Keep this footer CLEAN. No inline starfield JS here.
 *
 * @package Astra
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

astra_content_bottom();
?>
	</div> <!-- ast-container -->
	</div><!-- #content -->
<?php
astra_content_after();

astra_footer_before();
astra_footer();
astra_footer_after();
?>
	</div><!-- #page -->
	<!-- Starfield Canvases -->
<canvas id="nebula-canvas" aria-hidden="true"></canvas>
<canvas id="star-canvas" aria-hidden="true"></canvas>
<?php
astra_body_bottom();
wp_footer();
?>
<?php
/**
 * UserJot full integration
 * - Loads SDK
 * - Initializes widget
 * - Identifies logged-in users
 */
?>

<script>
/* UserJot SDK loader */
window.$ujq = window.$ujq || [];
window.uj = window.uj || new Proxy({}, {
  get: (_, p) => (...a) => window.$ujq.push([p, ...a])
});

document.head.appendChild(
  Object.assign(document.createElement('script'), {
    src: 'https://cdn.userjot.com/sdk/v2/uj.js',
    type: 'module',
    async: true
  })
);
</script>

<script>
/* UserJot initialization */
window.uj.init('cml5jnb4g1tl016mlqrfe9g8y', {
  widget: true,
  position: 'left',
  theme: 'auto'
});
</script>

<?php if ( is_user_logged_in() ) :
  $u = wp_get_current_user();
?>
<script>
/* UserJot user identification */
window.uj.identify({
  id: "<?php echo esc_js($u->ID); ?>",
  email: "<?php echo esc_js($u->user_email); ?>",
  firstName: "<?php echo esc_js($u->first_name); ?>",
  lastName: "<?php echo esc_js($u->last_name); ?>"
});
</script>
<?php endif; ?>
</body>
</html>
