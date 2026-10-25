/**
 * spicefield.js — Daylight Arrakis Desert Vista with Surface & Swirling Horizon Sand.
 *
 * Renders:
 * 1. Pale, sun-bleached Arrakis sky (upper ~68%).
 * 2. Sculpted 3D sand dune mounds (lower ~32%).
 * 3. Swirling Horizon Crest Sand & Eddies:
 *    - 550 swirling sand & spice grains + 22 curling crest plumes anchored
 *      directly to the uppermost horizon ridge where the dunes meet the sky,
 *      whipping and eddying along and just above the horizon surface.
 * 4. Ground-hugging saltating sand grains (950 grains + 26 wisps) across the
 *    lower desert floor.
 */
;(function () {
  'use strict';

  var GRAIN_COUNT = 950;
  var WISP_COUNT = 26;
  var HORIZON_SWIRL_COUNT = 550;
  var CREST_PLUME_COUNT = 22;
  var RESIZE_DEBOUNCE = 200;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ------------------------------------------------------------------ */
  /*  Cubic Bezier evaluation helper for exact horizon crest tracking   */
  /* ------------------------------------------------------------------ */

  function cubicBezier(t, p0, p1, p2, p3) {
    var u = 1 - t;
    return u * u * u * p0 +
           3 * u * u * t * p1 +
           3 * u * t * t * p2 +
           t * t * t * p3;
  }

  function evalBezierSplineY(xNorm, segments, h) {
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (xNorm >= s.x0 && xNorm <= s.x3) {
        var t = (xNorm - s.x0) / (s.x3 - s.x0);
        return cubicBezier(t, s.y0, s.cp1y, s.cp2y, s.y3) * h;
      }
    }
    return h * 0.68;
  }

  // Exact top silhouette of the horizon dunes (minimum Y of the upper dune mounds)
  var leftHorizonSegs = [
    { x0: 0.00, y0: 0.672, cp1y: 0.658, cp2y: 0.686, x3: 0.16, y3: 0.666 },
    { x0: 0.16, y0: 0.666, cp1y: 0.655, cp2y: 0.652, x3: 0.35, y3: 0.675 },
    { x0: 0.35, y0: 0.675, cp1y: 0.690, cp2y: 0.662, x3: 0.50, y3: 0.688 },
    { x0: 0.50, y0: 0.688, cp1y: 0.705, cp2y: 0.700, x3: 1.00, y3: 0.710 }
  ];

  var rightMassifSegs = [
    { x0: 0.38, y0: 0.720, cp1y: 0.710, cp2y: 0.635, x3: 0.63, y3: 0.638 },
    { x0: 0.63, y0: 0.638, cp1y: 0.640, cp2y: 0.632, x3: 0.87, y3: 0.645 },
    { x0: 0.87, y0: 0.645, cp1y: 0.655, cp2y: 0.660, x3: 1.00, y3: 0.665 }
  ];

  function getHorizonCrestY(xNorm, h) {
    var yLeft = evalBezierSplineY(xNorm, leftHorizonSegs, h);
    if (xNorm >= 0.38) {
      var yRight = evalBezierSplineY(xNorm, rightMassifSegs, h);
      return Math.min(yLeft, yRight);
    }
    return yLeft;
  }

  function getTerrainY(xNorm, h) {
    return getHorizonCrestY(xNorm, h);
  }

  function getTerrainSlope(xNorm, h) {
    var delta = 0.01;
    var y1 = getHorizonCrestY(Math.max(0, xNorm - delta), h);
    var y2 = getHorizonCrestY(Math.min(1, xNorm + delta), h);
    return (y2 - y1) / (2 * delta * h);
  }

  /* ------------------------------------------------------------------ */
  /*  Swirling Horizon Crest Grain (Eddies along the horizon surface)   */
  /* ------------------------------------------------------------------ */

  function HorizonSwirlGrain(w, h, randomX) {
    this.reset(w, h, randomX);
  }

  HorizonSwirlGrain.prototype.reset = function (w, h, randomX) {
    this.x = randomX ? rand(0, w) : -rand(5, 60);
    // Hug the horizon line closely: from 18px above the ridge to 16px below it
    this.crestOffset = rand(-14, 16);

    // Swirling vortex / eddy parameters
    this.swirlAngle = rand(0, Math.PI * 2);
    this.swirlSpeed = rand(0.06, 0.16) * (Math.random() < 0.25 ? -1 : 1);
    this.swirlRadiusX = rand(3, 14);
    this.swirlRadiusY = rand(2, 9);

    // Wave undulation along the ridge
    this.wavePhase = rand(0, Math.PI * 2);
    this.waveSpeed = rand(0.03, 0.08);
    this.waveAmp = rand(2, 8);

    this.baseVx = rand(1.2, 3.1);
    this.radius = rand(0.65, 1.55);
    this.alpha = rand(0.42, 0.88);

    // Rich sand & spice tones that stand out against both the pale horizon sky and the dune crest
    var r = Math.random();
    if (r < 0.22) {
      this.color = '208, 108, 34'; // Glowing spice-amber grain
    } else if (r < 0.65) {
      this.color = '198, 144, 98'; // Warm golden-ochre sand (contrasts against pale sky & sand)
    } else {
      this.color = '232, 188, 145'; // Sunlit desert crest sand
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Horizon Crest Plume Eddy (Soft swirling dust veil on the ridge)   */
  /* ------------------------------------------------------------------ */

  function CrestPlume(w, h, randomX) {
    this.reset(w, h, randomX);
  }

  CrestPlume.prototype.reset = function (w, h, randomX) {
    this.width = rand(w * 0.06, w * 0.16);
    this.height = rand(10, 24);
    this.x = randomX ? rand(-this.width, w) : -this.width - rand(10, 80);
    this.crestOffset = rand(-6, 6);
    this.vx = rand(0.9, 2.1);
    this.swirlPhase = rand(0, Math.PI * 2);
    this.swirlSpeed = rand(0.03, 0.07);
    this.alpha = rand(0.12, 0.26);
  };

  /* ------------------------------------------------------------------ */
  /*  Saltating Desert Floor Sand Grain                                 */
  /* ------------------------------------------------------------------ */

  function SandGrain(w, h, randomX) {
    this.reset(w, h, randomX);
  }

  SandGrain.prototype.reset = function (w, h, randomX) {
    this.floorDepth = Math.pow(rand(0, 1), 0.78);
    this.x = randomX ? rand(0, w) : -rand(5, 50);

    // Spread from right near the top dune crest down to the bottom of the screen
    this.floorOffset = this.floorDepth * (h * 0.34) + rand(-h * 0.005, h * 0.015);

    this.hopPhase = rand(0, Math.PI * 2);
    this.hopSpeed = rand(0.12, 0.28);
    this.hopHeight = rand(1.0, 5.5) * (0.4 + this.floorDepth * 0.6);

    this.baseVx = rand(1.6, 4.2) * (0.35 + this.floorDepth * 0.85);
    this.radius = rand(0.65, 1.75) * (0.5 + this.floorDepth * 0.65);
    this.alpha = rand(0.38, 0.88);

    var r = Math.random();
    if (r < 0.18) {
      this.color = '210, 112, 38';
    } else if (r < 0.58) {
      this.color = '255, 242, 225';
    } else {
      this.color = '196, 142, 96';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Translucent Blowing Sand Wisp (Sheet-Flow / Crest Plume)          */
  /* ------------------------------------------------------------------ */

  function SandWisp(w, h, randomX) {
    this.reset(w, h, randomX);
  }

  SandWisp.prototype.reset = function (w, h, randomX) {
    this.floorDepth = rand(0.02, 0.95);
    this.length = rand(w * 0.12, w * 0.28) * (0.5 + this.floorDepth * 0.6);
    this.thickness = rand(6, 18) * (0.5 + this.floorDepth * 0.7);
    this.x = randomX ? rand(-this.length, w) : -this.length - rand(10, 120);
    this.floorOffset = this.floorDepth * (h * 0.31);
    this.vx = rand(1.1, 2.5) * (0.4 + this.floorDepth * 0.75);
    this.alpha = rand(0.07, 0.18);
    this.phase = rand(0, Math.PI * 2);
  };

  /* ------------------------------------------------------------------ */
  /*  Bootstrap on DOMContentLoaded                                      */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.setAttribute('aria-hidden', 'true');

    document.body.appendChild(canvas);

    var dpr = window.devicePixelRatio || 1;
    var w, h;
    var windTime = 0;

    function sizeCanvas() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    sizeCanvas();

    var grains = [];
    var wisps = [];
    var horizonSwirls = [];
    var crestPlumes = [];

    function populateSand() {
      grains = [];
      for (var i = 0; i < GRAIN_COUNT; i++) {
        grains.push(new SandGrain(w, h, true));
      }
      wisps = [];
      for (var j = 0; j < WISP_COUNT; j++) {
        wisps.push(new SandWisp(w, h, true));
      }
      horizonSwirls = [];
      for (var k = 0; k < HORIZON_SWIRL_COUNT; k++) {
        horizonSwirls.push(new HorizonSwirlGrain(w, h, true));
      }
      crestPlumes = [];
      for (var m = 0; m < CREST_PLUME_COUNT; m++) {
        crestPlumes.push(new CrestPlume(w, h, true));
      }
    }
    populateSand();

    /* --- Helper: Draw a sculpted 3D dune mound using cubic Beziers --- */
    function fillDuneMound(points, gradTopY, gradBottomY, colorStops) {
      var grad = ctx.createLinearGradient(0, gradTopY, 0, gradBottomY);
      for (var i = 0; i < colorStops.length; i++) {
        grad.addColorStop(colorStops[i][0], colorStops[i][1]);
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var j = 1; j < points.length; j++) {
        var p = points[j];
        ctx.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }

    /* --- Render Daylight Arrakis Sky & Rolling Sand Erg ------------ */
    function drawDesertVista() {
      var horizonY = h * 0.68;

      // 1. SUN-BLEACHED ARRAKIS DAYLIGHT SKY
      var skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY + h * 0.05);
      skyGrad.addColorStop(0.00, '#b5cae0');
      skyGrad.addColorStop(0.35, '#cad9e8');
      skyGrad.addColorStop(0.70, '#e2e9f0');
      skyGrad.addColorStop(0.92, '#f1f2f4');
      skyGrad.addColorStop(1.00, '#f5ebe0');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 1b. TWIN MOONS OF ARRAKIS (Krelln & Muad'Dib — positioned in the left sky below the banner)
      var moon1X = w * 0.095;
      var moon1Y = h * 0.455;
      var moon1R = Math.max(22, Math.min(w, h) * 0.038);

      // Soft warm atmospheric corona around First Moon (Krelln)
      var moon1Halo = ctx.createRadialGradient(moon1X, moon1Y, moon1R * 0.6, moon1X, moon1Y, moon1R * 2.6);
      moon1Halo.addColorStop(0.0, 'rgba(232, 188, 142, 0.35)');
      moon1Halo.addColorStop(0.5, 'rgba(232, 188, 142, 0.12)');
      moon1Halo.addColorStop(1.0, 'rgba(232, 188, 142, 0)');
      ctx.fillStyle = moon1Halo;
      ctx.beginPath();
      ctx.arc(moon1X, moon1Y, moon1R * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit disc of First Moon
      var moon1Grad = ctx.createLinearGradient(
        moon1X - moon1R, moon1Y - moon1R,
        moon1X + moon1R, moon1Y + moon1R
      );
      moon1Grad.addColorStop(0.0, '#fffaf2');
      moon1Grad.addColorStop(0.45, '#efd0ae');
      moon1Grad.addColorStop(0.85, '#cf9b6a');
      moon1Grad.addColorStop(1.0, '#b87f4c');
      ctx.fillStyle = moon1Grad;
      ctx.beginPath();
      ctx.arc(moon1X, moon1Y, moon1R, 0, Math.PI * 2);
      ctx.fill();

      // Daylight sky-blended shadow cutout to form a sculpted crescent on Moon 1
      ctx.save();
      ctx.beginPath();
      ctx.arc(moon1X, moon1Y, moon1R, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(206, 220, 234, 0.78)';
      ctx.beginPath();
      ctx.arc(moon1X - moon1R * 0.42, moon1Y + moon1R * 0.12, moon1R * 0.92, 0, Math.PI * 2);
      ctx.fill();

      // Subtle rim highlight on the sunlit edge of Moon 1
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(moon1X, moon1Y, moon1R - 0.75, -Math.PI * 0.55, Math.PI * 0.42);
      ctx.stroke();
      ctx.restore();

      // Second smaller moon (Muad'Dib) — companion moon down and to the right
      var moon2X = moon1X + moon1R * 1.95;
      var moon2Y = moon1Y + moon1R * 1.35;
      var moon2R = moon1R * 0.48;

      var moon2Halo = ctx.createRadialGradient(moon2X, moon2Y, moon2R * 0.4, moon2X, moon2Y, moon2R * 2.4);
      moon2Halo.addColorStop(0.0, 'rgba(224, 152, 88, 0.32)');
      moon2Halo.addColorStop(1.0, 'rgba(224, 152, 88, 0)');
      ctx.fillStyle = moon2Halo;
      ctx.beginPath();
      ctx.arc(moon2X, moon2Y, moon2R * 2.4, 0, Math.PI * 2);
      ctx.fill();

      var moon2Grad = ctx.createLinearGradient(
        moon2X - moon2R, moon2Y - moon2R,
        moon2X + moon2R, moon2Y + moon2R
      );
      moon2Grad.addColorStop(0.0, '#fff6e8');
      moon2Grad.addColorStop(0.5, '#e8bc8e');
      moon2Grad.addColorStop(1.0, '#bf824e');
      ctx.fillStyle = moon2Grad;
      ctx.beginPath();
      ctx.arc(moon2X, moon2Y, moon2R, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(moon2X, moon2Y, moon2R, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = 'rgba(214, 226, 238, 0.74)';
      ctx.beginPath();
      ctx.arc(moon2X - moon2R * 0.38, moon2Y + moon2R * 0.14, moon2R * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 248, 235, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(moon2X, moon2Y, moon2R - 0.6, -Math.PI * 0.55, Math.PI * 0.42);
      ctx.stroke();
      ctx.restore();

      // 2. DISTANT HIGH DUNE MASSIF (Right-side background plateau)
      fillDuneMound(
        [
          { x: w * 0.38, y: horizonY + h * 0.04 },
          {
            cp1x: w * 0.48, cp1y: horizonY + h * 0.03,
            cp2x: w * 0.54, cp2y: horizonY - h * 0.045,
            x: w * 0.63, y: horizonY - h * 0.042
          },
          {
            cp1x: w * 0.72, cp1y: horizonY - h * 0.04,
            cp2x: w * 0.79, cp2y: horizonY - h * 0.048,
            x: w * 0.87, y: horizonY - h * 0.035
          },
          {
            cp1x: w * 0.93, cp1y: horizonY - h * 0.025,
            cp2x: w * 0.97, cp2y: horizonY - h * 0.02,
            x: w, y: horizonY - h * 0.015
          }
        ],
        horizonY - h * 0.05,
        horizonY + h * 0.14,
        [
          [0.0, '#edd5be'],
          [0.5, '#e2bfa0'],
          [1.0, '#d4ab87']
        ]
      );

      // 3. DISTANT LEFT & CENTER ROLLING DUNE PEAKS
      fillDuneMound(
        [
          { x: 0, y: horizonY - h * 0.008 },
          {
            cp1x: w * 0.04, cp1y: horizonY - h * 0.022,
            cp2x: w * 0.09, cp2y: horizonY + h * 0.006,
            x: w * 0.16, y: horizonY - h * 0.014
          },
          {
            cp1x: w * 0.21, cp1y: horizonY - h * 0.025,
            cp2x: w * 0.27, cp2y: horizonY - h * 0.028,
            x: w * 0.35, y: horizonY - h * 0.005
          },
          {
            cp1x: w * 0.41, cp1y: horizonY + h * 0.01,
            cp2x: w * 0.44, cp2y: horizonY - h * 0.018,
            x: w * 0.50, y: horizonY + h * 0.008
          },
          {
            cp1x: w * 0.58, cp1y: horizonY + h * 0.025,
            cp2x: w * 0.75, cp2y: horizonY + h * 0.02,
            x: w, y: horizonY + h * 0.03
          }
        ],
        horizonY - h * 0.03,
        horizonY + h * 0.15,
        [
          [0.0, '#e3be9e'],
          [0.45, '#d7ab86'],
          [1.0, '#c8966e']
        ]
      );

      // 4. MID-FAR SCULPTED DUNES
      fillDuneMound(
        [
          { x: 0, y: horizonY + h * 0.025 },
          {
            cp1x: w * 0.08, cp1y: horizonY + h * 0.01,
            cp2x: w * 0.18, cp2y: horizonY + h * 0.055,
            x: w * 0.28, y: horizonY + h * 0.022
          },
          {
            cp1x: w * 0.38, cp1y: horizonY - h * 0.005,
            cp2x: w * 0.50, cp2y: horizonY + h * 0.045,
            x: w * 0.62, y: horizonY + h * 0.018
          },
          {
            cp1x: w * 0.72, cp1y: horizonY - h * 0.008,
            cp2x: w * 0.84, cp2y: horizonY + h * 0.025,
            x: w, y: horizonY + h * 0.012
          }
        ],
        horizonY,
        horizonY + h * 0.22,
        [
          [0.0, '#eac8aa'],
          [0.55, '#dca982'],
          [1.0, '#ca936a']
        ]
      );

      // 5. MID-GROUND SWEEPING LEFT-TO-CENTER DUNE
      fillDuneMound(
        [
          { x: 0, y: horizonY + h * 0.09 },
          {
            cp1x: w * 0.12, cp1y: horizonY + h * 0.04,
            cp2x: w * 0.24, cp2y: horizonY + h * 0.018,
            x: w * 0.38, y: horizonY + h * 0.042
          },
          {
            cp1x: w * 0.52, cp1y: horizonY + h * 0.068,
            cp2x: w * 0.68, cp2y: horizonY + h * 0.095,
            x: w * 0.84, y: horizonY + h * 0.072
          },
          {
            cp1x: w * 0.92, cp1y: horizonY + h * 0.062,
            cp2x: w * 0.96, cp2y: horizonY + h * 0.058,
            x: w, y: horizonY + h * 0.055
          }
        ],
        horizonY + h * 0.02,
        h,
        [
          [0.0, '#edd0b5'],
          [0.4, '#e2b996'],
          [0.85, '#d3a27b'],
          [1.0, '#c79269']
        ]
      );

      // 6. MID-RIGHT INTERLOCKING DUNE POCKET
      fillDuneMound(
        [
          { x: w * 0.35, y: horizonY + h * 0.14 },
          {
            cp1x: w * 0.48, cp1y: horizonY + h * 0.10,
            cp2x: w * 0.62, cp2y: horizonY + h * 0.075,
            x: w * 0.78, y: horizonY + h * 0.088
          },
          {
            cp1x: w * 0.88, cp1y: horizonY + h * 0.096,
            cp2x: w * 0.95, cp2y: horizonY + h * 0.08,
            x: w, y: horizonY + h * 0.075
          }
        ],
        horizonY + h * 0.07,
        h,
        [
          [0.0, '#d7a57e'],
          [0.5, '#e4be9c'],
          [1.0, '#d6a67f']
        ]
      );

      // 7. FOREGROUND SUNLIT DUNE SLOPE
      fillDuneMound(
        [
          { x: 0, y: horizonY + h * 0.21 },
          {
            cp1x: w * 0.18, cp1y: horizonY + h * 0.19,
            cp2x: w * 0.42, cp2y: horizonY + h * 0.125,
            x: w * 0.66, y: horizonY + h * 0.145
          },
          {
            cp1x: w * 0.82, cp1y: horizonY + h * 0.158,
            cp2x: w * 0.92, cp2y: horizonY + h * 0.185,
            x: w, y: horizonY + h * 0.205
          }
        ],
        horizonY + h * 0.12,
        h,
        [
          [0.0, '#f3dac2'],
          [0.45, '#eccab0'],
          [0.85, '#dfb796'],
          [1.0, '#d5aa86']
        ]
      );
    }

    /* --- Draw Swirling Sand on the Horizon Surface & Desert Floor -- */
    function drawBlowingSand(gustFactor) {
      // 1. HORIZON CREST PLUME EDDIES (Soft swirling sand-mist right on the horizon edge)
      for (var p = 0; p < crestPlumes.length; p++) {
        var cp = crestPlumes[p];
        cp.x += cp.vx * gustFactor;
        cp.swirlPhase += cp.swirlSpeed;

        if (cp.x > w + 40) {
          cp.reset(w, h, false);
          continue;
        }

        var cxNorm = Math.max(0, Math.min(1, (cp.x + cp.width * 0.5) / w));
        var crestY = getHorizonCrestY(cxNorm, h) + cp.crestOffset + Math.sin(cp.swirlPhase) * 3.5;
        var crestSlope = getTerrainSlope(cxNorm, h);

        ctx.save();
        ctx.translate(cp.x + cp.width * 0.5, crestY);
        ctx.rotate(Math.atan(crestSlope * 0.7) + Math.sin(cp.swirlPhase) * 0.08);

        var pGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, cp.width * 0.5);
        var pa = (cp.alpha * (0.75 + 0.25 * Math.cos(cp.swirlPhase))).toFixed(3);
        pGrad.addColorStop(0.0, 'rgba(226, 184, 144, ' + pa + ')');
        pGrad.addColorStop(0.55, 'rgba(235, 200, 165, ' + (cp.alpha * 0.45).toFixed(3) + ')');
        pGrad.addColorStop(1.0, 'rgba(235, 200, 165, 0)');

        ctx.fillStyle = pGrad;
        ctx.scale(1, cp.height / (cp.width * 0.5));
        ctx.beginPath();
        ctx.arc(0, 0, cp.width * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. SWIRLING HORIZON CREST GRAINS (Eddying & curling right along the horizon surface)
      for (var k = 0; k < horizonSwirls.length; k++) {
        var hs = horizonSwirls[k];

        var prevAngle = hs.swirlAngle;
        var prevWave = hs.wavePhase;
        var prevBaseX = hs.x;

        var hvx = hs.baseVx * gustFactor;
        hs.x += hvx;
        hs.swirlAngle += hs.swirlSpeed;
        hs.wavePhase += hs.waveSpeed;

        if (hs.x > w + 20) {
          hs.reset(w, h, false);
          continue;
        }

        var hxNorm = Math.max(0, Math.min(1, hs.x / w));
        var prevHxNorm = Math.max(0, Math.min(1, prevBaseX / w));

        var ridgeY = getHorizonCrestY(hxNorm, h);
        var prevRidgeY = getHorizonCrestY(prevHxNorm, h);

        // Swirling vortex offset + wave curl along the horizon ridge
        var curX = hs.x + Math.cos(hs.swirlAngle) * hs.swirlRadiusX;
        var curY = ridgeY + hs.crestOffset +
                   Math.sin(hs.swirlAngle) * hs.swirlRadiusY -
                   Math.abs(Math.sin(hs.wavePhase)) * hs.waveAmp;

        var oldX = prevBaseX + Math.cos(prevAngle) * hs.swirlRadiusX;
        var oldY = prevRidgeY + hs.crestOffset +
                   Math.sin(prevAngle) * hs.swirlRadiusY -
                   Math.abs(Math.sin(prevWave)) * hs.waveAmp;

        var hAlpha = hs.alpha * (0.65 + 0.35 * Math.sin(hs.swirlAngle));

        ctx.strokeStyle = 'rgba(' + hs.color + ', ' + (hAlpha * 0.85).toFixed(3) + ')';
        ctx.lineWidth = hs.radius * 1.15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(oldX, oldY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      }

      // 3. LOWER DESERT FLOOR SAND WISPS
      for (var j = 0; j < wisps.length; j++) {
        var wisp = wisps[j];
        wisp.x += wisp.vx * gustFactor;
        wisp.phase += 0.02;

        if (wisp.x > w + 50) {
          wisp.reset(w, h, false);
          continue;
        }

        var xMidNorm = Math.max(0, Math.min(1, (wisp.x + wisp.length * 0.5) / w));
        var yBase = getTerrainY(xMidNorm, h) + wisp.floorOffset;
        var slope = getTerrainSlope(xMidNorm, h);

        ctx.save();
        ctx.translate(wisp.x + wisp.length * 0.5, yBase);
        ctx.rotate(Math.atan(slope * 0.45));

        var wispGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, wisp.length * 0.5);
        var a = (wisp.alpha * (0.8 + 0.2 * Math.sin(wisp.phase))).toFixed(3);
        wispGrad.addColorStop(0.0, 'rgba(252, 236, 218, ' + a + ')');
        wispGrad.addColorStop(0.5, 'rgba(238, 206, 174, ' + (wisp.alpha * 0.5).toFixed(3) + ')');
        wispGrad.addColorStop(1.0, 'rgba(238, 206, 174, 0)');

        ctx.fillStyle = wispGrad;
        ctx.scale(1, wisp.thickness / (wisp.length * 0.5));
        ctx.beginPath();
        ctx.arc(0, 0, wisp.length * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. SALTATING DESERT FLOOR SAND GRAINS
      for (var i = 0; i < grains.length; i++) {
        var g = grains[i];

        var vx = g.baseVx * gustFactor;
        g.x += vx;
        g.hopPhase += g.hopSpeed;

        if (g.x > w + 12) {
          g.reset(w, h, false);
          continue;
        }

        var xNorm = Math.max(0, Math.min(1, g.x / w));
        var surfaceY = getTerrainY(xNorm, h) + g.floorOffset;
        var bounce = Math.abs(Math.sin(g.hopPhase)) * g.hopHeight;
        var y = surfaceY - bounce;

        var prevXNorm = Math.max(0, Math.min(1, (g.x - vx * 1.4) / w));
        var prevSurfaceY = getTerrainY(prevXNorm, h) + g.floorOffset;
        var prevBounce = Math.abs(Math.sin(g.hopPhase - g.hopSpeed)) * g.hopHeight;
        var prevY = prevSurfaceY - prevBounce;

        var alpha = g.alpha * (0.65 + 0.35 * Math.sin(g.hopPhase));

        ctx.strokeStyle = 'rgba(' + g.color + ', ' + (alpha * 0.75).toFixed(3) + ')';
        ctx.lineWidth = g.radius * 1.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevXNorm * w, prevY);
        ctx.lineTo(g.x, y);
        ctx.stroke();
      }
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        sizeCanvas();
        populateSand();
        if (prefersReducedMotion()) {
          drawStatic();
        }
      }, RESIZE_DEBOUNCE);
    });

    function prefersReducedMotion() {
      return window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      drawDesertVista();
    }

    var rafId = null;

    function animate() {
      windTime += 0.018;
      var gustFactor = 1.0 + 0.25 * Math.sin(windTime) + 0.1 * Math.cos(windTime * 2.3);

      drawDesertVista();
      drawBlowingSand(gustFactor);

      rafId = requestAnimationFrame(animate);
    }

    if (prefersReducedMotion()) {
      drawStatic();
    } else {
      rafId = requestAnimationFrame(animate);
    }

    if (window.matchMedia) {
      var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onChange = function () {
        if (motionQuery.matches) {
          cancelAnimationFrame(rafId);
          rafId = null;
          drawStatic();
        } else if (!rafId) {
          rafId = requestAnimationFrame(animate);
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
