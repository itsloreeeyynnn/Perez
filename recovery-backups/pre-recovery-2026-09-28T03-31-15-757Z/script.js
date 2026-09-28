(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Suggested visit lengths are planning ideas, not verified tour durations.
  // Attraction fees are not available in the current guide.
  const destinationDetails = {
    'perez-beach': {
      description: 'Make time for a relaxed coastal stop at Perez Beach. Enjoy the shoreline and plan any swimming around local advice and the conditions on the day.',
      activity: 'Beach walk and coastal relaxation',
      duration: 'Suggested: 1–2 hours',
    },
    'alabat-mangroves': {
      description: 'Explore the island’s coastal environment with a focus on its mangroves and marine biodiversity. Ask locally about accessible viewing areas and avoid disturbing plants or wildlife.',
      activity: 'Nature observation and photography',
      duration: 'Suggested: 1 hour',
    },
    'san-antonio': {
      description: 'Include a quiet visit to San Antonio de Padua Parish Church in your Perez itinerary. Respect worshippers and check locally for visitor access before planning your stop.',
      activity: 'A respectful church visit',
      duration: 'Suggested: 30–60 minutes',
    },
    'fish-sanctuaries': {
      description: 'Learn about Perez’s marine environment and its fish sanctuaries. Confirm permitted activities, access, and suitable sea conditions locally before arranging a visit.',
      activity: 'Marine-life appreciation',
      duration: 'Suggested: 1–2 hours',
    },
  };

  // Leave these null until each attraction's coordinates are verified.
  // Names, categories, and short descriptions come from the existing cards.
  const destinationLocations = [
    { id: 'perez-beach', lat: null, lng: null },
    { id: 'alabat-mangroves', lat: null, lng: null },
    { id: 'san-antonio', lat: null, lng: null },
    { id: 'fish-sanctuaries', lat: null, lng: null },
  ].map((destination) => {
    const card = document.querySelector(`[data-destination="${destination.id}"]`);
    return {
      ...destination,
      name: card?.querySelector('.destination-title')?.textContent.trim() || '',
      category: card?.querySelector('.destination-category')?.textContent.trim() || '',
      shortDescription: card?.querySelector('.destination-text')?.textContent.trim() || '',
    };
  });
  const destinationCardActions = new Map();

  // Planning suggestions only; there are no verified experience-specific fees.
  const experiences = [
    {
      id: 'pristine-beaches',
      description: 'Enjoy a relaxed beach walk and time by the coast. Ask locally about access and suitable conditions before swimming.',
      suggestedDuration: '1–2 hours', suggestedTime: 'Morning or late afternoon',
    },
    {
      id: 'coastal-nature',
      description: 'Take time to observe the coastal landscape and mangroves. Stay in accessible areas and avoid disturbing plants or wildlife.',
      suggestedDuration: 'About 1 hour', suggestedTime: 'Daylight hours',
    },
    {
      id: 'local-cuisine',
      description: 'Leave time in your visit for a local meal. Ask about available dishes and prices, and mention any dietary needs before ordering.',
      suggestedDuration: 'About 1 hour', suggestedTime: 'Lunch or dinner',
    },
    {
      id: 'culture-festival',
      description: 'Explore local culture and use the existing Events listing for ideas. Confirm current event dates and arrangements locally before planning attendance.',
      suggestedDuration: 'Set aside 1–2 hours', suggestedTime: 'Depends on the confirmed event program',
    },
    {
      id: 'ecotourism',
      description: 'Make responsible nature appreciation part of your visit. Ask about permitted activities and local environmental guidelines before visiting coastal or marine areas.',
      suggestedDuration: '1–2 hours', suggestedTime: 'Daylight hours, subject to local conditions',
    },
  ].map((experience) => {
    const card = document.querySelector(`[data-experience="${experience.id}"]`);
    return {
      ...experience,
      title: card?.querySelector('.experience-name span')?.textContent.trim() || '',
      image: card?.querySelector('img')?.getAttribute('src') || 'placeholder.svg',
      estimatedCost: null,
    };
  });

  function initHero() {
    const hero = document.querySelector('.hero');
    const main = document.querySelector('.main-content');
    if (!hero || !main) return;
    hero.classList.add('hero-observed');
    let observer;

    function observeHero() {
      observer?.disconnect();
      if (reducedMotion.matches) hero.classList.remove('hero-animated');
      if (!('IntersectionObserver' in window)) {
        hero.classList.add('hero-visible');
        hero.classList.toggle('hero-animated', !reducedMotion.matches);
        return;
      }

      // Normally reveal at 50% of the hero. On short screens, use half of
      // the available scroll viewport so the threshold is still reachable.
      const revealThreshold = Math.min(0.5, main.clientHeight / hero.offsetHeight * 0.5);
      observer = new IntersectionObserver(([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        hero.classList.toggle('hero-visible', visible);

        // Reset only when fully offscreen, not when crossing the reveal
        // threshold again. This prevents repeated starts near the boundary.
        if (!visible || reducedMotion.matches) {
          hero.classList.remove('hero-animated');
        } else if (entry.intersectionRatio >= revealThreshold) {
          hero.classList.add('hero-animated');
        }
      }, { root: main, threshold: [0, revealThreshold] });
      observer.observe(hero);
    }

    observeHero();
    reducedMotion.addEventListener('change', observeHero);
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(observeHero);
      resizeObserver.observe(main);
      resizeObserver.observe(hero);
    }
  }

  function initSmoothScrolling() {
    const main = document.querySelector('.main-content');
    if (!main) return;

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.getElementById(hash.slice(1));
      if (!target || !main.contains(target)) return;
      event.preventDefault();

      const scrollToTarget = () => {
        // Move only the page's existing scroll container, never the body.
        main.scrollTo({
          top: main.scrollTop + target.getBoundingClientRect().top - main.getBoundingClientRect().top,
          behavior: reducedMotion.matches ? 'instant' : 'smooth',
        });
      };
      const expandedNavbar = document.querySelector('.navbar-collapse.show');
      if (expandedNavbar && window.bootstrap?.Collapse) {
        // Wait for the header to settle so the anchor is aligned on mobile.
        expandedNavbar.addEventListener('hidden.bs.collapse', scrollToTarget, { once: true });
        window.bootstrap.Collapse.getOrCreateInstance(expandedNavbar).hide();
      } else {
        scrollToTarget();
      }
    });
  }

  function initActiveNavigation() {
    const main = document.querySelector('.main-content');
    const navbar = document.querySelector('.main-navbar');
    if (!main || !navbar || !('IntersectionObserver' in window)) return;
    const links = [...navbar.querySelectorAll('.nav-link[href^="#"], .btn-trip[href^="#"]')];
    const blocks = new Map();

    function track(element, hash) {
      const link = links.find((item) => item.getAttribute('href') === hash);
      if (element && link && main.contains(element)) blocks.set(element, link);
    }

    links.forEach((link) => {
      const hash = link.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (hash === '#travel') {
        // Events live inside Travel, so observe the travel cards and budget
        // separately instead of letting the enclosing section mask Events.
        track(target?.querySelector('.travel-card')?.closest('.row'), hash);
        track(target?.querySelector('.travel-budget'), hash);
      } else if (hash === '#events') {
        track(target?.closest('.row'), hash);
      } else {
        track(target, hash);
      }
    });
    track(document.getElementById('quick-navigation'), '#home');
    track(document.getElementById('map'), '#destinations');
    if (!blocks.size) return;

    let currentLink = links.find((link) => link.classList.contains('active'));
    let observer;
    const visibleBlocks = new Set();

    function observeSections() {
      observer?.disconnect();
      visibleBlocks.clear();
      // A band from 20% to 35% down the actual scrolling viewport.
      // Pixel margins also behave correctly on narrow mobile viewports.
      const bandTop = Math.round(main.clientHeight * 0.2);
      const bottomInset = Math.round(main.clientHeight * 0.65);
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleBlocks.add(entry.target);
          else visibleBlocks.delete(entry.target);
        });
        // Keep the current item until its content fully leaves the band.
        // The band provides a buffer in both directions, avoiding jitter.
        if ([...visibleBlocks].some((block) => blocks.get(block) === currentLink)) return;
        if (!visibleBlocks.size) return;

        const mainTop = main.getBoundingClientRect().top;
        const top = mainTop + bandTop;
        const bottom = mainTop + main.clientHeight - bottomInset;
        const overlap = (block) => {
          const rect = block.getBoundingClientRect();
          return Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
        };
        const nextBlock = [...visibleBlocks].sort((a, b) => overlap(b) - overlap(a))[0];
        currentLink = blocks.get(nextBlock);
        links.forEach((link) => {
          const active = link === currentLink;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, {
        root: main,
        rootMargin: `-${bandTop}px 0px -${bottomInset}px 0px`,
        threshold: 0,
      });
      blocks.forEach((link, block) => observer.observe(block));
    }

    observeSections();
    if ('ResizeObserver' in window) {
      new ResizeObserver(observeSections).observe(main);
    }
  }

  function initDestinationFilters() {
    const section = document.getElementById('destinations');
    if (!section) return;
    const buttons = [...section.querySelectorAll('[data-filter]')];
    const cards = [...section.querySelectorAll('[data-category]')];
    const status = document.getElementById('destination-filter-status');
    if (!buttons.length || !cards.length) return;
    let hideTimer;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        clearTimeout(hideTimer);
        const filter = button.dataset.filter;
        const matches = (card) => filter === 'all' || card.dataset.category === filter;
        buttons.forEach((other) => {
          other.classList.toggle('active', other === button);
          other.setAttribute('aria-pressed', String(other === button));
        });
        cards.forEach((card) => {
          const column = card.parentElement;
          const show = matches(card);
          column.classList.add('destination-column');
          column.classList.toggle('is-filtering-out', !show);
          column.inert = !show;
          if (show) {
            const wasHidden = column.hidden;
            column.hidden = false;
            column.classList.toggle('is-filtering-in', wasHidden);
          } else {
            column.classList.remove('is-filtering-in');
          }
        });
        const finish = () => {
          cards.forEach((card) => { card.parentElement.hidden = !matches(card); });
          if (status) status.textContent = `${cards.filter(matches).length} destinations shown: ${button.textContent.trim()}.`;
        };
        if (reducedMotion.matches) finish();
        else hideTimer = setTimeout(finish, 150);
      });
    });
  }

  function initDestinationCards() {
    document.querySelectorAll('[data-destination]').forEach((card) => {
      const details = destinationDetails[card.dataset.destination];
      const learnMore = card.querySelector('.learn-more');
      const name = card.querySelector('.destination-title')?.textContent.trim();
      if (!details || !learnMore || !name) return;

      const flipper = document.createElement('div');
      flipper.className = 'destination-flipper';
      const front = document.createElement('div');
      front.className = 'destination-face destination-front';
      front.append(...card.childNodes);
      const back = document.createElement('div');
      back.className = 'destination-face destination-back';
      back.id = `${card.dataset.destination}-details`;
      back.inert = true;
      back.setAttribute('aria-hidden', 'true');

      // Only fixed project copy is used here; the existing name is set as text.
      back.innerHTML = `
        <h3 class="destination-title" tabindex="-1"></h3>
        <p class="destination-text">${details.description}</p>
        <dl class="destination-details">
          <dt>Recommended activity</dt><dd>${details.activity}</dd>
          <dt>Recommended duration</dt><dd>${details.duration}</dd>
          <dt>Estimated cost</dt><dd>Not verified; confirm locally.</dd>
        </dl>
        <div class="destination-back-actions">
          <button class="btn btn-gold btn-sm" type="button" disabled aria-describedby="${back.id}-note">Add to Itinerary</button>
          <p class="destination-placeholder-note" id="${back.id}-note">Itinerary planning is coming in a later phase.</p>
          <button class="learn-more destination-back-button" type="button"><i class="bi bi-arrow-left" aria-hidden="true"></i> Back</button>
        </div>`;
      const backTitle = back.querySelector('h3');
      backTitle.textContent = name;
      flipper.append(front, back);
      card.append(flipper);
      card.classList.add('flip-card');
      learnMore.setAttribute('aria-controls', back.id);
      learnMore.setAttribute('aria-expanded', 'false');
      learnMore.setAttribute('aria-label', `Learn more about ${name}`);
      const backButton = back.querySelector('.destination-back-button');
      backButton.setAttribute('aria-label', `Back to ${name}`);

      function flip(showDetails) {
        card.classList.toggle('is-flipped', showDetails);
        learnMore.setAttribute('aria-expanded', String(showDetails));
        const visible = showDetails ? back : front;
        const hidden = showDetails ? front : back;
        visible.inert = false;
        visible.removeAttribute('aria-hidden');
        (showDetails ? backTitle : learnMore).focus({ preventScroll: true });
        hidden.inert = true;
        hidden.setAttribute('aria-hidden', 'true');
      }
      destinationCardActions.set(card.dataset.destination, flip);
      learnMore.addEventListener('click', () => flip(true));
      backButton.addEventListener('click', () => flip(false));
      back.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          flip(false);
        }
      });
    });
  }

  function initPerezMap() {
    const container = document.getElementById('perez-map');
    const status = document.getElementById('map-status');
    const interact = document.getElementById('map-interact');
    const help = document.getElementById('map-help');
    if (!container) return;
    const unavailable = () => {
      container.textContent = 'The interactive map is unavailable. Please check your connection and reload to try again.';
      if (status) status.textContent = 'The rest of the travel guide is still available.';
      if (interact) interact.hidden = true;
    };
    if (!window.L) { unavailable(); return; }

    let map;
    try {
      container.replaceChildren();
      const touchScreen = window.matchMedia('(pointer: coarse)');
      // General municipal reference, not a tourist-attraction location.
      // Source: https://perezquezon.gov.ph/profile/ (14°11′ N, 121°57′ E).
      const municipality = [14 + 11 / 60, 121 + 57 / 60];
      map = window.L.map(container, {
        center: municipality, zoom: 12,
        dragging: !touchScreen.matches, touchZoom: !touchScreen.matches,
        scrollWheelZoom: !touchScreen.matches, doubleClickZoom: !touchScreen.matches,
        tapHold: false, inertia: !reducedMotion.matches,
        zoomAnimation: !reducedMotion.matches,
        fadeAnimation: !reducedMotion.matches,
        markerZoomAnimation: !reducedMotion.matches,
      });
      const tiles = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      let tileErrors = false;
      tiles.on('loading', () => { tileErrors = false; });
      tiles.on('tileerror', () => {
        tileErrors = true;
        if (status) status.textContent = 'Some map tiles could not load. Check your connection; pan or zoom to try loading tiles again.';
      });
      tiles.on('load', () => { if (status && !tileErrors) status.textContent = ''; });
      tiles.addTo(map);

      window.L.marker(municipality, { title: 'Perez municipality — general reference point', alt: 'Perez municipality marker' })
        .addTo(map)
        .bindPopup('<strong>Perez, Quezon</strong><br>Alabat Island, Quezon Province<p>Explore the municipality and its coastal attractions.</p>');

      destinationLocations.forEach((destination) => {
        if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) return;
        if (Math.abs(destination.lat) > 90 || Math.abs(destination.lng) > 180) return;
        const popup = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = destination.name;
        const category = document.createElement('p');
        category.textContent = destination.category;
        const description = document.createElement('p');
        description.textContent = destination.shortDescription;
        const view = document.createElement('a');
        view.href = '#destinations';
        view.textContent = 'View Destination';
        view.addEventListener('click', () => {
          document.querySelector('#destinations [data-filter="all"]')?.click();
          const card = document.querySelector(`[data-destination="${destination.id}"]`);
          if (!card) return;
          // Use the existing flip action and delegated smooth-scroll handler.
          destinationCardActions.get(destination.id)?.(true);
          card.classList.add('is-map-highlighted');
          setTimeout(() => card.classList.remove('is-map-highlighted'), 2200);
        });
        popup.append(name, category, description, view);
        window.L.marker([destination.lat, destination.lng], { title: destination.name })
          .addTo(map).bindPopup(popup);
      });

      function setTouchInteraction(enabled) {
        const active = !touchScreen.matches || enabled;
        [map.dragging, map.touchZoom, map.scrollWheelZoom, map.doubleClickZoom].forEach((handler) => {
          if (active) handler.enable();
          else handler.disable();
        });
        container.classList.toggle('map-touch-scroll', !active);
        if (interact) {
          interact.hidden = !touchScreen.matches;
          interact.setAttribute('aria-pressed', String(touchScreen.matches && enabled));
          interact.textContent = enabled ? 'Done exploring map' : 'Interact with map';
        }
        if (help) help.textContent = touchScreen.matches
          ? (enabled ? 'Drag to pan or pinch to zoom. Choose Done exploring map to resume page swipes here.' : 'Swipe to scroll the page. Tap Interact with map to pan and pinch to zoom.')
          : 'Drag to pan. Use the mouse wheel or + / - buttons to zoom.';
      }
      setTouchInteraction(false);
      interact?.addEventListener('click', () => setTouchInteraction(interact.getAttribute('aria-pressed') !== 'true'));
      touchScreen.addEventListener('change', () => setTouchInteraction(false));
      const resizeMap = () => map.invalidateSize({ pan: false, animate: false });
      requestAnimationFrame(resizeMap);
      if ('ResizeObserver' in window) new ResizeObserver(resizeMap).observe(container);
      // Leaflet also handles browser-window resizes by default.
    } catch {
      map?.remove();
      unavailable();
    }
  }

  function initExperienceCards() {
    experiences.forEach((experience) => {
      const card = document.querySelector(`[data-experience="${experience.id}"]`);
      if (!card) return;
      card.setAttribute('aria-label', `View experience: ${experience.title}`);
      if (!window.bootstrap?.Modal) {
        card.disabled = true;
        card.setAttribute('aria-label', `${experience.title} — details unavailable while offline`);
      }
    });
  }

  function initExperienceModal() {
    const modal = document.getElementById('experience-modal');
    if (!modal || !window.bootstrap?.Modal) return;
    modal.addEventListener('show.bs.modal', (event) => {
      const experience = experiences.find((item) => item.id === event.relatedTarget?.dataset.experience);
      if (!experience) { event.preventDefault(); return; }
      modal.querySelector('#experience-modal-title').textContent = experience.title;
      const image = modal.querySelector('#experience-modal-image');
      image.src = experience.image;
      image.alt = experience.title;
      modal.querySelector('#experience-description').textContent = experience.description;
      modal.querySelector('#experience-duration').textContent = experience.suggestedDuration;
      modal.querySelector('#experience-time').textContent = experience.suggestedTime;
      const cost = modal.querySelector('#experience-cost');
      cost.textContent = experience.estimatedCost || '';
      cost.hidden = experience.estimatedCost == null;
      modal.querySelector('#experience-cost-label').hidden = cost.hidden;
    });
  }

  function initExperienceReveal() {
    const main = document.querySelector('.main-content');
    const cards = [...document.querySelectorAll('[data-experience]')];
    if (!main || !cards.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target); // One reveal per visit, never boundary flicker.
      });
    }, { root: main, threshold: 0.15 });
    cards.forEach((card, index) => {
      const column = card.parentElement;
      column.classList.add('experience-reveal');
      column.style.setProperty('--reveal-delay', `${index % 3 * 80}ms`);
      observer.observe(column);
      card.addEventListener('focus', () => {
        column.classList.add('is-revealed');
        observer.unobserve(column);
      });
    });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      cards.forEach((card) => card.parentElement.classList.add('is-revealed'));
      observer.disconnect();
    });
  }

  function initTravelInfoCards() {
    const group = document.getElementById('travel-information-cards');
    if (!group) return;
    group.querySelectorAll('.travel-toggle').forEach((button) => {
      const details = document.getElementById(button.getAttribute('aria-controls'));
      if (!details) return;
      if (!window.bootstrap?.Collapse) {
        details.classList.add('show');
        button.hidden = true;
        return;
      }
      const label = button.querySelector('.travel-toggle-label');
      details.addEventListener('show.bs.collapse', () => { label.textContent = 'Hide Details'; });
      details.addEventListener('hide.bs.collapse', () => { label.textContent = 'View Details'; });
    });
  }

  function init() {
    initHero();
    initSmoothScrolling();
    initActiveNavigation();
    initDestinationFilters();
    initDestinationCards();
    initPerezMap();
    initExperienceCards();
    initExperienceModal();
    initExperienceReveal();
    initTravelInfoCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
