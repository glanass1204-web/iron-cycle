/* Progressive enhancement: no workout, payment, profile or storage logic here. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var running = new Set();
  var EASE = 'cubic-bezier(.22, 1, .36, 1)';
  var nav = document.querySelector('.tabbar-in');
  var gym = document.getElementById('gym');
  var lastGym = null;
  var direction = 1;
  var scheduled = false;

  function animate(el, frames, options) {
    if (!el || preference.matches || !el.animate || !el.isConnected || el.getClientRects().length === 0) return;
    var a = el.animate(frames, Object.assign({ duration: 320, easing: EASE }, options));
    running.add(a);
    a.finished.then(function () { running.delete(a); }, function () { running.delete(a); });
    return a;
  }
  function navPosition() {
    if (!nav) return;
    var current = nav.querySelector('[aria-current="page"]');
    if (!current) return;
    nav.style.setProperty('--nav-x', current.offsetLeft + 'px');
    nav.style.setProperty('--nav-width', current.offsetWidth + 'px');
  }
  function scheduleNav() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; navPosition(); });
  }
  function visibleSections() {
    var tab = document.body.getAttribute('data-tab');
    return document.querySelectorAll('main > section[data-tab="' + tab + '"]');
  }
  function enterVisible() {
    visibleSections().forEach(function (section) {
      animate(section, [ { opacity: .35, transform: 'translate3d(' + direction * 14 + 'px,6px,0)' }, { opacity: 1, transform: 'none' } ]);
    });
  }
  function gymState() {
    if (!gym || gym.hidden) { lastGym = null; return; }
    var body = gym.querySelector('.gym-body');
    if (!body) return;
    var title = gym.querySelector('#gym-title');
    var question = gym.querySelector('.gym-logq');
    var weight = gym.querySelector('.gym-kg b');
    var mode = (title ? title.textContent : '') + '|' + !!question + '|' + body.classList.contains('gym-fin');
    var state = { mode: mode, weight: weight ? weight.textContent : '' };
    if (!lastGym || state.mode !== lastGym.mode) {
      animate(body, [ { opacity: 0, transform: 'translate3d(' + direction * 22 + 'px,8px,0)' }, { opacity: 1, transform: 'none' } ], { duration: 360 });
    } else if (weight && state.weight !== lastGym.weight) {
      animate(weight, [ { opacity: .4, transform: 'translateY(9px)' }, { opacity: 1, transform: 'none' } ], { duration: 240 });
    }
    lastGym = state;
  }
  if (nav) {
    new MutationObserver(scheduleNav).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
    if (window.ResizeObserver) new ResizeObserver(scheduleNav).observe(nav);
    window.addEventListener('resize', scheduleNav, { passive: true });
    navPosition();
  }
  if (gym) new MutationObserver(gymState).observe(gym, { childList: true, attributes: true, attributeFilter: ['hidden'] });

  // Capture direction before the app handles navigation, then animate its final DOM.
  document.addEventListener('click', function (event) {
    var target = event.target.closest('button, a');
    if (!target || target.disabled) return;
    var next = target.getAttribute('data-tabgo');
    if (next) {
      var order = ['today', 'week', 'stats', 'club'];
      var old = document.body.getAttribute('data-tab');
      direction = order.indexOf(next) >= order.indexOf(old) ? 1 : -1;
      document.body.style.setProperty('--motion-x', direction * 16 + 'px');
    }
    var gx = target.getAttribute('data-gx');
    if (gx) direction = gx === 'prev' || gx === 'undo' ? -1 : 1;
    if (target.hasAttribute('data-w') || target.hasAttribute('data-goweek')) {
      var current = document.querySelector('#rail [aria-current]');
      var newWeek = +(target.getAttribute('data-w') || target.getAttribute('data-goweek'));
      direction = !current || newWeek >= +current.getAttribute('data-w') ? 1 : -1;
      requestAnimationFrame(enterVisible);
    }
    if (target.hasAttribute('data-toggle')) {
      var day = target.closest('.day');
      // The app toggles display; only animate content after it has opened.
      requestAnimationFrame(function () {
        if (day && !day.classList.contains('collapsed')) animate(day.querySelector('.day-body'), [ { opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' } ], { duration: 260 });
      });
    }
    if (target.hasAttribute('data-ready')) requestAnimationFrame(function () {
      var active = document.querySelector('#today .chip-btn.on');
      animate(active, [ { transform: 'scale(.94)' }, { transform: 'scale(1)' } ], { duration: 280 });
      var weight = document.querySelector('#today .topset .big');
      animate(weight, [ { opacity: .5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' } ], { duration: 230 });
    });
    if (gx === 'set' || target.hasAttribute('data-done')) {
      requestAnimationFrame(function () {
        var ring = document.querySelector('.gym .set-ring');
        animate(ring, [ { transform: 'scale(.9)' }, { transform: 'scale(1.04)', offset: .65 }, { transform: 'scale(1)' } ], { duration: 320 });
      });
    }
  }, true);

  // Keep the active marker aligned after fonts load, page restoration and rotation.
  window.addEventListener('pageshow', function () { scheduleNav(); gymState(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleNav);
  function reducedChanged() {
    if (preference.matches) { running.forEach(function (a) { a.cancel(); }); running.clear(); }
    scheduleNav();
  }
  if (preference.addEventListener) preference.addEventListener('change', reducedChanged);
  else if (preference.addListener) preference.addListener(reducedChanged);
})();
