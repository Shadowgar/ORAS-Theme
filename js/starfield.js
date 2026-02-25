(function () {
  function ready(f) {
    if (document.readyState !== 'loading') f();
    else document.addEventListener('DOMContentLoaded', f);
  }

  ready(function () {
    const nebulaCanvas = document.getElementById('nebula-canvas');
    const starCanvas = document.getElementById('star-canvas');
    if (!nebulaCanvas || !starCanvas) return;

    const nebCtx = nebulaCanvas.getContext('2d', { alpha: true, desynchronized: true });
    const starCtx = starCanvas.getContext('2d', { alpha: true, desynchronized: true });

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Cache window.innerWidth/innerHeight to avoid layout calls
    let W = window.innerWidth;
    let H = window.innerHeight;

    function resizeCanvas() {
      W = window.innerWidth;
      H = window.innerHeight;

      [nebulaCanvas, starCanvas].forEach((c) => {
        c.width = Math.floor(W * DPR);
        c.height = Math.floor(H * DPR);
        c.style.width = W + 'px';
        c.style.height = H + 'px';

        const ctx = c.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(DPR, DPR);
      });
    }

    // IMPORTANT: run immediately (not only on window.load)
    resizeCanvas();

    window.addEventListener('load', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    window.addEventListener('resize', () => {
      clearTimeout(window._resizeTimeout);
      window._resizeTimeout = setTimeout(() => {
        resizeCanvas();
        // regen without changing visuals
        createNebula();
        createStars();
      }, 120);
    });

    // Cache for hex→rgb conversion (massive performance win)
    const rgbCache = {};
    function hexToRgb(hex) {
      if (rgbCache[hex]) return rgbCache[hex];
      const h = hex.replace('#', '');
      const bigint = parseInt(h, 16);
      const out = `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
      rgbCache[hex] = out;
      return out;
    }

    // ----------------- Nebula -----------------
    let nebulaBlobs = [];
    const nebulaColors = [
      'rgba(255,200,200,0.05)',
      'rgba(180,150,255,0.05)',
      'rgba(120,180,255,0.04)',
      'rgba(255,150,100,0.04)',
    ];

    function createNebula() {
      nebulaBlobs.length = 0;
      for (let i = 0; i < 10; i++) {
        nebulaBlobs.push({
          x: Math.random() * W,
          y: Math.random() * H,
          radius: 200 + Math.random() * 300,
          color: nebulaColors[(Math.random() * nebulaColors.length) | 0],
          dx: (Math.random() - 0.5) * 0.05,
          dy: (Math.random() - 0.5) * 0.05,
          _gradient: null,
        });
      }
    }

    function drawNebula() {
      nebCtx.clearRect(0, 0, W, H);

      for (let i = 0; i < nebulaBlobs.length; i++) {
        const blob = nebulaBlobs[i];

        // Recompute gradient if missing (or after resize/regeneration)
        if (!blob._gradient) {
          const g = nebCtx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
          g.addColorStop(0, blob.color);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          blob._gradient = g;
        }

        nebCtx.fillStyle = blob._gradient;
        nebCtx.beginPath();
        nebCtx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        nebCtx.fill();

        blob.x += blob.dx;
        blob.y += blob.dy;

        if (blob.x < -blob.radius) blob.x = W + blob.radius;
        else if (blob.x > W + blob.radius) blob.x = -blob.radius;

        if (blob.y < -blob.radius) blob.y = H + blob.radius;
        else if (blob.y > H + blob.radius) blob.y = -blob.radius;
      }
    }

    // ----------------- Starfield -----------------
    let layers = [];
    const TOTAL_LAYERS = 4;
    const TOTAL_STARS = 6000;

    function createStars() {
      layers.length = 0;

      for (let l = 0; l < TOTAL_LAYERS; l++) {
        const layerStars = [];
        const depthFactor = 1 + l;
        const layerCount = TOTAL_STARS / TOTAL_LAYERS;

        for (let i = 0; i < layerCount; i++) {
          const clusterOffsetX = Math.random() < 0.02 ? (Math.random() - 0.5) * 50 : 0;
          const clusterOffsetY = Math.random() < 0.02 ? (Math.random() - 0.5) * 50 : 0;

          let baseColor =
            l === 0 ? '#ffffff' :
            l === 1 ? '#ffeedd' :
            l === 2 ? '#fff8e0' : '#e0f0ff';

          if (Math.random() < 0.01) baseColor = '#ff6666';

          layerStars.push({
            x: Math.random() * W + clusterOffsetX,
            y: Math.random() * H + clusterOffsetY,
            radius: (Math.random() ** 2.5) * 1.3 + 0.1,
            color: baseColor,
            rgb: hexToRgb(baseColor),
            baseOpacity: Math.random() * 0.35 + 0.15,
            twinkleSpeed: Math.random() * 0.6 + 0.1 - l * 0.05,
            phase: Math.random() * Math.PI * 2,
            depth: depthFactor,
            burstPhase: -Math.random() * 5,
            specialBurst: false,
            burstDuration: 0,
            nextTwinkle: Math.random() * 5 + 1,
          });
        }
        layers.push(layerStars);
      }
    }

    const shootingStars = [];

    function createShootingStar() {
      shootingStars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        length: 80 + Math.random() * 40,
        speed: 800 + Math.random() * 400,
        angle: Math.random() * Math.PI / 6 + Math.PI / 12,
        life: 0,
      });
    }

    function drawStars(scrollOffset, t) {
      starCtx.clearRect(0, 0, W, H);

      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];

        for (let si = 0; si < layer.length; si++) {
          const s = layer[si];

          // Fast modulo
          let y = s.y + scrollOffset / (s.depth * 10);
          if (y >= H) y -= H;
          else if (y < 0) y += H;

          let opacity = s.baseOpacity + Math.sin(t * s.twinkleSpeed + s.phase) * 0.06;

          if (!s.specialBurst && t > s.nextTwinkle) {
            s.specialBurst = true;
            s.burstPhase = t;
            s.burstDuration = 0.5 + Math.random() * 0.5;
            s.nextTwinkle = t + 3 + Math.random() * 5;
          }

          if (s.specialBurst) {
            const dt = t - s.burstPhase;
            if (dt < s.burstDuration) {
              opacity += Math.sin((dt / s.burstDuration) * Math.PI) * 0.15;
            } else {
              s.specialBurst = false;
            }
          }

          const shimmer = Math.sin((t - s.burstPhase) * 3) * Math.exp(-(t - s.burstPhase) * 1.2);
          opacity += shimmer * 0.05;

          const o = opacity < 0.1 ? 0.1 : opacity > 0.55 ? 0.55 : opacity;

          starCtx.beginPath();
          starCtx.arc(s.x, y, s.radius, 0, Math.PI * 2);
          starCtx.fillStyle = `rgba(${s.rgb},${o})`;
          starCtx.fill();
        }
      }

      if (Math.random() < 0.002) createShootingStar();

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const st = shootingStars[i];
        st.life += 0.016;

        const dx = Math.cos(st.angle) * st.speed * 0.016;
        const dy = Math.sin(st.angle) * st.speed * 0.016;

        st.x += dx;
        st.y += dy;

        starCtx.beginPath();
        starCtx.moveTo(st.x, st.y);
        starCtx.lineTo(st.x - dx * 3, st.y - dy * 3);
        starCtx.strokeStyle = 'rgba(255,255,255,0.8)';
        starCtx.lineWidth = 1.5;
        starCtx.stroke();

        if (st.x > W || st.y > H) shootingStars.splice(i, 1);
      }
    }

    function animate(time) {
      const scrollOffset = window.scrollY || 0;
      drawNebula();
      drawStars(scrollOffset, time * 0.001);
      requestAnimationFrame(animate);
    }

    createNebula();
    createStars();
    requestAnimationFrame(animate);

    // WP Dark Mode: when toggled ON, force a resize + regenerate
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('wp-dark-mode-active')) {
        resizeCanvas();
        createNebula();
        createStars();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });
})();
