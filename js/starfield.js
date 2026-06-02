/**
 * starfield.js — 3D warp-speed starfield for a Rush 2112-themed site.
 *
 * Stars radiate outward from a central vanishing point, stretching into
 * streaks as they accelerate — evoking travel through deep space.
 *
 * Respects prefers-reduced-motion by rendering a static starfield.
 * Self-initialises on DOMContentLoaded — no markup changes required.
 */
;(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  var STAR_COUNT       = 300;
  var SPEED            = 1.5;             // base travel speed
  var MAX_DEPTH        = 1500;            // how far "into" the screen stars spawn
  var STREAK_LENGTH    = 3;               // trail multiplier (higher = longer streaks)
  var RED_STAR_CHANCE  = 0.08;            // ~8% of stars are faint red
  var RED_COLOR_R      = 231;             // #e74c3c
  var RED_COLOR_G      = 76;
  var RED_COLOR_B      = 60;
  var RESIZE_DEBOUNCE  = 200;             // ms

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ------------------------------------------------------------------ */
  /*  Star class                                                         */
  /* ------------------------------------------------------------------ */

  function Star(w, h, startFar) {
    this.reset(w, h, startFar);
  }

  Star.prototype.reset = function (w, h, startFar) {
    // Position in 3D space centred on (0,0)
    this.x = rand(-w / 2, w / 2);
    this.y = rand(-h / 2, h / 2);
    this.z = startFar ? rand(1, MAX_DEPTH) : MAX_DEPTH;

    // Color
    this.isRed = Math.random() < RED_STAR_CHANCE;

    // Per-star speed variation for organic feel
    this.speed = rand(0.8, 1.4);
  };

  /* ------------------------------------------------------------------ */
  /*  Bootstrap on DOMContentLoaded                                      */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {

    /* --- Canvas setup ---------------------------------------------- */

    var canvas = document.createElement('canvas');
    var ctx    = canvas.getContext('2d');

    canvas.style.position     = 'fixed';
    canvas.style.top          = '0';
    canvas.style.left         = '0';
    canvas.style.width        = '100%';
    canvas.style.height       = '100%';
    canvas.style.zIndex       = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.setAttribute('aria-hidden', 'true');

    document.body.appendChild(canvas);

    /* --- Sizing ---------------------------------------------------- */

    var dpr = window.devicePixelRatio || 1;
    var w, h, cx, cy;

    function sizeCanvas() {
      w  = window.innerWidth;
      h  = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    sizeCanvas();

    /* --- Star pool ------------------------------------------------- */

    var stars = [];
    function populateStars() {
      stars = [];
      for (var i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star(w, h, true));
      }
    }
    populateStars();

    /* --- Debounced resize ------------------------------------------ */

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        sizeCanvas();
        populateStars();
        if (prefersReducedMotion()) {
          drawStatic();
        }
      }, RESIZE_DEBOUNCE);
    });

    /* --- Reduced-motion query -------------------------------------- */

    function prefersReducedMotion() {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* --- Static render (reduced motion) ---------------------------- */

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s  = stars[i];
        var sx = cx + (s.x / s.z) * cx;
        var sy = cy + (s.y / s.z) * cy;
        var r  = Math.max(0.5, (1 - s.z / MAX_DEPTH) * 2);
        var a  = Math.max(0.2, 1 - s.z / MAX_DEPTH);

        if (s.isRed) {
          ctx.fillStyle = 'rgba(' + RED_COLOR_R + ',' + RED_COLOR_G + ',' + RED_COLOR_B + ',' + (a * 0.5).toFixed(3) + ')';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        }
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* --- Animation loop -------------------------------------------- */

    var rafId = null;

    function animate() {
      // Subtle fade trail instead of full clear — gives a slight motion blur
      ctx.fillStyle = 'rgba(13, 13, 13, 0.65)';
      ctx.fillRect(0, 0, w, h);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        // Store previous projected position (for streak)
        var prevZ  = s.z;
        var prevSx = cx + (s.x / prevZ) * cx;
        var prevSy = cy + (s.y / prevZ) * cy;

        // Move star closer to viewer
        s.z -= SPEED * s.speed;

        // If past the viewer, reset to far depth
        if (s.z <= 0.5) {
          s.reset(w, h, false);
          continue;
        }

        // Current projected position
        var sx = cx + (s.x / s.z) * cx;
        var sy = cy + (s.y / s.z) * cy;

        // Skip if off-screen
        if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) {
          s.reset(w, h, false);
          continue;
        }

        // Brightness increases as star gets closer
        var depthRatio = 1 - s.z / MAX_DEPTH;
        var alpha = Math.max(0.05, depthRatio);
        var radius = Math.max(0.3, depthRatio * 2.5);

        // Set color
        if (s.isRed) {
          var ra = (alpha * 0.6).toFixed(3);
          ctx.strokeStyle = 'rgba(' + RED_COLOR_R + ',' + RED_COLOR_G + ',' + RED_COLOR_B + ',' + ra + ')';
          ctx.fillStyle   = 'rgba(' + RED_COLOR_R + ',' + RED_COLOR_G + ',' + RED_COLOR_B + ',' + ra + ')';
        } else {
          var wa = alpha.toFixed(3);
          ctx.strokeStyle = 'rgba(255,255,255,' + wa + ')';
          ctx.fillStyle   = 'rgba(255,255,255,' + wa + ')';
        }

        // Draw streak line from previous to current position
        ctx.lineWidth = radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(prevSx, prevSy);

        // Extend the streak beyond current position for emphasis
        var dx = sx - prevSx;
        var dy = sy - prevSy;
        var streakX = sx + dx * STREAK_LENGTH * depthRatio;
        var streakY = sy + dy * STREAK_LENGTH * depthRatio;

        ctx.lineTo(streakX, streakY);
        ctx.stroke();

        // Draw star dot at the leading edge
        ctx.beginPath();
        ctx.arc(streakX, streakY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    }

    /* --- Kick off -------------------------------------------------- */

    // Do an initial full clear so the fade trail starts clean
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, w, h);

    if (prefersReducedMotion()) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(animate);
    }

    /* --- Listen for runtime preference changes --------------------- */

    if (window.matchMedia) {
      var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onChange = function () {
        if (motionQuery.matches) {
          cancelAnimationFrame(rafId);
          rafId = null;
          ctx.fillStyle = '#0d0d0d';
          ctx.fillRect(0, 0, w, h);
          drawStatic();
        } else {
          if (!rafId) {
            ctx.fillStyle = '#0d0d0d';
            ctx.fillRect(0, 0, w, h);
            rafId = requestAnimationFrame(animate);
          }
        }
      };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', onChange);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(onChange);
      }
    }
  });
})();
