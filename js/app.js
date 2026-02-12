/* ============================================
   99 Rutes en Moto per Catalunya
   Main Application JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Data References ---
  const ROUTES = window.ROUTES_DATA || [];
  const SHOWCASE = window.SHOWCASE_DATA || [];

  // --- DOM References ---
  const mapEl = document.getElementById('routes-map');
  const showcaseGrid = document.getElementById('showcase-grid');
  const indexGrid = document.getElementById('index-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('route-search');
  const ctaForm = document.getElementById('cta-form');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const modalOverlay = document.getElementById('coming-soon-modal');
  const modalCloseBtn = document.getElementById('modal-close');

  // --- State ---
  let map = null;
  let activeFilter = 'all';
  let searchQuery = '';

  // --- Initialization ---
  function init() {
    initNavigation();
    initMap();
    renderShowcaseCards();
    renderRouteIndex();
    initFilters();
    initSearch();
    initCTAForm();
    initModal();
  }

  // --- Navigation ---
  function initNavigation() {
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('open');
        this.setAttribute('aria-expanded', navMenu.classList.contains('open'));
      });

      // Close nav on link click
      navMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navMenu.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close nav on outside click
      document.addEventListener('click', function (e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // --- Leaflet Map ---
  function initMap() {
    if (!mapEl || typeof L === 'undefined') return;

    map = L.map('routes-map', {
      scrollWheelZoom: false,
    }).setView([41.7, 1.8], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    addRouteMarkers();
  }

  function addRouteMarkers() {
    if (!map) return;

    var allRoutes = ROUTES.length > 0 ? ROUTES : [];

    // Also add showcase routes if they have coordinates
    var showcaseIds = new Set();
    SHOWCASE.forEach(function (route) {
      if (route.start_coords) {
        showcaseIds.add(route.id);
        var isPro = route.category === 'Pro';
        var markerColor = isPro ? '#e94560' : '#53c28b';

        var icon = L.divIcon({
          className: 'custom-marker',
          html:
            '<div style="width:14px;height:14px;border-radius:50%;background:' +
            markerColor +
            ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        var marker = L.marker(route.start_coords, { icon: icon }).addTo(map);

        var popupContent =
          '<div>' +
          '<div class="popup-title">' +
          escapeHTML(route.name) +
          '</div>' +
          '<div class="popup-meta">' +
          (route.distance_km || '?') +
          ' km &middot; ' +
          (route.duration_hours || '?') +
          'h &middot; ' +
          (isPro ? 'Pro' : 'Aprendiz') +
          '</div>' +
          '<a class="popup-link" href="route.html?id=' +
          encodeURIComponent(route.id) +
          '">Veure detall &rarr;</a>' +
          '</div>';

        marker.bindPopup(popupContent);
      }
    });

    // Add non-showcase routes from ROUTES_DATA
    allRoutes.forEach(function (route) {
      if (showcaseIds.has(route.id)) return;
      if (!route.start_coords) return;

      var isPro = route.category === 'Pro';
      var markerColor = isPro ? '#e94560' : '#53c28b';

      var icon = L.divIcon({
        className: 'custom-marker',
        html:
          '<div style="width:10px;height:10px;border-radius:50%;background:' +
          markerColor +
          ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);opacity:0.7;"></div>',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      var marker = L.marker(route.start_coords, { icon: icon }).addTo(map);

      var popupContent =
        '<div>' +
        '<div class="popup-title">' +
        escapeHTML(route.name) +
        '</div>' +
        '<div class="popup-meta">' +
        (route.distance_km || '?') +
        ' km &middot; ' +
        (route.duration_hours || '?') +
        'h &middot; ' +
        (isPro ? 'Pro' : 'Aprendiz') +
        '</div>' +
        '<a class="popup-link" href="route.html?id=' +
        encodeURIComponent(route.id) +
        '">Veure detall &rarr;</a>' +
        '</div>';

      marker.bindPopup(popupContent);
    });
  }

  // --- Showcase Cards ---
  function renderShowcaseCards() {
    if (!showcaseGrid) return;

    if (SHOWCASE.length === 0) {
      showcaseGrid.innerHTML =
        '<div class="no-results">Les rutes destacades es carregaran aviat.</div>';
      return;
    }

    var html = '';
    SHOWCASE.forEach(function (route) {
      var isPro = route.category === 'Pro';
      var badgeClass = isPro ? 'badge-pro' : 'badge-aprendiz';
      var badgeText = isPro ? 'PRO' : 'APRENDIZ';
      var stars = renderStars(route.difficulty || 3);

      html +=
        '<a href="route.html?id=' +
        encodeURIComponent(route.id) +
        '" class="route-card">' +
        '<div class="route-card-header">' +
        '<span class="route-number">#' +
        escapeHTML(route.route_number || route.id) +
        '</span>' +
        '<span class="badge ' +
        badgeClass +
        '">' +
        badgeText +
        '</span>' +
        '</div>' +
        '<h3>' +
        escapeHTML(route.name) +
        '</h3>' +
        '<div class="route-card-difficulty">' +
        stars +
        '</div>' +
        '<div class="route-card-stats">' +
        '<span>' +
        (route.distance_km || '?') +
        ' km</span>' +
        '<span>' +
        (route.duration_hours || '?') +
        'h</span>' +
        '</div>' +
        '<div class="route-card-comarca">' +
        escapeHTML(route.comarca || '') +
        '</div>' +
        '<p class="route-card-summary">' +
        escapeHTML(route.summary || '') +
        '</p>' +
        '</a>';
    });

    showcaseGrid.innerHTML = html;
  }

  // --- Full Route Index ---
  function renderRouteIndex() {
    if (!indexGrid) return;

    var combinedRoutes = getCombinedRoutes();

    if (combinedRoutes.length === 0) {
      indexGrid.innerHTML =
        '<div class="no-results">Les 99 rutes es carregaran aviat.</div>';
      return;
    }

    var filteredRoutes = combinedRoutes.filter(function (route) {
      var matchesCategory =
        activeFilter === 'all' ||
        (activeFilter === 'pro' && route.category === 'Pro') ||
        (activeFilter === 'aprendiz' && route.category === 'Aprendiz');

      var matchesSearch =
        searchQuery === '' ||
        route.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        (route.comarca &&
          route.comarca.toLowerCase().indexOf(searchQuery.toLowerCase()) !==
            -1) ||
        (route.hub &&
          route.hub.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1);

      return matchesCategory && matchesSearch;
    });

    if (filteredRoutes.length === 0) {
      indexGrid.innerHTML =
        '<div class="no-results">Cap ruta trobada amb aquests filtres.</div>';
      return;
    }

    var html = '';
    filteredRoutes.forEach(function (route) {
      var isPro = route.category === 'Pro';
      var badgeClass = isPro ? 'badge-pro' : 'badge-aprendiz';
      var badgeText = isPro ? 'PRO' : 'APRENDIZ';
      var isShowcase = isShowcaseRoute(route.id);

      html +=
        '<div class="route-index-item" data-route-id="' +
        escapeHTML(route.id) +
        '" data-showcase="' +
        isShowcase +
        '" role="button" tabindex="0">' +
        '<span class="route-index-num">' +
        escapeHTML(String(route.route_number || route.id)) +
        '</span>' +
        '<div class="route-index-info">' +
        '<span class="route-index-name">' +
        escapeHTML(route.name) +
        '</span>' +
        '<div class="route-index-meta">' +
        '<span>' +
        (route.distance_km || '?') +
        ' km</span>' +
        '<span>' +
        (route.duration_hours || '?') +
        'h</span>' +
        (route.comarca
          ? '<span>' + escapeHTML(route.comarca) + '</span>'
          : '') +
        '</div>' +
        '</div>' +
        '<span class="route-index-meta-tablet">' +
        (route.hub || '') +
        '</span>' +
        '<span class="route-index-meta-tablet">' +
        (route.comarca || '') +
        '</span>' +
        '<span class="route-index-meta-tablet">' +
        renderStars(route.difficulty || 3) +
        '</span>' +
        '<span class="route-index-badge">' +
        '<span class="badge ' +
        badgeClass +
        '">' +
        badgeText +
        '</span>' +
        '</span>' +
        '</div>';
    });

    indexGrid.innerHTML = html;

    // Bind click events
    indexGrid.querySelectorAll('.route-index-item').forEach(function (item) {
      item.addEventListener('click', function () {
        handleRouteClick(this);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRouteClick(this);
        }
      });
    });
  }

  function handleRouteClick(el) {
    var routeId = el.getAttribute('data-route-id');
    var isShowcase = el.getAttribute('data-showcase') === 'true';

    if (isShowcase) {
      window.location.href = 'route.html?id=' + encodeURIComponent(routeId);
    } else {
      showComingSoonModal();
    }
  }

  function getCombinedRoutes() {
    // Build a map of all routes, with showcase data taking priority
    var routeMap = {};

    ROUTES.forEach(function (r) {
      routeMap[r.id] = r;
    });

    SHOWCASE.forEach(function (r) {
      routeMap[r.id] = Object.assign({}, routeMap[r.id] || {}, r);
    });

    var routes = Object.values(routeMap);

    // Sort by route number
    routes.sort(function (a, b) {
      var numA = parseInt(String(a.route_number || a.id).replace(/\D/g, ''), 10) || 0;
      var numB = parseInt(String(b.route_number || b.id).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return routes;
  }

  function isShowcaseRoute(id) {
    return SHOWCASE.some(function (r) {
      return r.id === id;
    });
  }

  // --- Filters ---
  function initFilters() {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        activeFilter = this.getAttribute('data-filter');
        renderRouteIndex();
      });
    });
  }

  // --- Search ---
  function initSearch() {
    if (!searchInput) return;

    var debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var val = this.value;
      debounceTimer = setTimeout(function () {
        searchQuery = val;
        renderRouteIndex();
      }, 250);
    });
  }

  // --- CTA Form ---
  function initCTAForm() {
    if (!ctaForm) return;

    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = this.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        alert("Si us plau, introdueix un email v\u00e0lid.");
        return;
      }

      // Redirect to Google Form with email pre-filled
      var formUrl = 'https://forms.gle/36HradBoo5TEvzqP7';
      window.open(formUrl, '_blank');

      // Show confirmation
      var btn = this.querySelector('button');
      var originalText = btn.textContent;
      btn.textContent = 'Gr\u00e0cies!';
      btn.disabled = true;
      emailInput.value = '';

      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 3000);
    });
  }

  // --- Modal ---
  function initModal() {
    if (!modalOverlay) return;

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', hideComingSoonModal);
    }

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) {
        hideComingSoonModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideComingSoonModal();
      }
    });
  }

  function showComingSoonModal() {
    if (modalOverlay) {
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideComingSoonModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Helpers ---
  function renderStars(difficulty) {
    var maxStars = 5;
    var d = Math.min(Math.max(parseInt(difficulty, 10) || 3, 1), 5);
    var stars = '';
    for (var i = 0; i < maxStars; i++) {
      if (i < d) {
        stars += '\u2605';
      } else {
        stars += '\u2606';
      }
    }
    return stars;
  }

  function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- Run ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
