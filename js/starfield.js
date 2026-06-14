/**
 * starfield.js — 3D warp-speed starfield for a Rush 2112-themed site.
 *
 * Stars rush inward toward a central vanishing point, stretching into
 * streaks as they recede — evoking reverse travel through deep space.
 *
 * Respects prefers-reduced-motion by rendering a static starfield.
 * Self-initialises on DOMContentLoaded — no markup changes required.
 */
;(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Configuration                                                      */
  /* ------------------------------------------------------------------ */

  var STAR_COUNT       = 400;
  var SPEED            = 0.45;            // base travel speed (screen space rate)
  var MIN_DEPTH        = 10;              // spawn depth near viewer (larger size/alpha)
  var MAX_DEPTH        = 1000;            // reset depth far away (tiny size/alpha)
  var STREAK_LENGTH    = 4;               // trail multiplier
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
    if (startFar) {
      // Distribute 1/z uniformly for uniform visual density on the screen
      var invZ = rand(1 / MAX_DEPTH, 1 / MIN_DEPTH);
      this.z = 1 / invZ;
      this.x = rand(-this.z, this.z);
      this.y = rand(-this.z, this.z);
    } else {
      this.z = MIN_DEPTH;
      // When resetting, spawn stars just outside the screen edges at MIN_DEPTH so they fly inward
      var side = Math.floor(Math.random() * 4);
      var border = 1.05; // start slightly off-screen
      if (side === 0) {
        this.x = -this.z * border;
        this.y = rand(-1, 1) * this.z * border;
      } else if (side === 1) {
        this.x = this.z * border;
        this.y = rand(-1, 1) * this.z * border;
      } else if (side === 2) {
        this.x = rand(-1, 1) * this.z * border;
        this.y = -this.z * border;
      } else {
        this.x = rand(-1, 1) * this.z * border;
        this.y = this.z * border;
      }
    }

    // Color
    this.isRed = Math.random() < RED_STAR_CHANCE;

    // Per-star speed variation in screen space
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
        var depthRatio = (1 / s.z - 1 / MAX_DEPTH) / (1 / MIN_DEPTH - 1 / MAX_DEPTH);
        var r  = Math.max(0.5, depthRatio * 2);
        var a  = Math.max(0.2, depthRatio);

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

        // Move star away from viewer (decreasing screen coordinate 1/z linearly)
        var invZ = 1 / s.z;
        invZ -= (SPEED * s.speed) / 1000;

        // If it reaches the center vanishing point, reset it
        if (invZ <= 1 / MAX_DEPTH) {
          s.reset(w, h, false);
          continue;
        }

        s.z = 1 / invZ;

        // Current projected position
        var sx = cx + (s.x / s.z) * cx;
        var sy = cy + (s.y / s.z) * cy;

        // Brightness and size decrease as star recedes
        var depthRatio = (invZ - 1 / MAX_DEPTH) / (1 / MIN_DEPTH - 1 / MAX_DEPTH);
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

        // Draw streak line from current to previous position (trailing behind)
        ctx.lineWidth = radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);

        // Extend the streak from previous position outward for emphasis
        var dx = prevSx - sx;
        var dy = prevSy - sy;
        var streakX = prevSx + dx * STREAK_LENGTH * depthRatio;
        var streakY = prevSy + dy * STREAK_LENGTH * depthRatio;

        ctx.lineTo(streakX, streakY);
        ctx.stroke();

        // Draw star dot at the leading edge (moving inward)
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
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
