/* ============================================
   99 Rutes en Moto per Catalunya
   Route Detail Page JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Data References ---
  var ROUTES = window.ROUTES_DATA || [];
  var SHOWCASE = window.SHOWCASE_DATA || [];

  // --- DOM References ---
  var detailContainer = document.getElementById('route-detail');
  var comingSoonContainer = document.getElementById('route-coming-soon');

  // --- Initialization ---
  function init() {
    var routeId = getRouteIdFromURL();

    if (!routeId) {
      showError('No s\'ha especificat cap ruta.');
      return;
    }

    var route = findRoute(routeId);

    if (!route) {
      showError('Ruta no trobada.');
      return;
    }

    var isShowcase = isShowcaseRoute(routeId);

    if (isShowcase) {
      renderRouteDetail(route);
    } else {
      renderComingSoon(route);
    }
  }

  // --- URL Parsing ---
  function getRouteIdFromURL() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // --- Route Lookup ---
  function findRoute(id) {
    // Check showcase first (has more detail)
    var showcaseRoute = SHOWCASE.find(function (r) {
      return r.id === id;
    });
    if (showcaseRoute) return showcaseRoute;

    // Fallback to routes data
    var basicRoute = ROUTES.find(function (r) {
      return r.id === id;
    });
    return basicRoute || null;
  }

  function isShowcaseRoute(id) {
    return SHOWCASE.some(function (r) {
      return r.id === id;
    });
  }

  // --- Render Full Detail ---
  function renderRouteDetail(route) {
    if (!detailContainer) return;

    document.title = route.name + ' | 99 Rutes en Moto per Catalunya';

    var isPro = route.category === 'Pro';
    var badgeClass = isPro ? 'badge-pro' : 'badge-aprendiz';
    var badgeText = isPro ? 'PRO' : 'APRENDIZ';
    var stars = renderStars(route.difficulty || 3);

    var html = '';

    // --- Hero Section ---
    html += '<section class="detail-hero">';
    html += '<div class="container">';
    html +=
      '<a href="index.html#rutes" class="back-link">&larr; Tornar a totes les rutes</a>';
    html +=
      '<h1 class="detail-title">' + escapeHTML(route.name) + '</h1>';
    html += '<div class="detail-badges">';
    html +=
      '<span class="badge ' +
      badgeClass +
      '">' +
      badgeText +
      '</span>';
    html +=
      '<span class="detail-difficulty">' + stars + '</span>';
    html += '</div>';

    // Stats bar
    html += '<div class="stats-bar">';
    html += renderStatItem(
      route.distance_km ? route.distance_km + ' km' : '---',
      'Dist\u00e0ncia'
    );
    html += renderStatItem(
      route.duration_hours ? route.duration_hours + 'h' : '---',
      'Durada'
    );
    html += renderStatItem(
      route.elevation_gain ? route.elevation_gain + ' m' : '---',
      'Desnivell'
    );
    html += renderStatItem(
      route.max_altitude ? route.max_altitude + ' m' : '---',
      'Altitud m\u00e0x.'
    );
    html += '</div>'; // stats-bar

    html += '</div>'; // container
    html += '</section>'; // detail-hero

    // --- Map Section ---
    html += '<section class="section map-section">';
    html += '<div class="container">';
    html +=
      '<h2 class="section-title">Mapa de la ruta</h2>';
    html +=
      '<div class="section-subtitle">Traçat complet amb punt d\'esmorzar</div>';
    html += '<div id="route-detail-map"></div>';
    html += '</div>';
    html += '</section>';

    // --- Roads Section ---
    if (route.roads && route.roads.length > 0) {
      html += '<section class="section roads-section">';
      html += '<div class="container">';
      html += '<h2 class="section-title">Carreteres</h2>';
      html +=
        '<div class="section-subtitle">Detall de cada tram de la ruta</div>';
      html += '<div style="overflow-x:auto;">';
      html += '<table class="roads-table">';
      html += '<thead><tr>';
      html += '<th>Carretera</th>';
      html += '<th>Tram</th>';
      html += '<th>Dist\u00e0ncia</th>';
      html += '<th>Tipus</th>';
      html += '<th>Destacat</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      route.roads.forEach(function (road) {
        html += '<tr>';
        html +=
          '<td class="road-highlight">' +
          escapeHTML(road.name || road.road || '') +
          '</td>';
        html +=
          '<td>' + escapeHTML(road.segment || road.from_to || '') + '</td>';
        html +=
          '<td>' + (road.distance_km ? road.distance_km + ' km' : '---') + '</td>';
        html += '<td>' + escapeHTML(road.type || road.surface || '') + '</td>';
        html +=
          '<td>' + escapeHTML(road.highlight || road.notes || '') + '</td>';
        html += '</tr>';
      });

      html += '</tbody>';
      html += '</table>';
      html += '</div>';
      html += '</div>';
      html += '</section>';
    }

    // --- Esmorzar Section ---
    if (route.esmorzar) {
      html += '<section class="section" style="background:var(--bg-primary);">';
      html += '<div class="container">';
      html +=
        '<h2 class="section-title">Esmorzar de forquilla</h2>';
      html +=
        '<div class="section-subtitle">La parada imprescindible de la ruta</div>';
      html += '<div class="esmorzar-box">';
      html += '<div class="esmorzar-icon">&#127860;</div>';
      html += '<h3>Parada d\'esmorzar</h3>';
      html +=
        '<div class="esmorzar-place">' +
        escapeHTML(route.esmorzar.name || route.esmorzar.place || '') +
        '</div>';
      if (route.esmorzar.location) {
        html +=
          '<p><strong>Ubicaci\u00f3:</strong> ' +
          escapeHTML(route.esmorzar.location) +
          '</p>';
      }
      if (route.esmorzar.description) {
        html += '<p>' + escapeHTML(route.esmorzar.description) + '</p>';
      }
      if (route.esmorzar.specialty) {
        html +=
          '<span class="esmorzar-specialty">Especialitat: ' +
          escapeHTML(route.esmorzar.specialty) +
          '</span>';
      }
      html += '</div>';
      html += '</div>';
      html += '</section>';
    }

    // --- Best Season ---
    if (route.best_seasons && route.best_seasons.length > 0) {
      html += '<section class="section" style="background:var(--bg-secondary);">';
      html += '<div class="container">';
      html += '<h2 class="section-title">Millor \u00e8poca</h2>';
      html +=
        '<div class="section-subtitle">Quan fer aquesta ruta per gaudir-ne al m\u00e0xim</div>';
      html += '<div class="season-badges" style="justify-content:center;">';

      var allSeasons = [
        'Primavera',
        'Estiu',
        'Tardor',
        'Hivern',
      ];
      allSeasons.forEach(function (season) {
        var isRecommended = route.best_seasons.indexOf(season) !== -1;
        html +=
          '<span class="season-badge' +
          (isRecommended ? ' recommended' : '') +
          '">' +
          escapeHTML(season) +
          '</span>';
      });

      html += '</div>';
      html += '</div>';
      html += '</section>';
    }

    // --- Warnings ---
    if (route.warnings && route.warnings.length > 0) {
      html += '<section class="section warnings-section">';
      html += '<div class="container">';
      html += '<h2 class="section-title">Avisos</h2>';
      html +=
        '<div class="section-subtitle">Informaci\u00f3 important per a la ruta</div>';

      route.warnings.forEach(function (warning) {
        html += '<div class="warning-item">';
        html += '<span class="warning-icon">&#9888;</span>';
        html +=
          '<span class="warning-text">' +
          escapeHTML(typeof warning === 'string' ? warning : warning.text || '') +
          '</span>';
        html += '</div>';
      });

      html += '</div>';
      html += '</section>';
    }

    // --- Google Maps Button ---
    html += '<section class="section" style="background:var(--bg-primary);text-align:center;">';
    html += '<div class="container">';
    if (route.google_maps_url) {
      html +=
        '<a href="' +
        escapeHTML(route.google_maps_url) +
        '" target="_blank" rel="noopener" class="gmaps-btn">';
      html += '&#128506; Obre a Google Maps';
      html += '</a>';
    }
    html += '<div style="margin-top:2rem;">';
    html +=
      '<a href="index.html#rutes" class="back-link">&larr; Tornar a totes les rutes</a>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    detailContainer.innerHTML = html;
    detailContainer.style.display = 'block';
    if (comingSoonContainer) comingSoonContainer.style.display = 'none';

    // Initialize the map after rendering
    setTimeout(function () {
      initRouteMap(route);
    }, 100);
  }

  // --- Render Coming Soon ---
  function renderComingSoon(route) {
    if (!comingSoonContainer) return;

    var html = '';
    html += '<div class="coming-soon-overlay">';
    html += '<div class="container">';
    html +=
      '<a href="index.html#rutes" class="back-link">&larr; Tornar a totes les rutes</a>';
    html += '<h2>' + escapeHTML(route.name) + '</h2>';
    html +=
      '<p>Aquesta ruta estar\u00e0 disponible aviat amb tota la informaci\u00f3 completa: mapa interactiu, coordenades GPS, carreteres detallades i recomanaci\u00f3 d\'esmorzar.</p>';
    html +=
      '<a href="index.html#cta" class="btn btn-primary">Vull rebre la guia completa</a>';
    html += '</div>';
    html += '</div>';

    comingSoonContainer.innerHTML = html;
    comingSoonContainer.style.display = 'block';
    if (detailContainer) detailContainer.style.display = 'none';
  }

  // --- Route Map ---
  function initRouteMap(route) {
    var mapEl = document.getElementById('route-detail-map');
    if (!mapEl || typeof L === 'undefined') return;

    var map = L.map('route-detail-map').setView([41.7, 1.8], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    var bounds = [];

    // Draw waypoints
    if (route.waypoints && route.waypoints.length > 0) {
      var latlngs = [];

      route.waypoints.forEach(function (wp, idx) {
        if (!wp.coords) return;
        var coords = wp.coords;
        latlngs.push(coords);
        bounds.push(coords);

        var isEsmorzar = wp.type === 'esmorzar' || wp.is_esmorzar;
        var isStart = idx === 0;
        var isEnd = idx === route.waypoints.length - 1;

        var markerColor = isEsmorzar
          ? '#f5a623'
          : isStart
          ? '#53c28b'
          : isEnd
          ? '#e94560'
          : '#4a90d9';

        var markerSize = isEsmorzar ? 16 : isStart || isEnd ? 14 : 10;

        var icon = L.divIcon({
          className: 'custom-marker',
          html:
            '<div style="width:' +
            markerSize +
            'px;height:' +
            markerSize +
            'px;border-radius:50%;background:' +
            markerColor +
            ';border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);' +
            (isEsmorzar ? 'z-index:999;' : '') +
            '"></div>',
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        var marker = L.marker(coords, { icon: icon }).addTo(map);

        var label = wp.name || (isStart ? 'Sortida' : isEnd ? 'Arribada' : 'Punt ' + (idx + 1));
        if (isEsmorzar) label = '&#127860; ' + (wp.name || 'Esmorzar');

        marker.bindPopup(
          '<div class="popup-title">' + label + '</div>' +
          (wp.description ? '<div class="popup-meta">' + escapeHTML(wp.description) + '</div>' : '')
        );
      });

      // Draw polyline
      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color: '#e94560',
          weight: 3,
          opacity: 0.8,
          dashArray: '8, 6',
        }).addTo(map);
      }
    } else if (route.start_coords) {
      // Fallback: just show start point
      bounds.push(route.start_coords);

      var icon = L.divIcon({
        className: 'custom-marker',
        html:
          '<div style="width:14px;height:14px;border-radius:50%;background:#53c28b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker(route.start_coords, { icon: icon })
        .addTo(map)
        .bindPopup('<div class="popup-title">Punt de sortida</div>');

      if (route.end_coords) {
        bounds.push(route.end_coords);
        var endIcon = L.divIcon({
          className: 'custom-marker',
          html:
            '<div style="width:14px;height:14px;border-radius:50%;background:#e94560;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(route.end_coords, { icon: endIcon })
          .addTo(map)
          .bindPopup('<div class="popup-title">Punt d\'arribada</div>');
      }
    }

    // Fit map to bounds
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    }
  }

  // --- Error State ---
  function showError(message) {
    if (detailContainer) {
      detailContainer.innerHTML =
        '<section class="section" style="text-align:center;padding-top:8rem;">' +
        '<div class="container">' +
        '<h2>' +
        escapeHTML(message) +
        '</h2>' +
        '<p style="color:var(--text-secondary);margin-top:1rem;">' +
        'Comprova la URL o torna a la llista de rutes.' +
        '</p>' +
        '<a href="index.html" class="btn btn-primary" style="margin-top:2rem;">Anar a l\'inici</a>' +
        '</div>' +
        '</section>';
      detailContainer.style.display = 'block';
    }
  }

  // --- Helpers ---
  function renderStatItem(value, label) {
    return (
      '<div class="stat-item">' +
      '<div class="stat-value">' +
      escapeHTML(value) +
      '</div>' +
      '<div class="stat-label">' +
      escapeHTML(label) +
      '</div>' +
      '</div>'
    );
  }

  function renderStars(difficulty) {
    var maxStars = 5;
    var d = Math.min(Math.max(parseInt(difficulty, 10) || 3, 1), 5);
    var stars = '';
    for (var i = 0; i < maxStars; i++) {
      stars += i < d ? '\u2605' : '\u2606';
    }
    return stars;
  }

  function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Run ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
