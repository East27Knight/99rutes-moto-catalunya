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
    try { initNavigation(); } catch(e) { console.error('Nav error:', e); }
    try { initMap(); } catch(e) { console.error('Map error:', e); }
    try { renderShowcaseCards(); } catch(e) { console.error('Showcase error:', e); }
    try { renderRouteIndex(); } catch(e) { console.error('Index error:', e); }
    try { initFilters(); } catch(e) { console.error('Filter error:', e); }
    try { initSearch(); } catch(e) { console.error('Search error:', e); }
    try { initCTAForm(); } catch(e) { console.error('CTA error:', e); }
    try { initModal(); } catch(e) { console.error('Modal error:', e); }
    console.log('Init complete. SHOWCASE:', SHOWCASE.length, 'ROUTES:', ROUTES.length);
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

  function getCoords(route) {
    // Data uses starting_point: {lat, lng} — convert to [lat, lng] for Leaflet
    var sp = route.starting_point;
    if (sp && sp.lat && sp.lng) return [sp.lat, sp.lng];
    return null;
  }

  function addRouteMarkers() {
    if (!map) return;

    var allRoutes = ROUTES.length > 0 ? ROUTES : [];

    // Also add showcase routes if they have coordinates
    var showcaseIds = new Set();
    SHOWCASE.forEach(function (route) {
      var coords = getCoords(route);
      if (coords) {
        showcaseIds.add(route.id);
        var isPro = route.category === 'pro';
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

        var marker = L.marker(coords, { icon: icon }).addTo(map);

        var popupContent =
          '<div>' +
          '<div class="popup-title">' +
          escapeHTML(route.name) +
          '</div>' +
          '<div class="popup-meta">' +
          (route.total_distance_km || '?') +
          ' km &middot; ' +
          (route.estimated_duration_hours || '?') +
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
      var coords = getCoords(route);
      if (!coords) return;

      var isPro = route.category === 'pro';
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

      var marker = L.marker(coords, { icon: icon }).addTo(map);

      var popupContent =
        '<div>' +
        '<div class="popup-title">' +
        escapeHTML(route.name) +
        '</div>' +
        '<div class="popup-meta">' +
        (route.total_distance_km || '?') +
        ' km &middot; ' +
        (route.estimated_duration_hours || '?') +
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
  // Route images mapping (v=3 cache bust)
  var ROUTE_IMAGES = {
    'ruta-072': 'img/mountain.jpg?v=3',   // Pirineu - mountain
    'ruta-039': 'img/coast.jpg?v=3',      // Costa Brava - coast
    'ruta-001': 'img/mountain.jpg?v=3',   // Berguedà - mountain
    'ruta-085': 'img/volcanic.jpg?v=3',   // Siurana - dramatic landscape
    'ruta-041': 'img/volcanic.jpg?v=3',   // Garrotxa volcans
    'ruta-016': 'img/forest.jpg?v=3',     // Montseny - forest
    'ruta-011': 'img/rural.jpg?v=3',      // Montserrat - rural
    'ruta-049': 'img/coast.jpg?v=3',      // Empordanet - coast
    'ruta-083': 'img/rural.jpg?v=3',      // Balaguer - rural
    'ruta-070': 'img/vineyard.jpg?v=3'    // Vinyes - vineyard
  };
  var DEFAULT_IMAGES = ['img/mountain.jpg?v=3', 'img/coast.jpg?v=3', 'img/forest.jpg?v=3', 'img/rural.jpg?v=3', 'img/volcanic.jpg?v=3', 'img/vineyard.jpg?v=3'];

  function getRouteImage(routeId, index) {
    return ROUTE_IMAGES[routeId] || DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
  }

  function renderShowcaseCards() {
    if (!showcaseGrid) return;

    if (SHOWCASE.length === 0) {
      showcaseGrid.innerHTML =
        '<div class="no-results">Les rutes destacades es carregaran aviat.</div>';
      return;
    }

    var html = '';
    SHOWCASE.forEach(function (route, index) {
      var isPro = route.category === 'pro';
      var badgeClass = isPro ? 'badge-pro' : 'badge-aprendiz';
      var badgeText = isPro ? 'PRO' : 'APRENDIZ';
      var stars = renderStars(route.difficulty || 3);
      var imgSrc = getRouteImage(route.id, index);

      html +=
        '<a href="route.html?id=' +
        encodeURIComponent(route.id) +
        '" class="route-card">' +
        '<div class="route-card-img" style="background-image:url(\'' + imgSrc + '\')"></div>' +
        '<div class="route-card-body">' +
        '<div class="route-card-header">' +
        '<span class="route-number">#' +
        escapeHTML(String(route.number || route.id)) +
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
        (route.total_distance_km || '?') +
        ' km</span>' +
        '<span>' +
        (route.estimated_duration_hours || '?') +
        'h</span>' +
        '</div>' +
        '<div class="route-card-comarca">' +
        escapeHTML(route.comarca_principal || '') +
        '</div>' +
        '<p class="route-card-summary">' +
        escapeHTML(route.summary || '') +
        '</p>' +
        '</div>' +
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
        (activeFilter === 'pro' && route.category === 'pro') ||
        (activeFilter === 'aprendiz' && route.category === 'aprendiz');

      var matchesSearch =
        searchQuery === '' ||
        route.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        (route.comarca_principal &&
          route.comarca_principal.toLowerCase().indexOf(searchQuery.toLowerCase()) !==
            -1) ||
        (route.starting_hub &&
          route.starting_hub.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1);

      return matchesCategory && matchesSearch;
    });

    if (filteredRoutes.length === 0) {
      indexGrid.innerHTML =
        '<div class="no-results">Cap ruta trobada amb aquests filtres.</div>';
      return;
    }

    var html = '';
    filteredRoutes.forEach(function (route) {
      var isPro = route.category === 'pro';
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
        escapeHTML(String(route.number || route.id)) +
        '</span>' +
        '<div class="route-index-info">' +
        '<span class="route-index-name">' +
        escapeHTML(route.name) +
        '</span>' +
        '<div class="route-index-meta">' +
        '<span>' +
        (route.total_distance_km || '?') +
        ' km</span>' +
        '<span>' +
        (route.estimated_duration_hours || '?') +
        'h</span>' +
        (route.comarca_principal
          ? '<span>' + escapeHTML(route.comarca_principal) + '</span>'
          : '') +
        '</div>' +
        '</div>' +
        '<span class="route-index-meta-tablet">' +
        (route.starting_hub || '') +
        '</span>' +
        '<span class="route-index-meta-tablet">' +
        (route.comarca_principal || '') +
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
      var numA = parseInt(String(a.number || a.id).replace(/\D/g, ''), 10) || 0;
      var numB = parseInt(String(b.number || b.id).replace(/\D/g, ''), 10) || 0;
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

      // Submit email via FormSubmit.co (sends to inbox + dashboard)
      var btn = this.querySelector('button');
      var originalText = btn.textContent;
      btn.textContent = 'Enviant...';
      btn.disabled = true;

      fetch('https://formsubmit.co/ajax/estebangcr@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          _subject: '99 Rutes - Nou registre!',
          _template: 'table'
        })
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        if (data.success) {
          btn.textContent = 'Registrat! \u2714';
        } else {
          btn.textContent = 'Gr\u00e0cies! \u2714';
        }
        emailInput.value = '';
        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 4000);
      }).catch(function () {
        btn.textContent = 'Error. Torna-ho a provar.';
        btn.disabled = false;
        setTimeout(function () {
          btn.textContent = originalText;
        }, 3000);
      });
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
