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
      if (hash === '#trip-planner') {
        // Events live inside Travel, so observe the travel cards and budget
        // separately instead of letting the enclosing section mask Events.
        track(document.getElementById('travel-information-cards'), hash);
        track(target, hash);
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
            destinationCardActions.get(card.dataset.destination)?.(false, false);
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
      const name = card.querySelector('.destination-title')?.textContent.trim();
      if (!details || !name) return;

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
      front.tabIndex = 0;
      front.setAttribute('role', 'button');
      front.setAttribute('aria-controls', back.id);
      front.setAttribute('aria-expanded', 'false');
      front.setAttribute('aria-label', `Explore ${name}`);
      const backButton = back.querySelector('.destination-back-button');
      backButton.setAttribute('aria-label', `Back to ${name}`);

      function flip(showDetails, moveFocus = true) {
        card.classList.toggle('is-flipped', showDetails);
        front.setAttribute('aria-expanded', String(showDetails));
        const visible = showDetails ? back : front;
        const hidden = showDetails ? front : back;
        visible.inert = false;
        visible.removeAttribute('aria-hidden');
        if (moveFocus) (showDetails ? backTitle : front).focus({ preventScroll: true });
        hidden.inert = true;
        hidden.setAttribute('aria-hidden', 'true');
      }
      destinationCardActions.set(card.dataset.destination, flip);
      front.addEventListener('click', (event) => {
        if (!event.target.closest('a, button, input, select, textarea')) flip(true);
      });
      front.addEventListener('keydown', (event) => {
        if (event.target === front && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          flip(true);
        }
      });
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

  // Supplied planning guidance and operator notices, not live services.
  const travelOrigins = {
    lucena: { name: 'Lucena City', stages: ['Lucena City', 'Land Transportation', 'Atimonan'] },
    manila: { name: 'Manila', stages: ['Manila', 'Travel toward Quezon Province', 'Atimonan'] },
    atimonan: { name: 'Atimonan', stages: ['Atimonan'] },
    gumaca: { name: 'Gumaca', stages: ['Gumaca', 'Land Transportation toward Atimonan', 'Atimonan'] },
    other: { name: 'Other', stages: [] },
  };
  const vesselSchedules = {
    'mb-capricorn': { name: 'MB Capricorn', route: 'Perez', departures: ['11:00 AM'] },
    'mv-nhelsea': { name: 'M/V Nhelsea 2', route: 'Alabat', departures: ['8:00 AM', '12:00 NN'] },
    'mv-viva-flos-carmeli': { name: 'MV Viva Flos Carmeli', route: 'Alabat', departures: ['9:00 AM', '5:00 PM'] },
    'mv-pinoy-roro': { name: 'MV Pinoy Roro 1', route: 'Alabat', departures: ['10:00 AM', '2:00 PM', '6:00 PM'] },
  };
  const vesselFares = {
    'mb-capricorn': { regular: 200, student: 175, seniorPwd: 160, child: 100, effectiveDate: 'September 23, 2026', temporary: false },
    'mv-nhelsea': { regular: 180, student: 140, seniorPwd: 140, child: 90, effectiveDate: 'September 27, 2026', temporary: true },
    'mv-viva-flos-carmeli': { regular: 180, student: 140, seniorPwd: 140, child: 90, effectiveDate: 'September 26, 2026', temporary: true },
    'mv-pinoy-roro': { regular: 150, student: 123.21, seniorPwd: 107.14, child: 75, source: 'Provided Jeanalyn Shipping passenger fare rollback notice' },
  };
  const routeOptions = { direct: 'Direct to Perez', 'via-alabat': 'Via Alabat' };
  const passengerLabels = { regular: 'Regular', student: 'Student', seniorPwd: 'Senior / PWD', child: 'Children' };
  const budgetDefaults = { otherTransportation: 500, localTransport: 150, meals: 350, accommodation: 800, activities: 300, miscellaneous: 300 };
  const plannerKey = 'perezTripPlannerV1';
  const otherRouteNotice = 'Exact routing from your location is not available in this planner. Atimonan Port is used as the reference gateway for the final journey toward Perez.';
  const defaultPlannerState = () => ({ origin: '', customOrigin: '', routeOption: '', transportMode: '', vessel: '', departureTime: '', passengers: { regular: 2, student: 0, seniorPwd: 0, child: 0 }, days: 2, budget: { ...budgetDefaults } });
  let plannerState = defaultPlannerState();
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const owns = (object, key) => typeof key === 'string' && Object.hasOwn(object, key);

  function plannerNumber(value, fallback, min, max, wholeMoney = false) {
    const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    if (!Number.isFinite(number)) return fallback;
    const bounded = Math.min(max, Math.max(min, number));
    return wholeMoney ? Math.round(bounded) : Math.trunc(bounded);
  }
  function normalizeJourney() {
    if (!owns(travelOrigins, plannerState.origin)) plannerState.origin = '';
    if (!plannerState.origin || !owns(routeOptions, plannerState.routeOption)) plannerState.routeOption = '';
    if (plannerState.routeOption === 'direct') {
      plannerState.transportMode = 'lantsa';
      plannerState.vessel = 'mb-capricorn';
      plannerState.departureTime = vesselSchedules['mb-capricorn'].departures[0];
    } else if (plannerState.routeOption === 'via-alabat') {
      const allowed = plannerState.transportMode === 'lantsa' ? ['mv-nhelsea', 'mv-viva-flos-carmeli'] : plannerState.transportMode === 'roro' ? ['mv-pinoy-roro'] : [];
      if (!allowed.includes(plannerState.vessel)) { plannerState.vessel = ''; plannerState.departureTime = ''; }
      else if (!vesselSchedules[plannerState.vessel].departures.includes(plannerState.departureTime)) plannerState.departureTime = '';
    } else {
      plannerState.transportMode = ''; plannerState.vessel = ''; plannerState.departureTime = '';
    }
  }
  function restorePlannerState() {
    try {
      const saved = JSON.parse(localStorage.getItem(plannerKey));
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
      const defaults = defaultPlannerState();
      plannerState = {
        origin: owns(travelOrigins, saved.origin) ? saved.origin : '',
        customOrigin: typeof saved.customOrigin === 'string' ? saved.customOrigin.slice(0, 120) : '',
        routeOption: owns(routeOptions, saved.routeOption) ? saved.routeOption : '',
        transportMode: ['lantsa', 'roro'].includes(saved.transportMode) ? saved.transportMode : '',
        vessel: owns(vesselSchedules, saved.vessel) ? saved.vessel : '',
        departureTime: typeof saved.departureTime === 'string' ? saved.departureTime : '',
        passengers: Object.fromEntries(Object.keys(passengerLabels).map(key => [key, plannerNumber(saved.passengers?.[key], defaults.passengers[key], 0, 10000)])),
        days: plannerNumber(saved.days, 2, 1, 7),
        budget: Object.fromEntries(Object.entries(budgetDefaults).map(([key, fallback]) => [key, plannerNumber(saved.budget?.[key], fallback, 0, 10000000, true)])),
      };
      normalizeJourney();
    } catch { /* Malformed or unavailable storage leaves safe defaults. */ }
  }
  function getTripDays() { return plannerState.days; }
  function getTravelerCount() { return Object.values(plannerState.passengers).reduce((sum, count) => sum + count, 0); }
  function getPlannerState() { return { ...plannerState, passengers: { ...plannerState.passengers }, budget: { ...plannerState.budget } }; }
  function savePlannerState() {
    const status = document.getElementById('planner-save-status');
    try {
      localStorage.setItem(plannerKey, JSON.stringify(getPlannerState()));
      if (status) status.textContent = 'Your trip is saved automatically on this browser.';
    } catch {
      if (status) status.textContent = 'Your estimate still works, but this browser cannot save it for your next visit.';
    }
  }
  // Shared duration for future itinerary work; no itinerary is built here.
  window.perezTripPlanner = Object.freeze({ getTripDays, getTravelerCount, getPlannerState });
  function vesselFareCents() {
    const fares = vesselFares[plannerState.vessel];
    if (!fares) return 0;
    // Integer centavos preserve supplied decimal fares exactly.
    return Object.entries(plannerState.passengers).reduce((sum, [key, count]) => sum + count * Math.round(fares[key] * 100), 0);
  }
  function journeyComplete() { return Boolean(plannerState.origin && plannerState.vessel && plannerState.departureTime); }

  function initTripPlanner() {
    const planner = document.getElementById('trip-planner');
    if (!planner) return;
    const byId = id => document.getElementById(id);
    const gettingThere = document.querySelector('#getting-there-details .travel-detail-content');
    const generalGettingThere = gettingThere?.cloneNode(true);
    const textElement = (tag, text, className = '') => {
      const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
    };
    const startName = () => plannerState.origin === 'other' ? plannerState.customOrigin.trim() || 'Other location' : travelOrigins[plannerState.origin]?.name || '';
    const fareNote = key => {
      const fare = vesselFares[key];
      return [fare.temporary ? 'Temporary fare adjustment.' : '', fare.effectiveDate ? 'Effective ' + fare.effectiveDate + '.' : fare.source, 'Confirm current fares and passenger eligibility with the operator.'].filter(Boolean).join(' ');
    };
    function fareDetails(key) {
      const details = document.createElement('details'); details.className = 'vessel-fare-details';
      details.append(textElement('summary', 'View fare details'));
      const list = document.createElement('dl'); list.className = 'planner-fare-list';
      Object.entries(passengerLabels).forEach(([category, label]) => {
        const row = document.createElement('div');
        row.append(textElement('dt', label), textElement('dd', currency.format(vesselFares[key][category]))); list.append(row);
      });
      details.append(list, textElement('p', fareNote(key), 'small text-secondary mb-0')); return details;
    }
    function buildVesselChoices() {
      Object.entries(vesselSchedules).forEach(([key, vessel]) => {
        const card = document.createElement('div');
        if (vessel.route === 'Perez') {
          card.className = 'planner-fare';
          card.append(textElement('h4', vessel.name, 'fs-5'), textElement('p', 'Provided Departure: ' + vessel.departures[0]), textElement('p', 'Regular from ' + currency.format(vesselFares[key].regular)), fareDetails(key));
          byId('planner-direct-vessel').append(card); return;
        }
        card.className = 'col-lg-4'; card.dataset.transportMode = key === 'mv-pinoy-roro' ? 'roro' : 'lantsa';
        const label = document.createElement('label'); label.className = 'journey-choice';
        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'vessel'; input.value = key; input.className = 'form-check-input';
        const copy = document.createElement('span');
        copy.append(textElement('strong', vessel.name), textElement('small', vessel.departures.join(' • ')), textElement('small', 'Regular from ' + currency.format(vesselFares[key].regular)));
        label.append(input, copy);
        // Details outside the label avoid selecting a vessel when expanding fares.
        card.append(label, fareDetails(key)); byId('planner-vessels').append(card);
      });
    }
    function makeTimeline(stages, label) {
      const timeline = document.createElement('ol'); timeline.className = 'planner-route'; timeline.setAttribute('aria-label', label);
      stages.forEach(stage => {
        const item = document.createElement('li'), icon = document.createElement('i');
        icon.className = 'bi bi-' + (stage.icon || 'geo-alt'); icon.setAttribute('aria-hidden', 'true');
        item.append(icon, textElement('strong', stage.name));
        if (stage.note) item.append(textElement('span', stage.note));
        timeline.append(item);
      }); return timeline;
    }
    function originStages() {
      const origin = travelOrigins[plannerState.origin];
      return [...origin.stages.map(name => ({ name, icon: /Transportation|Travel toward/.test(name) ? 'bus-front' : 'geo-alt' })), { name: 'Atimonan Port', icon: 'signpost-split' }];
    }
    let renderedDepartureVessel = null;
    function renderDepartures() {
      const key = plannerState.vessel;
      if (key !== renderedDepartureVessel) {
        const options = byId('departure-options'); options.replaceChildren();
        if (plannerState.routeOption === 'via-alabat' && key) vesselSchedules[key].departures.forEach((time, index) => {
          const input = document.createElement('input');
          input.type = 'radio'; input.name = 'departureTime'; input.value = time; input.className = 'btn-check'; input.id = 'departure-' + index;
          const label = textElement('label', time, 'btn btn-outline-secondary'); label.htmlFor = input.id; options.append(input, label);
        });
        renderedDepartureVessel = key;
      }
    }

    function renderJourney() {
      const hasOrigin = Boolean(plannerState.origin), viaAlabat = plannerState.routeOption === 'via-alabat';
      byId('custom-origin-field').hidden = plannerState.origin !== 'other';
      byId('planner-route-choices').hidden = !hasOrigin;
      byId('planner-alabat-choices').hidden = !hasOrigin || !viaAlabat;
      byId('planner-direct-vessel').hidden = plannerState.routeOption !== 'direct';
      byId('planner-departures').hidden = !viaAlabat || !plannerState.vessel;
      byId('planner-schedule-notice').hidden = !plannerState.routeOption;
      byId('alabat-fare-note').hidden = !viaAlabat;
      byId('planner-vessel-heading').hidden = !viaAlabat || !plannerState.transportMode;
      byId('planner-vessels').querySelectorAll('[data-transport-mode]').forEach(card => { card.hidden = !plannerState.transportMode || card.dataset.transportMode !== plannerState.transportMode; });
      renderDepartures();
      planner.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = plannerState[input.name] === input.value; });
      const route = byId('planner-route'), final = byId('planner-final-route'); route.replaceChildren(); final.replaceChildren();
      if (!hasOrigin) route.append(textElement('p', 'Choose your starting point to begin your journey.', 'text-secondary'));
      else {
        route.append(textElement('h4', 'Your route toward Atimonan Port', 'fs-5'));
        if (plannerState.origin === 'other') route.append(textElement('p', 'Starting from: ' + startName()), textElement('p', otherRouteNotice, 'small text-secondary'));
        route.append(makeTimeline(originStages(), 'General route to Atimonan Port'));
        if (journeyComplete()) {
          const vessel = vesselSchedules[plannerState.vessel];
          const seaMode = plannerState.routeOption === 'direct' ? 'Lantsa' : plannerState.transportMode === 'roro' ? 'RORO' : 'Lantsa';
          const stages = [...originStages(), { name: seaMode + ' · ' + vessel.name, icon: plannerState.transportMode === 'roro' ? 'truck-front' : 'water', note: plannerState.departureTime }];
          if (viaAlabat) stages.push({ name: 'Alabat' }, { name: 'Tricycle', icon: 'truck', note: 'Local transportation to Perez' });
          stages.push({ name: 'Perez' });
          final.append(textElement('h4', 'Your Journey · ' + routeOptions[plannerState.routeOption], 'fs-5'), makeTimeline(stages, 'Complete journey to Perez'), textElement('p', 'Vessel fare: ' + currency.format(vesselFareCents() / 100), 'fw-bold'), textElement('p', fareNote(plannerState.vessel), 'small text-secondary'));
        } else if (plannerState.routeOption) final.append(textElement('p', plannerState.vessel ? 'Choose a departure to complete your journey.' : 'Choose a vessel to continue your journey.', 'text-secondary'));
      }
      renderGettingThere();
    }
    function renderGettingThere() {
      if (!gettingThere) return;
      if (!plannerState.origin) {
        if (generalGettingThere) gettingThere.replaceChildren(...[...generalGettingThere.childNodes].map(node => node.cloneNode(true)));
        return;
      }
      const facts = document.createElement('dl'); facts.className = 'travel-tip-list';
      const rows = { From: startName(), Gateway: 'Atimonan Port' };
      if (!plannerState.routeOption) {
        rows['Next Step'] = 'Choose whether you will land in Perez or Alabat.';
      } else if (plannerState.routeOption === 'direct') {
        rows['Island Landing'] = 'Perez'; rows['Sea Transport'] = 'Lantsa'; rows['Vessel'] = 'MB Capricorn'; rows['Departure'] = '11:00 AM'; rows['Final Stop'] = 'Perez';
      } else {
        rows['Island Landing'] = 'Alabat';
        rows['Sea Transport'] = plannerState.transportMode ? (plannerState.transportMode === 'roro' ? 'RORO' : 'Lantsa') : 'Choose Lantsa or RORO';
        if (plannerState.vessel) rows['Vessel'] = vesselSchedules[plannerState.vessel].name;
        if (plannerState.departureTime) rows['Departure'] = plannerState.departureTime;
        rows['Final Connection'] = 'Tricycle from Alabat to Perez';
      }
      if (plannerState.vessel) rows['Vessel Fare'] = getTravelerCount() ? currency.format(vesselFareCents() / 100) : 'Add at least one traveler.';
      Object.entries(rows).forEach(([label, value]) => facts.append(textElement('dt', label), textElement('dd', value)));
      const routeStages = originStages();
      if (plannerState.routeOption === 'direct') routeStages.push({ name: 'Lantsa · MB Capricorn', icon: 'water', note: '11:00 AM' }, { name: 'Perez', icon: 'geo-alt' });
      else if (plannerState.routeOption === 'via-alabat') {
        if (plannerState.transportMode) routeStages.push({ name: plannerState.transportMode === 'roro' ? 'RORO' : 'Lantsa', icon: plannerState.transportMode === 'roro' ? 'truck-front' : 'water' });
        if (plannerState.vessel) routeStages.push({ name: vesselSchedules[plannerState.vessel].name, icon: 'water', note: plannerState.departureTime || 'Choose departure' });
        routeStages.push({ name: 'Alabat', icon: 'geo-alt' }, { name: 'Tricycle to Perez', icon: 'truck' }, { name: 'Perez', icon: 'geo-alt' });
      }
      gettingThere.replaceChildren(textElement('p', 'Your Route Based on Your Input', 'travel-detail-label'), makeTimeline(routeStages, 'Getting there based on your trip planner input'), facts, textElement('p', 'Schedules and fares may change. Confirm the latest operator or port advisory before traveling.', 'travel-detail-note'));
      if (plannerState.origin === 'other') gettingThere.append(textElement('p', otherRouteNotice, 'travel-detail-note'));
    }
    function renderBudget() {
      const days = getTripDays(), travelers = getTravelerCount(), nights = Math.max(days - 1, 0), budget = plannerState.budget;
      const costs = {
        vesselFare: vesselFareCents(), otherTransportation: budget.otherTransportation * 100,
        localTransport: budget.localTransport * days * 100, meals: budget.meals * travelers * days * 100,
        accommodation: budget.accommodation * nights * 100, activities: budget.activities * 100, miscellaneous: budget.miscellaneous * 100,
      };
      const duration = days + (days === 1 ? ' day' : ' days') + ' • ' + nights + (nights === 1 ? ' night' : ' nights');
      byId('planner-duration').textContent = duration; byId('planner-total-travelers').textContent = travelers;
      byId('passenger-message').hidden = travelers > 0;
      byId('summary-trip').textContent = travelers + (travelers === 1 ? ' traveler' : ' travelers') + ' • ' + duration;
      byId('summary-pending').textContent = !travelers ? 'Add at least one traveler to calculate your trip estimate.' : !plannerState.vessel ? 'Choose a vessel to include its fare. This subtotal currently covers additional expenses only.' : !journeyComplete() ? 'Vessel fare included. Select a departure to complete your journey.' : 'Includes the selected outward vessel fare and your additional estimates.';
      Object.entries(costs).forEach(([key, cents]) => { byId('summary-' + key).textContent = key === 'vesselFare' && !plannerState.vessel ? 'Choose vessel' : currency.format(cents / 100); });
      const totalCents = Object.values(costs).reduce((sum, cents) => sum + cents, 0);
      byId('summary-total').textContent = travelers ? currency.format(totalCents / 100) : '—';
      byId('summary-person').textContent = travelers ? currency.format(totalCents / 100 / travelers) : '—';
      const breakdown = byId('planner-fare-breakdown'); breakdown.replaceChildren();
      if (!plannerState.vessel) breakdown.append(textElement('p', 'Choose a route and vessel to see your automatic fare.'));
      else {
        breakdown.append(textElement('p', vesselSchedules[plannerState.vessel].name, 'fw-bold'));
        const list = document.createElement('dl'); list.className = 'planner-fare-list';
        Object.entries(plannerState.passengers).filter(([, count]) => count > 0).forEach(([key, count]) => {
          const fare = vesselFares[plannerState.vessel][key], row = document.createElement('div');
          row.append(textElement('dt', count + ' ' + passengerLabels[key] + ' × ' + currency.format(fare)), textElement('dd', currency.format(count * Math.round(fare * 100) / 100))); list.append(row);
        });
        breakdown.append(list, textElement('p', 'Total Vessel Fare: ' + currency.format(costs.vesselFare / 100), 'fw-bold'), textElement('p', fareNote(plannerState.vessel), 'small text-secondary'));
      }
    }
    function render() { renderJourney(); renderBudget(); }
    function syncControls() {
      byId('planner-origin').value = plannerState.origin; byId('planner-custom-origin').value = plannerState.customOrigin; byId('planner-days').value = plannerState.days;
      Object.entries(plannerState.passengers).forEach(([key, value]) => { byId('passenger-' + key).value = value; });
      Object.entries(plannerState.budget).forEach(([key, value]) => { byId('budget-' + key).value = value; }); render();
    }
    buildVesselChoices(); restorePlannerState(); syncControls(); savePlannerState();
    byId('planner-origin').addEventListener('change', event => {
      plannerState.origin = event.target.value; normalizeJourney(); render(); savePlannerState();
    });
    byId('planner-custom-origin').addEventListener('input', event => {
      plannerState.customOrigin = event.target.value.slice(0, 120); renderJourney(); savePlannerState();
    });
    planner.addEventListener('change', event => {
      const input = event.target;
      if (!input.matches('input[type="radio"]') || !input.checked) return;
      if (input.name === 'routeOption' && plannerState.routeOption !== input.value) {
        plannerState.routeOption = input.value; plannerState.transportMode = ''; plannerState.vessel = ''; plannerState.departureTime = '';
      } else if (input.name === 'transportMode' && plannerState.transportMode !== input.value) {
        plannerState.transportMode = input.value; plannerState.vessel = ''; plannerState.departureTime = '';
      } else if (input.name === 'vessel' && plannerState.vessel !== input.value) {
        plannerState.vessel = input.value; plannerState.departureTime = '';
      } else if (input.name === 'departureTime') plannerState.departureTime = input.value;
      normalizeJourney(); render(); savePlannerState();
    });
    planner.querySelectorAll('input[type="number"]').forEach(input => {
      const update = event => {
        const budgetKey = input.dataset.budget, passengerKey = input.dataset.passenger;
        const value = plannerNumber(input.value, budgetKey ? budgetDefaults[budgetKey] : passengerKey ? 0 : 2, budgetKey || passengerKey ? 0 : 1, budgetKey ? 10000000 : passengerKey ? 10000 : 7, Boolean(budgetKey));
        if (budgetKey) plannerState.budget[budgetKey] = value;
        else if (passengerKey) plannerState.passengers[passengerKey] = value;
        else plannerState.days = value;
        // Allow a temporary blank while typing; commit a safe value on change.
        if (input.value !== '' || event.type === 'change') input.value = value;
        render(); savePlannerState();
      };
      input.addEventListener('input', update); input.addEventListener('change', update);
    });
    byId('reset-budget').addEventListener('click', () => { plannerState.budget = { ...budgetDefaults }; syncControls(); savePlannerState(); });
    const confirmation = byId('reset-trip-confirmation');
    byId('reset-trip').addEventListener('click', () => {
      confirmation.hidden = false; byId('reset-trip').setAttribute('aria-expanded', 'true'); byId('cancel-reset-trip').focus({ preventScroll: true });
    });
    function closeConfirmation() {
      confirmation.hidden = true; byId('reset-trip').setAttribute('aria-expanded', 'false'); byId('reset-trip').focus({ preventScroll: true });
    }
    byId('cancel-reset-trip').addEventListener('click', closeConfirmation);
    confirmation.addEventListener('keydown', event => { if (event.key === 'Escape') closeConfirmation(); });
    byId('confirm-reset-trip').addEventListener('click', () => {
      plannerState = defaultPlannerState(); syncControls(); savePlannerState(); closeConfirmation();
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
    initTripPlanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
