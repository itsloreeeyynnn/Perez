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
        if (link.classList.contains('skip-link')) target.focus({ preventScroll: true });
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
        // The planner sits inside Travel, so observe the travel cards and the
        // planner block separately instead of letting the section mask it.
        track(document.getElementById('travel-information-cards'), hash);
        track(target, hash);
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
          <button class="btn btn-gold btn-sm" type="button" data-itinerary-add="destination" data-ref-id="${card.dataset.destination}" aria-describedby="${back.id}-note">Add to Itinerary</button>
          <p class="destination-placeholder-note" id="${back.id}-note">Adds this place to a day in your trip plan.</p>
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
      front.querySelector('.learn-more')?.addEventListener('click', () => flip(true));
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

  // One shared IntersectionObserver powers every scroll reveal on the page
  // (experiences and events). Each element reveals once and never flickers.
  let revealObserver = null;
  let revealMotionBound = false;
  function getRevealObserver(main) {
    if (revealObserver || !('IntersectionObserver' in window)) return revealObserver;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { root: main, threshold: 0.15 });
    return revealObserver;
  }
  function revealOnScroll(targets, focusables = []) {
    const main = document.querySelector('.main-content');
    if (!main || !targets.filter(Boolean).length || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const observer = getRevealObserver(main);
    if (!observer) return;
    targets.forEach((target, index) => {
      if (!target) return;
      target.classList.add('experience-reveal');
      target.style.setProperty('--reveal-delay', `${index % 3 * 80}ms`);
      observer.observe(target);
    });
    focusables.forEach((focusable, index) => {
      const target = targets[index];
      if (!focusable || !target) return;
      focusable.addEventListener('focus', () => {
        target.classList.add('is-revealed');
        observer.unobserve(target);
      });
    });
    if (revealMotionBound) return;
    revealMotionBound = true;
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      document.querySelectorAll('.experience-reveal').forEach((node) => node.classList.add('is-revealed'));
      observer.disconnect();
      revealObserver = null;
    });
  }

  function initExperienceReveal() {
    const cards = [...document.querySelectorAll('[data-experience]')];
    revealOnScroll(cards.map((card) => card.parentElement), cards);
  }

  // ===================== Phase 5 · Events in Perez =====================
  // Every field below repeats information already shown on this site. No
  // event name, date, venue, or description is invented here.
  const eventCategoryLabels = {
    festivals: 'Festivals',
    culture: 'Culture',
    community: 'Community',
    religious: 'Religious',
  };
  const eventCategoryOrder = ['festivals', 'culture', 'community', 'religious'];
  const eventsData = [
    {
      id: 'kayakas-festival',
      name: 'Kayakas Festival',
      category: 'festivals',
      dateType: 'annual',
      dateLabel: 'June 15–20',
      month: 'June',
      location: '',
      shortDescription: 'A thanksgiving celebration of the bountiful coconut harvest and the marine livelihood of Perez, featuring energetic street dances, boats, and local crafts.',
      fullDescription: 'A thanksgiving celebration of the bountiful coconut harvest and the marine livelihood of Perez, featuring energetic street dances, boats, and local crafts.',
      image: 'placeholder.svg',
      itineraryEligible: true,
    },
    {
      id: 'fishermans-feast-day',
      name: 'Fisherman\'s Feast Day',
      category: 'religious',
      dateType: 'annual',
      dateLabel: 'May 15',
      month: 'May',
      location: 'Coastal San Jose Barangay',
      shortDescription: '',
      fullDescription: '',
      image: 'placeholder.svg',
      itineraryEligible: true,
    },
    {
      id: 'coconut-agri-trade-fair',
      name: 'Coconut Agri-Trade Fair',
      category: 'community',
      dateType: 'annual',
      dateLabel: 'June 04',
      month: 'June',
      location: 'Municipal Complex',
      shortDescription: '',
      fullDescription: '',
      image: 'placeholder.svg',
      itineraryEligible: true,
    },
    {
      id: 'perez-flotilla-parade',
      name: 'Perez Flotilla Parade',
      category: 'culture',
      dateType: 'annual',
      dateLabel: 'June 18',
      month: 'June',
      location: 'Sande Bay Sanctuaries',
      shortDescription: '',
      fullDescription: '',
      image: 'placeholder.svg',
      itineraryEligible: true,
    },
  ];
  const EVENT_LOCATION_FALLBACK = 'Location to be announced.';
  const EVENT_SCHEDULE_UNAVAILABLE = 'Schedule information is not currently available.';
  const EVENT_EXACT_DATE_WARNING = 'This event has a fixed date. Confirm that it falls within your trip dates before adding it.';
  const EVENT_TBA_DATE_WARNING = 'This event does not have a confirmed date. Confirm the schedule locally before adding it.';

  const findEventById = (id) => (typeof id === 'string' && id ? eventsData.find((event) => event.id === id) || null : null);
  const eventName = (id) => findEventById(id)?.name || '';
  const eventCategoryLabel = (category) => eventCategoryLabels[category] || category || '';

  function formatEventDate(event) {
    if (!event) return '';
    if (event.dateLabel) return event.dateLabel;
    if (event.month) return event.month;
    return '';
  }

  function getEventStatus(event) {
    if (!event) return '';
    if (event.dateType === 'exact') {
      const timestamp = Date.parse(event.dateLabel || event.month || '');
      if (Number.isNaN(timestamp)) return 'Date to be announced';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return timestamp >= today.getTime() ? 'Upcoming' : 'Past event';
    }
    if (event.dateType === 'annual') return 'Annual';
    if (event.dateType === 'month') return 'Seasonal';
    if (event.dateType === 'tba') return 'Date to be announced';
    return 'Schedule varies';
  }

  function eventDateWarning(refId) {
    const event = findEventById(refId);
    if (!event) return '';
    if (event.dateType === 'exact') return EVENT_EXACT_DATE_WARNING;
    if (event.dateType === 'variable' || event.dateType === 'tba' || event.dateType === 'unknown') return EVENT_TBA_DATE_WARNING;
    return '';
  }

  function eventMeta(className, iconName, text) {
    const row = document.createElement('span');
    row.className = className;
    const icon = document.createElement('i');
    icon.className = 'bi bi-' + iconName;
    icon.setAttribute('aria-hidden', 'true');
    row.append(icon, document.createTextNode(' ' + text));
    return row;
  }

  function buildEventCard(event) {
    const column = document.createElement('div');
    column.className = 'col-sm-6 col-lg-3 event-column';
    column.dataset.eventColumn = event.id;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'event-card';
    card.dataset.event = event.id;
    card.dataset.eventCategory = event.category;
    card.dataset.bsToggle = 'modal';
    card.dataset.bsTarget = '#eventDetailsModal';
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-controls', 'eventDetailsModal');

    const image = document.createElement('img');
    image.className = 'event-card-image';
    image.src = event.image || 'placeholder.svg';
    image.alt = event.name;

    const body = document.createElement('span');
    body.className = 'event-card-body';

    const badges = document.createElement('span');
    badges.className = 'event-card-badges';
    const category = document.createElement('span');
    category.className = 'event-card-category';
    category.textContent = eventCategoryLabel(event.category);
    const status = document.createElement('span');
    status.className = 'event-card-status';
    status.textContent = getEventStatus(event);
    badges.append(category, status);

    const title = document.createElement('span');
    title.className = 'event-card-title';
    title.textContent = event.name;

    body.append(badges, title);

    const dateText = formatEventDate(event);
    if (dateText) body.append(eventMeta('event-card-meta event-card-date', 'calendar3', dateText));
    body.append(eventMeta('event-card-meta event-card-location', 'geo-alt', event.location || EVENT_LOCATION_FALLBACK));
    if (event.shortDescription) {
      const description = document.createElement('span');
      description.className = 'event-card-text';
      description.textContent = event.shortDescription;
      body.append(description);
    }

    const link = document.createElement('span');
    link.className = 'event-card-link';
    link.append(document.createTextNode('Click to learn more '));
    const arrow = document.createElement('i');
    arrow.className = 'bi bi-arrow-right';
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    body.append(link);

    card.append(image, body);
    column.append(card);
    return column;
  }

  function renderEventFilters() {
    const host = document.getElementById('event-filters');
    if (!host) return;
    host.replaceChildren();
    if (!eventsData.length) return;
    const extras = [...new Set(eventsData.map((event) => event.category))]
      .filter((category) => !eventCategoryOrder.includes(category));
    const values = [
      ['all', 'All'],
      ...eventCategoryOrder
        .filter((category) => eventsData.some((event) => event.category === category))
        .concat(extras)
        .map((category) => [category, eventCategoryLabel(category)]),
    ];
    values.forEach(([value, label], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-btn' + (index === 0 ? ' active' : '');
      button.dataset.eventFilter = value;
      button.setAttribute('aria-pressed', String(index === 0));
      button.textContent = label;
      host.append(button);
    });
  }

  function renderEvents(filter = 'all') {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    const emptyAll = document.getElementById('events-empty');
    const emptyCategory = document.getElementById('events-empty-category');
    const status = document.getElementById('event-filter-status');
    const hasEvents = eventsData.length > 0;
    const visible = eventsData.filter((event) => filter === 'all' || event.category === filter);
    grid.replaceChildren();
    visible.forEach((event) => grid.append(buildEventCard(event)));
    grid.hidden = visible.length === 0;
    if (emptyAll) emptyAll.hidden = hasEvents;
    if (emptyCategory) emptyCategory.hidden = !hasEvents || visible.length > 0;
    if (status) {
      status.textContent = hasEvents
        ? `${visible.length} ${visible.length === 1 ? 'event' : 'events'} shown: ${filter === 'all' ? 'All' : eventCategoryLabel(filter)}.`
        : 'Event information is currently being prepared.';
    }
    revealOnScroll(
      [...grid.querySelectorAll('.event-column')],
      [...grid.querySelectorAll('[data-event]')],
    );
  }

  function setEventFilter(filter) {
    const active = typeof filter === 'string' && filter ? filter : 'all';
    document.querySelectorAll('[data-event-filter]').forEach((button) => {
      const selected = button.dataset.eventFilter === active;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderEvents(active);
  }

  function openEventDetails(eventId, trigger) {
    const modal = document.getElementById('eventDetailsModal');
    if (!modal || !window.bootstrap?.Modal || !findEventById(eventId)) return;
    const relatedTarget = trigger?.dataset?.event === eventId
      ? trigger
      : document.querySelector(`[data-event="${eventId}"]`);
    if (!relatedTarget) return;
    window.bootstrap.Modal.getOrCreateInstance(modal).show(relatedTarget);
  }

  function initEventDetailsModal() {
    const modal = document.getElementById('eventDetailsModal');
    if (!modal || !window.bootstrap?.Modal) return;
    modal.addEventListener('show.bs.modal', (event) => {
      const details = findEventById(event.relatedTarget?.dataset?.event);
      if (!details) { event.preventDefault(); return; }
      modal.querySelector('#event-details-title').textContent = details.name;
      const image = modal.querySelector('#event-details-image');
      image.src = details.image || 'placeholder.svg';
      image.alt = details.name;
      modal.querySelector('#event-details-category').textContent = eventCategoryLabel(details.category);
      modal.querySelector('#event-details-status').textContent = getEventStatus(details);

      const description = modal.querySelector('#event-details-description');
      description.textContent = details.fullDescription || details.shortDescription || '';
      description.hidden = !description.textContent;

      const dateText = formatEventDate(details);
      const dateLabel = modal.querySelector('#event-details-date-label');
      const dateValue = modal.querySelector('#event-details-date');
      dateLabel.hidden = !dateText;
      dateValue.hidden = !dateText;
      dateValue.textContent = dateText;

      const scheduleLabel = modal.querySelector('#event-details-schedule-label');
      const scheduleValue = modal.querySelector('#event-details-schedule');
      const needsSchedule = !dateText;
      scheduleLabel.hidden = !needsSchedule;
      scheduleValue.hidden = !needsSchedule;
      scheduleValue.textContent = needsSchedule ? EVENT_SCHEDULE_UNAVAILABLE : '';

      modal.querySelector('#event-details-location-label').hidden = false;
      const locationValue = modal.querySelector('#event-details-location');
      locationValue.hidden = false;
      locationValue.textContent = details.location || EVENT_LOCATION_FALLBACK;

      const addButton = modal.querySelector('#event-add-itinerary');
      const note = modal.querySelector('#event-itinerary-note');
      const eligible = details.itineraryEligible !== false;
      addButton.hidden = !eligible;
      note.hidden = !eligible;
      note.classList.toggle('d-block', eligible);
      addButton.dataset.refId = details.id;
    });
  }

  function initEvents() {
    if (!document.getElementById('events')) return;
    renderEventFilters();
    renderEvents('all');
    initEventDetailsModal();
    // Delegated so filters keep working after any re-render of the buttons.
    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('[data-event-filter]');
      if (!button) return;
      setEventFilter(button.dataset.eventFilter);
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
  // Every origin only provides GENERAL guidance toward Atimonan Port. This
  // planner does not calculate routes, fares, or travel times from a start point.
  const travelOrigins = {
    manila: { name: 'Metro Manila', direction: 'Travel toward Quezon Province and continue to Atimonan', stages: ['Metro Manila', 'Land Travel Toward Quezon', 'Atimonan'] },
    lucena: { name: 'Lucena City', direction: 'Travel toward Atimonan', stages: ['Lucena City', 'Travel Toward Atimonan'] },
    'san-pablo': { name: 'San Pablo City', direction: 'Travel toward Atimonan', stages: ['San Pablo City', 'Travel Toward Atimonan'] },
    tayabas: { name: 'Tayabas City', direction: 'Travel toward Atimonan', stages: ['Tayabas City', 'Travel Toward Atimonan'] },
    sariaya: { name: 'Sariaya', direction: 'Travel toward Atimonan', stages: ['Sariaya', 'Travel Toward Atimonan'] },
    candelaria: { name: 'Candelaria', direction: 'Travel toward Atimonan', stages: ['Candelaria', 'Travel Toward Atimonan'] },
    tiaong: { name: 'Tiaong', direction: 'Travel toward Atimonan', stages: ['Tiaong', 'Travel Toward Atimonan'] },
    pagbilao: { name: 'Pagbilao', direction: 'Travel toward Atimonan', stages: ['Pagbilao', 'Travel Toward Atimonan'] },
    atimonan: { name: 'Atimonan', direction: 'Proceed from the town center to Atimonan Port', stages: ['Atimonan'] },
    gumaca: { name: 'Gumaca', direction: 'Travel toward Atimonan', stages: ['Gumaca', 'Travel Toward Atimonan'] },
    lopez: { name: 'Lopez', direction: 'Travel toward Atimonan', stages: ['Lopez', 'Travel Toward Atimonan'] },
    calauag: { name: 'Calauag', direction: 'Travel toward Atimonan', stages: ['Calauag', 'Travel Toward Atimonan'] },
    tagkawayan: { name: 'Tagkawayan', direction: 'Travel toward Atimonan', stages: ['Tagkawayan', 'Travel Toward Atimonan'] },
    other: { name: 'Other location', direction: 'Travel toward Atimonan Port', stages: [] },
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
  const otherRouteNotice = 'Detailed directions from custom locations are not calculated by this planner. Atimonan Port is used as the starting point for the island crossing.';
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
      const names = plannerState.origin === 'other'
        ? [startName(), 'Travel Toward Atimonan Port']
        : [...(travelOrigins[plannerState.origin]?.stages || [])];
      return [
        ...names.map(name => ({ name, icon: /travel toward|land travel|transportation/i.test(name) ? 'bus-front' : 'geo-alt' })),
        { name: 'Atimonan Port', icon: 'signpost-split' },
      ];
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
        if (plannerState.origin === 'other') {
          route.append(textElement('p', otherRouteNotice, 'small text-secondary'));
          if (!plannerState.customOrigin.trim()) route.append(textElement('p', 'Enter your city or municipality above to personalize this route.', 'small text-secondary'));
        } else if (travelOrigins[plannerState.origin]?.direction) route.append(textElement('p', travelOrigins[plannerState.origin].direction, 'small text-secondary'));
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
      const rows = { From: startName() };
      if (!plannerState.routeOption) {
        rows['Next Gateway'] = 'Atimonan Port';
        rows['Next Step'] = 'Choose whether you will land in Perez or Alabat.';
      } else if (plannerState.routeOption === 'direct') {
        rows['Gateway'] = 'Atimonan Port';
        rows['Island Landing'] = 'Perez'; rows['Sea Transport'] = 'Lantsa'; rows['Vessel'] = 'MB Capricorn'; rows['Departure'] = '11:00 AM'; rows['Final Stop'] = 'Perez';
      } else {
        rows['Gateway'] = 'Atimonan Port';
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
      gettingThere.replaceChildren(textElement('p', 'Your Current Plan', 'travel-detail-label'), makeTimeline(routeStages, 'Getting there based on your trip planner input'), facts, textElement('p', 'Schedules and fares may change. Confirm the latest operator or port advisory before traveling.', 'travel-detail-note'));
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

  // ===================== Phase 4 · My Perez Trip itinerary =====================
  // The itinerary keeps its own stored document (perezItineraryV1) and always
  // follows the Phase 3 trip length. It never changes Phase 3 journey,
  // vessel, fare, or budget calculations.
  const itineraryKey = 'perezItineraryV1';
  const itineraryPeriods = { any: 'Any Time', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
  const itineraryTypes = { destination: 'Destination', experience: 'Experience', event: 'Event', custom: 'Custom' };
  const itineraryLimits = { title: 60, dayNotes: 600, name: 80, note: 300 };
  let itineraryState = { days: {} };
  let activeItineraryDay = 1;
  let newestItineraryItemId = null;
  const itineraryUI = {
    addTarget: null, duplicate: null, editing: null, moving: null, removing: null,
    reducing: null, revertingDays: false, experienceId: null, focusItem: null,
  };

  const itineraryEl = (id) => document.getElementById(id);
  const emptyDay = () => ({ title: '', notes: '', items: [] });
  const clampText = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  const tripDays = () => {
    const days = window.perezTripPlanner?.getTripDays?.();
    return Number.isInteger(days) && days > 0 ? days : 1;
  };
  const tripTravelers = () => {
    const count = window.perezTripPlanner?.getTravelerCount?.();
    return Number.isFinite(count) ? count : 0;
  };
  function itineraryNode(tag, text, className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function itineraryUUID() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'iti-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  // Display names come from the existing website content, never duplicated copy.
  const destinationName = (id) => destinationLocations.find((d) => d.id === id)?.name || '';
  const experienceName = (id) => experiences.find((e) => e.id === id)?.title || '';
  function itemSourceName(item) {
    if (!item) return '';
    if (item.type === 'custom') return item.name;
    if (item.type === 'destination') return destinationName(item.refId);
    if (item.type === 'experience') return experienceName(item.refId);
    if (item.type === 'event') return eventName(item.refId);
    return '';
  }
  // An event whose id is missing from eventsData still renders, with an
  // explicit fallback name, instead of disappearing from the trip plan.
  const itemDisplayName = (item) => itemSourceName(item) || (item?.type === 'event' ? 'Event information unavailable' : '');
  function validItineraryRef(type, refId) {
    if (type === 'destination') return Boolean(destinationDetails[refId]);
    if (type === 'experience') return experiences.some((e) => e.id === refId);
    if (type === 'event') return Boolean(findEventById(refId));
    return false;
  }
  function sameSource(item, target) {
    if (item.type !== target.type) return false;
    return target.type === 'custom' ? item.name === target.name : item.refId === target.refId;
  }

  function sanitizeItineraryItem(raw) {
    if (!raw || typeof raw !== 'object' || !owns(itineraryTypes, raw.type)) return null;
    const type = raw.type;
    const period = owns(itineraryPeriods, raw.period) ? raw.period : 'any';
    const note = clampText(raw.note, itineraryLimits.note).trim();
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.slice(0, 64) : itineraryUUID();
    if (type === 'custom') {
      const name = clampText(raw.name, itineraryLimits.name).trim();
      return name ? { id, type, name, period, note } : null;
    }
    if (type === 'event') {
      // Event items survive even when eventsData no longer lists the id, so
      // an existing trip plan is never silently rewritten at load.
      if (typeof raw.refId !== 'string' || !raw.refId.trim()) return null;
      return { id, type, refId: raw.refId.slice(0, 64), period, note };
    }
    if (typeof raw.refId !== 'string' || !validItineraryRef(type, raw.refId)) return null;
    return { id, type, refId: raw.refId, period, note };
  }

  function loadItinerary() {
    itineraryState = { days: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(itineraryKey));
      const source = saved && typeof saved === 'object' && saved.days && typeof saved.days === 'object' ? saved.days : null;
      if (!source) return;
      const seenIds = new Set();
      Object.keys(source).forEach((key) => {
        if (!/^[1-9]\d?$/.test(key)) return;
        const raw = source[key];
        if (!raw || typeof raw !== 'object') return;
        const items = (Array.isArray(raw.items) ? raw.items : []).map(sanitizeItineraryItem).filter(Boolean);
        items.forEach((item) => {
          if (seenIds.has(item.id)) item.id = itineraryUUID();
          seenIds.add(item.id);
        });
        itineraryState.days[key] = {
          title: clampText(raw.title, itineraryLimits.title),
          notes: clampText(raw.notes, itineraryLimits.dayNotes),
          items,
        };
      });
    } catch { /* Corrupt or unavailable storage starts from an empty itinerary. */ }
  }
  function saveItinerary() {
    try { localStorage.setItem(itineraryKey, JSON.stringify({ days: itineraryState.days })); }
    catch { /* Storage failures never block planning in this session. */ }
  }

  const dayKeys = () => Object.keys(itineraryState.days).map(Number).sort((a, b) => a - b);
  const itineraryDayCount = () => dayKeys().reduce((max, n) => Math.max(max, n), 0);
  function dayData(number) {
    if (!itineraryState.days[number]) itineraryState.days[number] = emptyDay();
    return itineraryState.days[number];
  }
  function ensureItineraryDays(count) {
    for (let n = 1; n <= count; n += 1) dayData(n);
  }
  function occupiedDaysAbove(count) {
    return dayKeys().filter((n) => {
      const day = itineraryState.days[n];
      return n > count && (day.items.length > 0 || Boolean(day.title.trim()) || Boolean(day.notes.trim()));
    });
  }
  function mergeDayInto(fromNumber, toNumber) {
    const source = itineraryState.days[fromNumber];
    if (!source || fromNumber === toNumber) return;
    const target = dayData(toNumber);
    target.items.push(...source.items);
    const notes = source.notes.trim();
    if (notes) target.notes = target.notes ? `${target.notes}\n${notes}` : notes;
    if (source.title.trim()) {
      if (!target.title.trim()) target.title = source.title;
      else {
        const line = `Day ${fromNumber} title: ${source.title}`;
        target.notes = target.notes ? `${target.notes}\n${line}` : line;
      }
    }
    delete itineraryState.days[fromNumber];
  }
  function findItineraryItem(id, dayNumber = activeItineraryDay) {
    return itineraryState.days[dayNumber]?.items.find((item) => item.id === id) || null;
  }

  // ===================== Phase 3 ↔ Phase 4 day synchronisation =====================
  function applyPlannerDays() {
    if (itineraryUI.revertingDays) return;
    const days = tripDays();
    const current = itineraryDayCount();
    if (days === current) { ensureItineraryDays(days); return; }
    if (days > current) {
      ensureItineraryDays(days);
      saveItinerary();
      renderItinerary();
      return;
    }
    const occupied = occupiedDaysAbove(days);
    if (occupied.length) { openReduceDaysModal(days, occupied); return; }
    dayKeys().filter((n) => n > days).forEach((n) => { delete itineraryState.days[n]; });
    ensureItineraryDays(days);
    saveItinerary();
    renderItinerary();
  }
  function restorePlannerDays(value) {
    itineraryUI.revertingDays = true;
    const input = itineraryEl('planner-days');
    if (input) {
      input.value = String(value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    itineraryUI.revertingDays = false;
  }
  function openReduceDaysModal(newDays, orphanDays) {
    const last = orphanDays[orphanDays.length - 1];
    const range = orphanDays.length === 1 ? `Day ${last}` : `Days ${orphanDays[0]}–${last}`;
    itineraryUI.reducing = { newDays, orphanDays };
    itineraryEl('reduce-days-intro').textContent =
      `Reducing your trip to ${newDays} ${newDays === 1 ? 'day' : 'days'} will remove ${range} from your itinerary. Nothing is removed until you choose.`;
    const list = itineraryEl('reduce-days-list');
    list.replaceChildren();
    orphanDays.forEach((n) => {
      const day = itineraryState.days[n];
      const parts = [`${day.items.length} ${day.items.length === 1 ? 'activity' : 'activities'}`];
      if (day.title.trim()) parts.push(`title "${day.title}"`);
      if (day.notes.trim()) parts.push('day notes');
      list.append(itineraryNode('li', `Day ${n}: ${parts.join(', ')}`));
    });
    itineraryEl('reduce-days-move').textContent = `Move to Day ${newDays}`;
    itineraryEl('reduce-days-remove').textContent = orphanDays.length === 1
      ? `Remove Day ${last} activities`
      : `Remove ${range} activities`;
    showModal('reduce-days-modal');
  }
  function reduceDaysMove() {
    const pending = itineraryUI.reducing;
    if (!pending) return;
    pending.orphanDays.forEach((n) => mergeDayInto(n, pending.newDays));
    dayKeys().filter((n) => n > pending.newDays).forEach((n) => { delete itineraryState.days[n]; });
    ensureItineraryDays(pending.newDays);
    if (activeItineraryDay > pending.newDays) activeItineraryDay = pending.newDays;
    itineraryUI.reducing = null;
    hideModal('reduce-days-modal');
    saveItinerary();
    renderItinerary();
    showItineraryToast(`Activities moved to Day ${pending.newDays}`);
  }
  function reduceDaysRemove() {
    const pending = itineraryUI.reducing;
    if (!pending) return;
    const last = pending.orphanDays[pending.orphanDays.length - 1];
    const range = pending.orphanDays.length === 1 ? `Day ${last}` : `Days ${pending.orphanDays[0]}–${last}`;
    pending.orphanDays.forEach((n) => { delete itineraryState.days[n]; });
    dayKeys().filter((n) => n > pending.newDays).forEach((n) => { delete itineraryState.days[n]; });
    ensureItineraryDays(pending.newDays);
    if (activeItineraryDay > pending.newDays) activeItineraryDay = pending.newDays;
    itineraryUI.reducing = null;
    hideModal('reduce-days-modal');
    saveItinerary();
    renderItinerary();
    showItineraryToast(`${range} removed from your itinerary`);
  }
  function reduceDaysCancel() {
    itineraryUI.reducing = null;
    restorePlannerDays(itineraryDayCount() || 1);
  }

  // ===================== Itinerary rendering =====================
  function renderTripMeta() {
    const meta = itineraryEl('itinerary-trip-meta');
    if (!meta) return;
    const days = tripDays(), travelers = tripTravelers();
    meta.textContent = `${days} ${days === 1 ? 'Day' : 'Days'} • ${travelers} ${travelers === 1 ? 'Traveler' : 'Travelers'}`;
  }

  function renderJourneySummary() {
    const host = itineraryEl('itinerary-journey');
    if (!host) return;
    host.replaceChildren();
    const state = window.perezTripPlanner?.getPlannerState?.() || {};
    const rows = [];
    const originName = state.origin === 'other'
      ? (state.customOrigin?.trim() || 'Other location')
      : travelOrigins[state.origin]?.name || '';
    if (state.origin) rows.push(['From', originName]);
    if (state.routeOption === 'direct') {
      rows.push(['Landing', 'Perez'], ['Vessel', vesselSchedules['mb-capricorn'].name], ['Departure', vesselSchedules['mb-capricorn'].departures[0]]);
    } else if (state.routeOption === 'via-alabat') {
      rows.push(['Landing', 'Alabat']);
      if (state.transportMode) rows.push(['Transport', state.transportMode === 'roro' ? 'RORO' : 'Lantsa']);
      if (state.vessel) {
        rows.push(['Vessel', vesselSchedules[state.vessel].name]);
        if (state.departureTime) rows.push(['Departure', state.departureTime]);
      }
      rows.push(['Final Connection', 'Tricycle to Perez']);
    } else if (state.origin) {
      rows.push(['Landing', 'Not chosen yet']);
    }
    if (rows.length) {
      const list = document.createElement('dl');
      list.className = 'itinerary-journey-list';
      rows.forEach(([label, value]) => list.append(itineraryNode('dt', label), itineraryNode('dd', value)));
      host.append(list);
    }
    const complete = Boolean(state.origin && state.vessel && state.departureTime);
    if (!complete) {
      host.append(
        itineraryNode('p', 'Complete Your Journey above to include transportation details in your trip plan.', 'itinerary-notice'),
      );
      const link = document.createElement('a');
      link.href = '#trip-planner';
      link.className = 'btn btn-sm btn-gold mt-2';
      link.textContent = 'Plan Your Journey';
      host.append(link);
    }
  }

  function renderItinerarySummary() {
    const host = itineraryEl('itinerary-summary');
    if (!host) return;
    const days = tripDays(), travelers = tripTravelers();
    const counts = [];
    let total = 0, filled = 0;
    for (let n = 1; n <= days; n += 1) {
      const count = dayData(n).items.length;
      counts.push(count);
      total += count;
      if (count > 0) filled += 1;
    }
    const stats = document.createElement('ul');
    stats.className = 'itinerary-stats';
    [[String(days), days === 1 ? 'Day' : 'Days'], [String(travelers), travelers === 1 ? 'Traveler' : 'Travelers'], [String(total), total === 1 ? 'Planned Activity' : 'Planned Activities']]
      .forEach(([value, label]) => {
        const cell = document.createElement('li');
        cell.append(itineraryNode('strong', value), itineraryNode('span', label));
        stats.append(cell);
      });
    const breakdown = document.createElement('ul');
    breakdown.className = 'itinerary-summary-days';
    counts.forEach((count, index) => {
      breakdown.append(itineraryNode('li', `Day ${index + 1} — ${count} ${count === 1 ? 'activity' : 'activities'}`));
    });
    host.replaceChildren(
      stats, breakdown,
      itineraryNode('p', `${filled} of ${days} ${days === 1 ? 'day has' : 'days have'} activities`, 'itinerary-summary-status'),
    );
  }

  function renderDayTabs() {
    const tabs = itineraryEl('itinerary-day-tabs');
    if (!tabs) return;
    const days = tripDays();
    if (activeItineraryDay > days) activeItineraryDay = days;
    tabs.replaceChildren();
    for (let n = 1; n <= days; n += 1) {
      const count = dayData(n).items.length;
      const item = document.createElement('li');
      item.className = 'nav-item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-link' + (n === activeItineraryDay ? ' active' : '');
      button.dataset.day = String(n);
      button.setAttribute('aria-pressed', String(n === activeItineraryDay));
      button.setAttribute('aria-label', `Day ${n}, ${count} ${count === 1 ? 'activity' : 'activities'}`);
      button.append(itineraryNode('span', `Day ${n}`));
      button.addEventListener('click', () => {
        activeItineraryDay = n;
        renderDayTabs();
        renderActiveDay();
      });
      item.append(button);
      tabs.append(item);
    }
  }

  function buildEmptyDay(dayNumber) {
    const box = document.createElement('div');
    box.className = 'itinerary-empty';
    const icon = document.createElement('i');
    icon.className = 'bi bi-calendar-plus';
    icon.setAttribute('aria-hidden', 'true');
    box.append(
      icon,
      itineraryNode('p', `Nothing planned for Day ${dayNumber} yet.`, 'itinerary-empty-title'),
      itineraryNode('p', 'Explore destinations, experiences, and events, then add them to this day.'),
    );
    const actions = document.createElement('div');
    actions.className = 'itinerary-empty-actions';
    [['Browse Destinations', '#destinations'], ['Browse Experiences', '#experiences'], ['Browse Events', '#events']].forEach(([label, href]) => {
      const link = document.createElement('a');
      link.href = href;
      link.className = 'btn btn-sm btn-outline-secondary';
      link.textContent = label;
      actions.append(link);
    });
    box.append(actions);
    return box;
  }

  function itineraryItemButton(action, icon, label, options = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    button.className = 'btn btn-sm btn-outline-secondary' + (options.iconOnly ? ' btn-icon' : '');
    button.setAttribute('aria-label', label);
    button.title = label;
    if (options.disabled) button.disabled = true;
    const glyph = document.createElement('i');
    glyph.className = 'bi bi-' + icon;
    glyph.setAttribute('aria-hidden', 'true');
    button.append(glyph);
    if (!options.iconOnly) button.append(document.createTextNode(' ' + options.text));
    return button;
  }

  function renderItineraryItem(item, index, total) {
    const card = document.createElement('li');
    card.className = 'itinerary-item' + (item.id === newestItineraryItemId ? ' is-new' : '');
    card.dataset.itemId = item.id;

    const main = document.createElement('div');
    main.className = 'itinerary-item-main';
    const top = document.createElement('div');
    top.className = 'itinerary-item-top';
    const name = itemDisplayName(item);
    top.append(
      itineraryNode('span', itineraryTypes[item.type], 'itinerary-item-type'),
      itineraryNode('strong', name, 'itinerary-item-name'),
      itineraryNode('span', itineraryPeriods[item.period], 'badge itinerary-period'),
    );
    main.append(top);
    if (item.note) main.append(itineraryNode('p', item.note, 'itinerary-item-note'));

    const controls = document.createElement('div');
    controls.className = 'itinerary-item-controls';
    controls.append(
      itineraryItemButton('up', 'arrow-up', `Move ${name} up`, { iconOnly: true, disabled: index === 0 }),
      itineraryItemButton('down', 'arrow-down', `Move ${name} down`, { iconOnly: true, disabled: index === total - 1 }),
      itineraryItemButton('move', 'arrow-left-right', 'Move', { text: 'Move' }),
      itineraryItemButton('edit', 'pencil', 'Edit', { text: 'Edit' }),
      itineraryItemButton('remove', 'trash', 'Remove', { text: 'Remove' }),
    );
    if (item.type === 'event' && findEventById(item.refId)) {
      const view = itineraryItemButton('view-event', 'calendar-event', 'View Event', { text: 'View Event' });
      view.dataset.event = item.refId;
      controls.append(view);
    }
    card.append(main, controls);
    return card;
  }

  function renderActiveDay() {
    const panel = itineraryEl('itinerary-day-panel');
    if (!panel) return;
    const days = tripDays();
    if (activeItineraryDay > days) activeItineraryDay = days;
    if (activeItineraryDay < 1) activeItineraryDay = 1;
    const dayNumber = activeItineraryDay;
    const day = dayData(dayNumber);
    panel.replaceChildren();

    const section = document.createElement('section');
    section.className = 'itinerary-day';
    section.setAttribute('aria-label', `Day ${dayNumber} itinerary`);

    const head = document.createElement('div');
    head.className = 'itinerary-day-head';
    const heading = document.createElement('div');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'form-control itinerary-day-title';
    titleInput.id = 'itinerary-day-title';
    titleInput.maxLength = itineraryLimits.title;
    titleInput.placeholder = 'e.g. Beach & Nature Day';
    titleInput.value = day.title;
    titleInput.setAttribute('aria-label', `Day ${dayNumber} title`);
    titleInput.addEventListener('input', () => {
      day.title = clampText(titleInput.value, itineraryLimits.title);
      saveItinerary();
    });
    heading.append(itineraryNode('p', `Day ${dayNumber}`, 'itinerary-day-number'), titleInput);
    head.append(heading);
    section.append(head);

    const notesGroup = document.createElement('div');
    notesGroup.className = 'mb-3';
    const notesLabel = document.createElement('label');
    notesLabel.className = 'form-label';
    notesLabel.htmlFor = 'itinerary-day-notes';
    notesLabel.textContent = 'Day notes';
    const notesInput = document.createElement('textarea');
    notesInput.className = 'form-control';
    notesInput.id = 'itinerary-day-notes';
    notesInput.rows = 2;
    notesInput.maxLength = itineraryLimits.dayNotes;
    notesInput.placeholder = 'Add notes for this day...';
    notesInput.value = day.notes;
    notesInput.addEventListener('input', () => {
      day.notes = clampText(notesInput.value, itineraryLimits.dayNotes);
      saveItinerary();
    });
    notesGroup.append(notesLabel, notesInput);
    section.append(notesGroup);

    section.append(itineraryNode('h3', 'Planned Activities', 'itinerary-subhead'));
    if (day.items.length) {
      const list = document.createElement('ol');
      list.className = 'itinerary-list';
      list.id = 'itinerary-items';
      day.items.forEach((item, index) => list.append(renderItineraryItem(item, index, day.items.length)));
      section.append(list);
    } else {
      section.append(buildEmptyDay(dayNumber));
    }

    const addCustom = document.createElement('button');
    addCustom.type = 'button';
    addCustom.className = 'btn btn-outline-secondary btn-sm itinerary-add-custom';
    addCustom.dataset.action = 'add-custom';
    const plus = document.createElement('i');
    plus.className = 'bi bi-plus-lg me-1';
    plus.setAttribute('aria-hidden', 'true');
    addCustom.append(plus, document.createTextNode('Add Custom Activity'));
    section.append(addCustom);
    // Phase 6 integration: optional memory links for this day, if any exist.
    window.perezMemories?.renderDayLinks?.(section, dayNumber);
    panel.append(section);

    if (itineraryUI.focusItem) {
      const { id, action } = itineraryUI.focusItem;
      itineraryUI.focusItem = null;
      const movedCard = [...panel.querySelectorAll('.itinerary-item')].find((node) => node.dataset.itemId === id);
      movedCard?.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true });
    }
  }

  function renderItinerary() {
    renderTripMeta();
    renderJourneySummary();
    renderItinerarySummary();
    renderDayTabs();
    renderActiveDay();
  }
  function refreshItineraryContext() {
    renderTripMeta();
    renderJourneySummary();
  }

  // ===================== Itinerary actions =====================
  function showModal(id) {
    const element = itineraryEl(id);
    if (element && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(element).show();
  }
  function hideModal(id) {
    const element = itineraryEl(id);
    if (element && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(element).hide();
  }
  function showItineraryToast(message) {
    const body = itineraryEl('itinerary-toast-body');
    if (body) body.textContent = message;
    const toast = itineraryEl('itinerary-toast');
    if (toast && window.bootstrap?.Toast) window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 2500 }).show();
    announceItinerary(message);
  }
  function announceItinerary(message) {
    const status = itineraryEl('itinerary-status');
    if (status) status.textContent = message;
  }
  function fillDaySelect(select, selectedDay) {
    if (!select) return;
    const days = tripDays();
    select.replaceChildren();
    for (let n = 1; n <= days; n += 1) {
      const option = document.createElement('option');
      option.value = String(n);
      option.textContent = `Day ${n}`;
      select.append(option);
    }
    select.value = String(Math.min(Math.max(selectedDay || 1, 1), days));
  }

  function addItineraryItem(partial, dayNumber) {
    const item = { id: itineraryUUID(), ...partial };
    dayData(dayNumber).items.push(item);
    newestItineraryItemId = item.id;
    activeItineraryDay = dayNumber;
    saveItinerary();
    renderItinerary();
    showItineraryToast(`Added to Day ${dayNumber}`);
    setTimeout(() => { if (newestItineraryItemId === item.id) newestItineraryItemId = null; }, 800);
  }

  function openAddToItinerary(target) {
    itineraryUI.addTarget = target;
    itineraryEl('add-itinerary-item-name').textContent = itemDisplayName(target);
    fillDaySelect(itineraryEl('add-itinerary-day'), activeItineraryDay);
    itineraryEl('add-itinerary-period').value = 'any';
    itineraryEl('add-itinerary-note').value = '';
    const warning = itineraryEl('add-itinerary-date-warning');
    if (warning) {
      const message = target.type === 'event' ? eventDateWarning(target.refId) : '';
      warning.textContent = message;
      warning.hidden = !message;
    }
    showModal('add-itinerary-modal');
  }
  function confirmAddToItinerary() {
    const target = itineraryUI.addTarget;
    if (!target) return;
    const dayNumber = Number(itineraryEl('add-itinerary-day').value) || activeItineraryDay;
    const selectedPeriod = itineraryEl('add-itinerary-period').value;
    const period = owns(itineraryPeriods, selectedPeriod) ? selectedPeriod : 'any';
    const note = clampText(itineraryEl('add-itinerary-note').value, itineraryLimits.note).trim();
    const candidate = target.type === 'custom'
      ? { type: 'custom', name: target.name, period, note }
      : { type: target.type, refId: target.refId, period, note };
    hideModal('add-itinerary-modal');
    const day = dayData(dayNumber);
    if (day.items.some((item) => sameSource(item, candidate))) {
      itineraryUI.duplicate = { item: candidate, day: dayNumber };
      itineraryEl('duplicate-activity-question').textContent =
        `This is already on Day ${dayNumber}. Add it again?`;
      showModal('duplicate-activity-modal');
      return;
    }
    addItineraryItem(candidate, dayNumber);
  }
  function confirmDuplicate() {
    const pending = itineraryUI.duplicate;
    itineraryUI.duplicate = null;
    hideModal('duplicate-activity-modal');
    if (pending) addItineraryItem(pending.item, pending.day);
  }

  function openCustomActivityModal() {
    itineraryEl('custom-activity-name').value = '';
    itineraryEl('custom-activity-name').classList.remove('is-invalid');
    itineraryEl('custom-activity-note').value = '';
    itineraryEl('custom-activity-period').value = 'any';
    fillDaySelect(itineraryEl('custom-activity-day'), activeItineraryDay);
    showModal('custom-activity-modal');
  }
  function confirmCustomActivity() {
    const nameInput = itineraryEl('custom-activity-name');
    const name = nameInput.value.trim().slice(0, itineraryLimits.name);
    if (!name) {
      nameInput.classList.add('is-invalid');
      nameInput.focus();
      return;
    }
    nameInput.classList.remove('is-invalid');
    const dayNumber = Number(itineraryEl('custom-activity-day').value) || activeItineraryDay;
    const selectedPeriod = itineraryEl('custom-activity-period').value;
    const period = owns(itineraryPeriods, selectedPeriod) ? selectedPeriod : 'any';
    const note = clampText(itineraryEl('custom-activity-note').value, itineraryLimits.note).trim();
    hideModal('custom-activity-modal');
    addItineraryItem({ type: 'custom', name, period, note }, dayNumber);
  }

  function reorderItineraryItem(id, delta) {
    const day = dayData(activeItineraryDay);
    const index = day.items.findIndex((item) => item.id === id);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= day.items.length) return;
    [day.items[index], day.items[next]] = [day.items[next], day.items[index]];
    itineraryUI.focusItem = { id, action: delta < 0 ? 'up' : 'down' };
    saveItinerary();
    renderActiveDay();
    renderItinerarySummary();
    announceItinerary(`${itemDisplayName(day.items[next])} moved to position ${next + 1} of Day ${activeItineraryDay}`);
  }

  function openMoveModal(id) {
    const item = findItineraryItem(id);
    if (!item) return;
    itineraryUI.moving = { id, day: activeItineraryDay };
    itineraryEl('move-activity-question').textContent = `Move "${itemDisplayName(item)}" to:`;
    fillDaySelect(itineraryEl('move-activity-day'), activeItineraryDay);
    showModal('move-activity-modal');
  }
  function confirmMove() {
    const pending = itineraryUI.moving;
    if (!pending) return;
    const targetDay = Number(itineraryEl('move-activity-day').value) || pending.day;
    hideModal('move-activity-modal');
    itineraryUI.moving = null;
    if (targetDay === pending.day) return;
    const source = dayData(pending.day);
    const index = source.items.findIndex((item) => item.id === pending.id);
    if (index < 0) return;
    const [item] = source.items.splice(index, 1);
    dayData(targetDay).items.push(item);
    activeItineraryDay = targetDay;
    saveItinerary();
    renderItinerary();
    showItineraryToast(`Moved to Day ${targetDay}`);
  }

  function openEditModal(id) {
    const item = findItineraryItem(id);
    if (!item) return;
    itineraryUI.editing = { id, day: activeItineraryDay };
    const custom = item.type === 'custom';
    itineraryEl('edit-activity-name-field').hidden = !custom;
    itineraryEl('edit-activity-name').hidden = custom;
    itineraryEl('edit-activity-name').textContent = itemDisplayName(item);
    itineraryEl('edit-activity-custom-name').value = custom ? item.name : '';
    itineraryEl('edit-activity-custom-name').classList.remove('is-invalid');
    itineraryEl('edit-activity-period').value = item.period;
    itineraryEl('edit-activity-note').value = item.note;
    showModal('edit-activity-modal');
  }
  function confirmEdit() {
    const pending = itineraryUI.editing;
    if (!pending) return;
    const item = findItineraryItem(pending.id, pending.day);
    if (!item) { itineraryUI.editing = null; hideModal('edit-activity-modal'); return; }
    if (item.type === 'custom') {
      const nameInput = itineraryEl('edit-activity-custom-name');
      const name = nameInput.value.trim().slice(0, itineraryLimits.name);
      if (!name) {
        nameInput.classList.add('is-invalid');
        nameInput.focus();
        return;
      }
      nameInput.classList.remove('is-invalid');
      item.name = name;
    }
    const period = itineraryEl('edit-activity-period').value;
    item.period = owns(itineraryPeriods, period) ? period : 'any';
    item.note = clampText(itineraryEl('edit-activity-note').value, itineraryLimits.note).trim();
    itineraryUI.editing = null;
    hideModal('edit-activity-modal');
    saveItinerary();
    renderActiveDay();
    renderItinerarySummary();
    showItineraryToast('Itinerary updated');
  }

  function openRemoveModal(id) {
    const item = findItineraryItem(id);
    if (!item) return;
    itineraryUI.removing = { id, day: activeItineraryDay };
    itineraryEl('remove-activity-question').textContent =
      `Remove "${itemDisplayName(item)}" from Day ${activeItineraryDay}?`;
    showModal('remove-activity-modal');
  }
  function confirmRemove() {
    const pending = itineraryUI.removing;
    itineraryUI.removing = null;
    hideModal('remove-activity-modal');
    if (!pending) return;
    const day = dayData(pending.day);
    const index = day.items.findIndex((item) => item.id === pending.id);
    if (index < 0) return;
    const [removed] = day.items.splice(index, 1);
    saveItinerary();
    renderActiveDay();
    renderItinerarySummary();
    showItineraryToast(`Removed "${itemDisplayName(removed)}" from Day ${pending.day}`);
  }

  function clearItinerary() {
    const days = tripDays();
    const fresh = {};
    for (let n = 1; n <= days; n += 1) fresh[n] = emptyDay();
    itineraryState.days = fresh;
    activeItineraryDay = 1;
    hideModal('clear-itinerary-modal');
    saveItinerary();
    renderItinerary();
    showItineraryToast('Itinerary cleared');
  }

  // ===================== Phase 4 wiring =====================
  function initItinerarySources() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest?.('[data-itinerary-add]');
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      let type = trigger.dataset.itineraryAdd;
      let refId = trigger.dataset.refId || null;
      if (type === 'experience' && !refId) refId = itineraryUI.experienceId;
      if (!validItineraryRef(type, refId)) return;
      // Close whichever source modal is open (experience or event) before the
      // shared Add to Your Trip modal appears.
      const openModal = trigger.closest('.modal.show');
      if (openModal && window.bootstrap?.Modal) {
        const instance = window.bootstrap.Modal.getOrCreateInstance(openModal);
        openModal.addEventListener('hidden.bs.modal', () => openAddToItinerary({ type, refId }), { once: true });
        instance.hide();
        return;
      }
      openAddToItinerary({ type, refId });
    });
    document.querySelectorAll('[data-experience]').forEach((card) => {
      card.addEventListener('click', () => { itineraryUI.experienceId = card.dataset.experience; });
    });
  }

  function initItinerary() {
    const section = itineraryEl('itinerary');
    if (!section) return;
    loadItinerary();
    // Startup reconciliation never deletes data: extra stored days are merged.
    const days = tripDays();
    occupiedDaysAbove(days).slice().reverse().forEach((n) => mergeDayInto(n, Math.max(1, days)));
    dayKeys().filter((n) => n > days).forEach((n) => { delete itineraryState.days[n]; });
    ensureItineraryDays(days);
    saveItinerary();

    const panel = itineraryEl('itinerary-day-panel');
    panel?.addEventListener('click', (event) => {
      const control = event.target.closest('[data-action]');
      if (!control || !panel.contains(control)) return;
      const action = control.dataset.action;
      if (action === 'add-custom') { openCustomActivityModal(); return; }
      const itemCard = control.closest('.itinerary-item');
      const itemId = itemCard?.dataset.itemId;
      if (!itemId) return;
      if (action === 'up') reorderItineraryItem(itemId, -1);
      else if (action === 'down') reorderItineraryItem(itemId, 1);
      else if (action === 'move') openMoveModal(itemId);
      else if (action === 'edit') openEditModal(itemId);
      else if (action === 'remove') openRemoveModal(itemId);
      else if (action === 'view-event') {
        const item = findItineraryItem(itemId);
        if (item?.type === 'event') openEventDetails(item.refId, control);
      }
    });

    itineraryEl('add-itinerary-confirm')?.addEventListener('click', confirmAddToItinerary);
    itineraryEl('duplicate-activity-confirm')?.addEventListener('click', confirmDuplicate);
    itineraryEl('custom-activity-confirm')?.addEventListener('click', confirmCustomActivity);
    itineraryEl('custom-activity-name')?.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));
    itineraryEl('move-activity-confirm')?.addEventListener('click', confirmMove);
    itineraryEl('edit-activity-confirm')?.addEventListener('click', confirmEdit);
    itineraryEl('remove-activity-confirm')?.addEventListener('click', confirmRemove);
    itineraryEl('reduce-days-move')?.addEventListener('click', reduceDaysMove);
    itineraryEl('reduce-days-remove')?.addEventListener('click', reduceDaysRemove);
    itineraryEl('reduce-days-cancel')?.addEventListener('click', reduceDaysCancel);
    itineraryEl('clear-itinerary-confirm')?.addEventListener('click', clearItinerary);

    const planner = itineraryEl('trip-planner');
    planner?.addEventListener('change', (event) => {
      if (event.target.id === 'planner-days') applyPlannerDays();
      refreshItineraryContext();
    });
    planner?.addEventListener('input', refreshItineraryContext);
    itineraryEl('confirm-reset-trip')?.addEventListener('click', () => {
      applyPlannerDays();
      refreshItineraryContext();
    });

    initItinerarySources();
    renderItinerary();
  }

  // ===================== PHASE 6 - PHOTO GALLERY + TRAVEL MEMORIES =====================
  // Public photos stay in the markup. Personal photos are compressed in the
  // browser and stored as Blobs in IndexedDB; nothing is ever uploaded.

  const MEMORY_DB_NAME = 'PerezTourismDB';
  const MEMORY_DB_VERSION = 1;
  const MEMORY_STORE = 'memories';
  const MEMORY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MEMORY_MAX_BYTES = 10 * 1024 * 1024;
  const MEMORY_MAX_EDGE = 1920;
  const MEMORY_THUMB_EDGE = 640;
  const MEMORY_JPEG_QUALITY = 0.85;
  const MEMORY_THUMB_QUALITY = 0.82;
  const MEMORY_TEXT_LIMITS = { caption: 100, notes: 500 };
  const MEMORY_MESSAGES = {
    required: 'Please choose a photo before saving this memory.',
    type: 'Please choose a JPEG, PNG, or WebP image.',
    size: 'This photo is too large. Please choose an image smaller than 10 MB.',
    caption: 'Caption must be 100 characters or fewer.',
    notes: 'Notes must be 500 characters or fewer.',
    unavailable: 'Local photo storage is not available in this browser.',
    saveFailed: "We couldn't save this memory on this device. Browser storage may be full or unavailable.",
    saved: 'Memory saved',
    deleted: 'Memory deleted',
    cleared: 'All travel memories deleted',
  };

  const memoryState = {
    db: null,
    available: false,
    records: [],
    filter: { kind: 'all' },
    sort: 'newest',
    editingId: null,
    detailsId: null,
    pendingDeleteId: null,
    saving: false,
    reducePending: false,
    persistRequested: false,
    viewerIndex: 0,
    urls: new Map(),
  };

  const memoryEl = (id) => document.getElementById(id);

  // ---------- Object URL bookkeeping ----------
  // Every created URL is tracked so it can be revoked on re-render, modal
  // close, delete, or photo change.
  function memoryCreateUrl(key, blob) {
    memoryRevokeUrl(key);
    if (!blob || typeof URL.createObjectURL !== 'function') return '';
    const url = URL.createObjectURL(blob);
    memoryState.urls.set(key, url);
    return url;
  }
  function memoryRevokeUrl(key) {
    const url = memoryState.urls.get(key);
    if (!url) return;
    memoryState.urls.delete(key);
    if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
  }
  function memoryRevokeWhere(match) {
    [...memoryState.urls.keys()].filter(match).forEach(memoryRevokeUrl);
  }
  function memoryRevokeAllUrls() {
    [...memoryState.urls.keys()].forEach(memoryRevokeUrl);
  }

  // ---------- IndexedDB database layer ----------
  function openMemoryDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) {
        reject(new Error(MEMORY_MESSAGES.unavailable));
        return;
      }
      let request;
      try {
        request = window.indexedDB.open(MEMORY_DB_NAME, MEMORY_DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEMORY_STORE)) {
          db.createObjectStore(MEMORY_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error(MEMORY_MESSAGES.unavailable));
      request.onblocked = () => reject(new Error(MEMORY_MESSAGES.unavailable));
    });
  }
  function memoryStore(mode, run) {
    if (!memoryState.db) return Promise.reject(new Error(MEMORY_MESSAGES.unavailable));
    return new Promise((resolve, reject) => {
      let request;
      try {
        const transaction = memoryState.db.transaction(MEMORY_STORE, mode);
        request = run(transaction.objectStore(MEMORY_STORE));
      } catch (error) {
        reject(error);
        return;
      }
      if (!request) {
        reject(new Error('Local photo storage request failed.'));
        return;
      }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Local photo storage request failed.'));
    });
  }
  const addMemory = (record) => memoryStore('readwrite', (store) => store.put(record));
  const updateMemory = (record) => memoryStore('readwrite', (store) => store.put(record));
  const deleteMemory = (id) => memoryStore('readwrite', (store) => store.delete(id));
  const getMemory = (id) => memoryStore('readonly', (store) => store.get(id));
  const getAllMemories = () => memoryStore('readonly', (store) => store.getAll());
  const clearMemories = () => memoryStore('readwrite', (store) => store.clear());

  function memoryCreateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `memory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // ---------- Image validation, compression, thumbnails ----------
  function validateImage(file) {
    if (!file) return { ok: false, message: MEMORY_MESSAGES.required };
    if (!MEMORY_IMAGE_TYPES.includes(file.type)) return { ok: false, message: MEMORY_MESSAGES.type };
    if (file.size > MEMORY_MAX_BYTES) return { ok: false, message: MEMORY_MESSAGES.size };
    return { ok: true };
  }
  async function decodeImage(input) {
    if (typeof window.createImageBitmap === 'function') {
      try {
        const bitmap = await window.createImageBitmap(input, { imageOrientation: 'from-image' });
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release: () => { if (typeof bitmap.close === 'function') bitmap.close(); },
        };
      } catch (error) {
        // Fall through to the image element decoder.
      }
    }
    const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(input) : '';
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('The photo could not be read.'));
        element.src = url;
      });
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => { if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url); },
      };
    } catch (error) {
      if (url && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
      throw error;
    }
  }
  async function drawCompressed(source, width, height, edge, quality) {
    if (!width || !height) throw new Error('The photo could not be read.');
    const scale = Math.min(1, edge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas drawing is not supported in this browser.');
    // A neutral background keeps transparent PNG/WebP photos readable after
    // they are compressed to JPEG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(source, 0, 0, targetWidth, targetHeight);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, width: targetWidth, height: targetHeight });
        else reject(new Error('The photo could not be compressed.'));
      }, 'image/jpeg', quality);
    });
  }
  async function compressImage(file, edge, quality) {
    const decoded = await decodeImage(file);
    try {
      return await drawCompressed(decoded.source, decoded.width, decoded.height, edge, quality);
    } finally {
      decoded.release();
    }
  }
  const processImage = (file) => compressImage(file, MEMORY_MAX_EDGE, MEMORY_JPEG_QUALITY);
  async function createThumbnail(imageBlob) {
    const thumb = await compressImage(imageBlob, MEMORY_THUMB_EDGE, MEMORY_THUMB_QUALITY);
    return thumb.blob;
  }

  // ---------- Small formatting helpers ----------
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function formatMemoryDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function setMemoryFieldError(inputId, errorId, message) {
    const input = memoryEl(inputId);
    const error = memoryEl(errorId);
    if (input) input.classList.toggle('is-invalid', Boolean(message));
    if (error) error.textContent = message || '';
  }
  function clearMemoryFormErrors() {
    setMemoryFieldError('memory-photo', 'memory-photo-error', '');
    setMemoryFieldError('memory-caption', 'memory-caption-error', '');
    setMemoryFieldError('memory-notes', 'memory-notes-error', '');
    hideMemorySaveError();
  }
  function showMemorySaveError(message) {
    const alert = memoryEl('memory-save-error');
    if (!alert) return;
    alert.textContent = message;
    alert.hidden = false;
  }
  function hideMemorySaveError() {
    const alert = memoryEl('memory-save-error');
    if (!alert) return;
    alert.textContent = '';
    alert.hidden = true;
  }
  function showModalError(modalId, message) {
    const body = document.querySelector(`#${modalId} .modal-body`);
    if (!body) return;
    let alert = body.querySelector('.modal-error-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'alert alert-danger mt-3 mb-0 modal-error-alert';
      alert.setAttribute('role', 'alert');
      body.append(alert);
    }
    alert.textContent = message;
    alert.hidden = false;
  }
  function hideModalError(modalId) {
    const alert = document.querySelector(`#${modalId} .modal-error-alert`);
    if (alert) alert.hidden = true;
  }
  function announceMemory(message) {
    const status = memoryEl('memory-status');
    if (status) status.textContent = message;
  }
  function toastMemory(message) {
    const body = memoryEl('memory-toast-body');
    if (body) body.textContent = message;
    const toast = memoryEl('memory-toast');
    if (toast && window.bootstrap?.Toast) {
      window.bootstrap.Toast.getOrCreateInstance(toast, { delay: 2500 }).show();
    }
    announceMemory(message);
  }

  // ---------- Related content (references only; names are never stored) ----------
  function memoryRelatedOptions(type) {
    if (type === 'destination') {
      return destinationLocations.filter((item) => item.name).map((item) => ({ id: item.id, name: item.name }));
    }
    if (type === 'experience') {
      return experiences.filter((item) => item.title).map((item) => ({ id: item.id, name: item.title }));
    }
    if (type === 'event') {
      return eventsData.filter((item) => item.name).map((item) => ({ id: item.id, name: item.name }));
    }
    return [];
  }
  function resolveRelatedContent(type, id) {
    if (!type || !id) return null;
    const match = memoryRelatedOptions(type).find((item) => item.id === id);
    return match ? { type, id, name: match.name } : { type, id, name: '' };
  }
  function getItineraryDays() {
    const days = tripDays();
    const list = [];
    for (let n = 1; n <= days; n += 1) list.push(n);
    return list;
  }

  // ---------- Memory form ----------
  function fillMemoryDayOptions(selected) {
    const select = memoryEl('memory-day');
    if (!select) return;
    select.replaceChildren();
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'None';
    select.append(none);
    getItineraryDays().forEach((n) => {
      const option = document.createElement('option');
      option.value = String(n);
      option.textContent = `Day ${n}`;
      select.append(option);
    });
    select.value = selected == null ? '' : String(selected);
    if (select.selectedIndex < 0) select.selectedIndex = 0;
  }
  function fillMemoryRelatedOptions(selected) {
    const groups = {
      destination: 'memory-related-destinations',
      experience: 'memory-related-experiences',
      event: 'memory-related-events',
    };
    Object.entries(groups).forEach(([type, id]) => {
      const group = memoryEl(id);
      if (!group) return;
      group.replaceChildren();
      memoryRelatedOptions(type).forEach((item) => {
        const option = document.createElement('option');
        option.value = `${type}:${item.id}`;
        option.textContent = item.name;
        group.append(option);
      });
      group.hidden = group.children.length === 0;
    });
    const select = memoryEl('memory-related');
    if (!select) return;
    select.value = selected || '';
    if (select.selectedIndex < 0) select.selectedIndex = 0;
  }
  function showMemoryPreview(blob, options = {}) {
    const preview = memoryEl('memory-preview');
    if (!preview || !blob) return;
    const url = memoryCreateUrl('preview', blob);
    const image = memoryEl('memory-preview-image');
    if (image) {
      image.src = url;
      image.alt = options.isCurrent ? 'Current memory photo' : 'Selected photo preview';
    }
    const name = memoryEl('memory-preview-name');
    if (name) name.textContent = options.isCurrent ? 'Current photo' : (options.name || 'Selected photo');
    const size = memoryEl('memory-preview-size');
    if (size) size.textContent = formatBytes(blob.size);
    const photo = memoryEl('memory-photo');
    if (photo) photo.hidden = true;
    preview.hidden = false;
  }
  function hideMemoryPreview() {
    memoryRevokeUrl('preview');
    const preview = memoryEl('memory-preview');
    if (preview) preview.hidden = true;
    const photo = memoryEl('memory-photo');
    if (photo) photo.hidden = false;
  }
  function resetMemoryForm() {
    const photo = memoryEl('memory-photo');
    if (photo) {
      photo.value = '';
      photo.hidden = false;
      photo.classList.remove('is-invalid');
    }
    const caption = memoryEl('memory-caption');
    if (caption) caption.value = '';
    const notes = memoryEl('memory-notes');
    if (notes) notes.value = '';
    hideMemoryPreview();
    clearMemoryFormErrors();
    const save = memoryEl('memory-save');
    if (save) {
      save.disabled = false;
      save.textContent = 'Save Memory';
    }
  }
  function setMemorySaveBusy(busy) {
    const button = memoryEl('memory-save');
    if (!button) return;
    button.disabled = busy;
    if (busy) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner-border spinner-border-sm me-1';
      spinner.setAttribute('role', 'status');
      spinner.setAttribute('aria-hidden', 'true');
      button.replaceChildren(spinner, document.createTextNode('Saving...'));
    } else {
      button.textContent = memoryState.editingId ? 'Save Changes' : 'Save Memory';
    }
  }

  // ---------- Memory modal flows ----------
  function openAddMemoryModal(prefill = {}) {
    if (!memoryState.available) return;
    memoryState.editingId = null;
    resetMemoryForm();
    const title = memoryEl('add-memory-title');
    if (title) title.textContent = 'Add Travel Memory';
    fillMemoryDayOptions(prefill.itineraryDay ?? null);
    fillMemoryRelatedOptions(prefill.relatedType && prefill.relatedId ? `${prefill.relatedType}:${prefill.relatedId}` : '');
    showModal('add-memory-modal');
  }
  function openEditMemory(id) {
    if (!memoryState.available) return;
    const record = memoryState.records.find((item) => item.id === id);
    if (!record) return;
    memoryState.editingId = id;
    resetMemoryForm();
    const title = memoryEl('add-memory-title');
    if (title) title.textContent = 'Edit Travel Memory';
    const saveButton = memoryEl('memory-save');
    if (saveButton) saveButton.textContent = 'Save Changes';
    fillMemoryDayOptions(record.itineraryDay);
    fillMemoryRelatedOptions(record.relatedType && record.relatedId ? `${record.relatedType}:${record.relatedId}` : '');
    const caption = memoryEl('memory-caption');
    if (caption) caption.value = record.caption || '';
    const notes = memoryEl('memory-notes');
    if (notes) notes.value = record.notes || '';
    showMemoryPreview(record.imageBlob, { isCurrent: true });
    showModal('add-memory-modal');
  }
  function openMemoryViewer(id) {
    const record = memoryState.records.find((item) => item.id === id);
    if (!record) return;
    memoryState.detailsId = id;
    hideModalError('memory-details-modal');
    const captionText = (record.caption || '').trim();
    const image = memoryEl('memory-details-image');
    if (image) {
      image.src = memoryCreateUrl('details', record.imageBlob);
      image.alt = captionText ? captionText : 'Travel memory photo';
    }
    const caption = memoryEl('memory-details-caption');
    if (caption) {
      caption.textContent = captionText;
      caption.hidden = !captionText;
    }
    const notes = memoryEl('memory-details-notes');
    const notesLabel = memoryEl('memory-details-notes-label');
    if (notes) {
      notes.textContent = record.notes || '';
      notes.hidden = !record.notes;
    }
    if (notesLabel) notesLabel.hidden = !record.notes;
    const day = memoryEl('memory-details-day');
    if (day) day.textContent = record.itineraryDay == null ? 'Unassigned' : `Day ${record.itineraryDay}`;
    const related = memoryEl('memory-details-related');
    const relatedLabel = memoryEl('memory-details-related-label');
    const resolved = resolveRelatedContent(record.relatedType, record.relatedId);
    if (related) {
      related.textContent = resolved ? (resolved.name || 'Related place unavailable') : '';
      related.hidden = !resolved;
    }
    if (relatedLabel) relatedLabel.hidden = !resolved;
    const date = memoryEl('memory-details-date');
    if (date) date.textContent = `Saved on ${formatMemoryDate(record.createdAt)}`;
    showModal('memory-details-modal');
  }
  function deleteMemoryWithConfirmation(id) {
    if (!memoryState.available || !id) return;
    memoryState.pendingDeleteId = id;
    hideModalError('delete-memory-modal');
    const details = memoryEl('memory-details-modal');
    if (details?.classList.contains('show')) {
      hideModal('memory-details-modal');
      details.addEventListener('hidden.bs.modal', () => showModal('delete-memory-modal'), { once: true });
    } else {
      showModal('delete-memory-modal');
    }
  }
  async function confirmDeleteMemory() {
    const id = memoryState.pendingDeleteId;
    if (!id || !memoryState.available) return;
    try {
      await deleteMemory(id);
      memoryState.pendingDeleteId = null;
      memoryRevokeWhere((key) => key === `grid:${id}` || key === `details:${id}`);
      hideModal('delete-memory-modal');
      if (memoryState.detailsId === id) hideModal('memory-details-modal');
      toastMemory(MEMORY_MESSAGES.deleted);
      await refreshMemories();
      updateMemoryUsage();
    } catch (error) {
      showModalError('delete-memory-modal', MEMORY_MESSAGES.saveFailed);
    }
  }
  async function confirmClearMemories() {
    if (!memoryState.available) return;
    try {
      await clearMemories();
      memoryRevokeAllUrls();
      memoryState.records = [];
      hideModal('clear-memories-modal');
      toastMemory(MEMORY_MESSAGES.cleared);
      renderMemories();
      syncVisibleDayLinks();
      updateMemoryUsage();
    } catch (error) {
      showModalError('clear-memories-modal', MEMORY_MESSAGES.saveFailed);
    }
  }
  function handlePhotoSelection() {
    const input = memoryEl('memory-photo');
    const file = input?.files?.[0] || null;
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.ok) {
      setMemoryFieldError('memory-photo', 'memory-photo-error', validation.message);
      hideMemoryPreview();
      try {
        input.value = '';
      } catch (error) {
        // Some browsers block clearing; the message still shows.
      }
      return;
    }
    setMemoryFieldError('memory-photo', 'memory-photo-error', '');
    showMemoryPreview(file, { name: file.name });
  }
  async function handleMemorySave() {
    if (memoryState.saving) return;
    const photoInput = memoryEl('memory-photo');
    const file = photoInput?.files?.[0] || null;
    const isEdit = Boolean(memoryState.editingId);
    const existing = isEdit ? memoryState.records.find((item) => item.id === memoryState.editingId) : null;
    if (isEdit && !existing) {
      showMemorySaveError(MEMORY_MESSAGES.saveFailed);
      return;
    }
    if (!isEdit || file) {
      const validation = validateImage(file);
      if (!validation.ok) {
        setMemoryFieldError('memory-photo', 'memory-photo-error', validation.message);
        photoInput?.focus();
        return;
      }
    }
    const caption = (memoryEl('memory-caption')?.value || '').trim();
    const notes = (memoryEl('memory-notes')?.value || '').trim();
    if (caption.length > MEMORY_TEXT_LIMITS.caption) {
      setMemoryFieldError('memory-caption', 'memory-caption-error', MEMORY_MESSAGES.caption);
      memoryEl('memory-caption')?.focus();
      return;
    }
    if (notes.length > MEMORY_TEXT_LIMITS.notes) {
      setMemoryFieldError('memory-notes', 'memory-notes-error', MEMORY_MESSAGES.notes);
      memoryEl('memory-notes')?.focus();
      return;
    }

    memoryState.saving = true;
    setMemorySaveBusy(true);
    hideMemorySaveError();
    try {
      let imageBlob = existing?.imageBlob || null;
      let thumbnailBlob = existing?.thumbnailBlob || null;
      if (!isEdit || file) {
        const compressed = await processImage(file);
        imageBlob = compressed.blob;
        thumbnailBlob = await createThumbnail(compressed.blob);
      }
      const dayValue = memoryEl('memory-day')?.value || '';
      const relatedValue = memoryEl('memory-related')?.value || '';
      const [relatedType, relatedId] = relatedValue ? relatedValue.split(':') : [null, null];
      const now = new Date().toISOString();
      const record = {
        id: existing?.id || memoryCreateId(),
        imageBlob,
        thumbnailBlob,
        caption,
        notes,
        itineraryDay: dayValue ? Number(dayValue) : null,
        relatedType: relatedType || null,
        relatedId: relatedId || null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      if (existing) await updateMemory(record);
      else await addMemory(record);
      toastMemory(MEMORY_MESSAGES.saved);
      hideModal('add-memory-modal');
      await refreshMemories();
      requestPersistentStorage();
      updateMemoryUsage();
    } catch (error) {
      showMemorySaveError(MEMORY_MESSAGES.saveFailed);
    } finally {
      memoryState.saving = false;
      setMemorySaveBusy(false);
    }
  }

  // ---------- Rendering ----------
  function updateMemoryCount() {
    const count = memoryState.records.length;
    const element = memoryEl('memory-count');
    if (element) element.textContent = `${count} ${count === 1 ? 'Memory' : 'Memories'}`;
  }
  function memoryFilterMatches(record) {
    const filter = memoryState.filter;
    if (filter.kind === 'day') return (record.itineraryDay ?? null) === filter.day;
    if (filter.kind === 'related') return record.relatedType === filter.relatedType;
    return true;
  }
  function memoryFilterIsActive(chip) {
    const filter = memoryState.filter;
    if (chip.kind !== filter.kind) return false;
    if (chip.kind === 'day') return (chip.day ?? null) === (filter.day ?? null);
    if (chip.kind === 'related') return chip.relatedType === filter.relatedType;
    return true;
  }
  function buildMemoryFilterChips() {
    const records = memoryState.records;
    const chips = [{ kind: 'all', label: 'All Memories' }];
    const days = [...new Set(records.map((record) => record.itineraryDay).filter((day) => day != null))]
      .sort((a, b) => a - b);
    days.forEach((day) => chips.push({ kind: 'day', day, label: `Day ${day}` }));
    if (records.some((record) => record.itineraryDay == null)) {
      chips.push({ kind: 'day', day: null, label: 'Unassigned' });
    }
    [['destination', 'Destinations'], ['experience', 'Experiences'], ['event', 'Events']].forEach(([type, label]) => {
      if (records.some((record) => record.relatedType === type)) chips.push({ kind: 'related', relatedType: type, label });
    });
    if (!chips.some((chip) => memoryFilterIsActive(chip))) memoryState.filter = { kind: 'all' };
    return chips;
  }
  function renderMemoryFilters() {
    const container = memoryEl('memory-filters');
    if (!container) return;
    const chips = buildMemoryFilterChips();
    container.replaceChildren();
    chips.forEach((chip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-btn' + (memoryFilterIsActive(chip) ? ' active' : '');
      button.dataset.memoryFilter = chip.kind;
      if (chip.kind === 'day') button.dataset.memoryFilterDay = chip.day == null ? '' : String(chip.day);
      if (chip.kind === 'related') button.dataset.memoryFilterRelated = chip.relatedType;
      if (chip.kind !== 'all') {
        const groupName = chip.kind === 'day' ? 'day' : chip.relatedType;
        button.setAttribute('aria-label', `Show ${chip.label} memories (${groupName} filter)`);
      }
      button.textContent = chip.label;
      container.append(button);
    });
  }
  function memorySortedRecords() {
    const direction = memoryState.sort === 'oldest' ? 1 : -1;
    return memoryState.records
      .filter(memoryFilterMatches)
      .sort((a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction);
  }
  function buildMemoryCard(record) {
    const column = document.createElement('div');
    column.className = 'col-6 col-md-4 col-lg-3';
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'memory-card';
    card.dataset.memoryId = record.id;
    const captionText = (record.caption || '').trim();
    card.setAttribute('aria-label', captionText ? `Open memory: ${captionText}` : 'Open travel memory photo');
    const image = document.createElement('img');
    image.className = 'memory-card-image';
    image.src = memoryCreateUrl(`grid:${record.id}`, record.thumbnailBlob);
    image.alt = captionText ? captionText : 'Travel memory photo';
    image.loading = 'lazy';
    card.append(image);
    const body = document.createElement('span');
    body.className = 'memory-card-body';
    const badges = document.createElement('span');
    badges.className = 'memory-card-badges';
    const dayBadge = document.createElement('span');
    dayBadge.className = 'memory-badge memory-day-badge';
    dayBadge.textContent = record.itineraryDay == null ? 'Unassigned' : `Day ${record.itineraryDay}`;
    badges.append(dayBadge);
    const resolved = resolveRelatedContent(record.relatedType, record.relatedId);
    if (resolved && resolved.name) {
      const relatedBadge = document.createElement('span');
      relatedBadge.className = 'memory-badge memory-related-badge';
      relatedBadge.textContent = resolved.name;
      badges.append(relatedBadge);
    }
    body.append(badges);
    if (captionText) {
      const caption = document.createElement('span');
      caption.className = 'memory-card-caption';
      caption.textContent = captionText;
      body.append(caption);
    }
    const saved = document.createElement('span');
    saved.className = 'memory-card-date';
    saved.textContent = `Saved on ${formatMemoryDate(record.createdAt)}`;
    body.append(saved);
    card.append(body);
    column.append(card);
    return column;
  }
  function renderMemories() {
    const grid = memoryEl('memory-grid');
    if (!grid) return;
    memoryRevokeWhere((key) => key.startsWith('grid:'));
    grid.replaceChildren();
    updateMemoryCount();
    renderMemoryFilters();
    const records = memoryState.records;
    const visible = memorySortedRecords();
    const emptyState = memoryEl('memory-empty');
    if (emptyState) emptyState.hidden = records.length > 0;
    const filterEmpty = memoryEl('memory-filter-empty');
    if (filterEmpty) filterEmpty.hidden = !(records.length > 0 && visible.length === 0);
    visible.forEach((record) => grid.append(buildMemoryCard(record)));
    const status = memoryEl('memory-filter-status');
    if (status) {
      status.textContent = records.length
        ? `${visible.length} of ${records.length} ${records.length === 1 ? 'memory' : 'memories'} shown.`
        : 'No travel memories yet.';
    }
  }
  function setMemoryFilter(filter) {
    memoryState.filter = filter;
    renderMemories();
  }
  function setMemoryFilterFromButton(button) {
    const kind = button.dataset.memoryFilter;
    if (kind === 'day') {
      const raw = button.dataset.memoryFilterDay;
      setMemoryFilter({ kind: 'day', day: raw === '' ? null : Number(raw) });
    } else if (kind === 'related') {
      setMemoryFilter({ kind: 'related', relatedType: button.dataset.memoryFilterRelated });
    } else {
      setMemoryFilter({ kind: 'all' });
    }
  }
  function activateMemoriesForDay(day) {
    const tab = memoryEl('gallery-memories-tab');
    if (tab && window.bootstrap?.Tab) window.bootstrap.Tab.getOrCreateInstance(tab).show();
    const hasDay = memoryState.records.some((record) => record.itineraryDay === day);
    setMemoryFilter(hasDay ? { kind: 'day', day } : { kind: 'all' });
  }

  // ---------- Itinerary day links (Phase 4 integration) ----------
  function renderDayLinks(section, dayNumber) {
    if (!section) return;
    section.dataset.dayNumber = String(dayNumber);
    const existing = section.querySelector('.itinerary-memory-links');
    existing?.remove();
    if (!memoryState.available) return;
    const count = memoryState.records.filter((record) => record.itineraryDay === dayNumber).length;
    const populated = Boolean(section.querySelector('.itinerary-list'));
    if (!count && !populated) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'itinerary-memory-links';
    if (count > 0) {
      const link = document.createElement('a');
      link.href = '#gallery';
      link.className = 'itinerary-memory-link';
      link.dataset.memoryDayLink = String(dayNumber);
      link.textContent = `View ${count} ${count === 1 ? 'memory' : 'memories'} from Day ${dayNumber}`;
      wrapper.append(link);
    }
    if (populated) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-sm btn-outline-secondary itinerary-add-memory';
      button.dataset.memoryDayAdd = String(dayNumber);
      const icon = document.createElement('i');
      icon.className = 'bi bi-camera me-1';
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon, document.createTextNode(`Add Memory for Day ${dayNumber}`));
      wrapper.append(button);
    }
    if (wrapper.children.length) section.append(wrapper);
  }
  function syncVisibleDayLinks() {
    document.querySelectorAll('.itinerary-day[data-day-number]').forEach((section) => {
      renderDayLinks(section, Number(section.dataset.dayNumber));
    });
  }

  // ---------- Trip day reconciliation and refresh ----------
  function handleReducedTripDays() {
    if (!memoryState.available) return Promise.resolve(false);
    const days = tripDays();
    const stale = memoryState.records.filter((record) => record.itineraryDay != null && record.itineraryDay > days);
    if (!stale.length) return Promise.resolve(false);
    const now = new Date().toISOString();
    return Promise.all(
      stale.map((record) => updateMemory({ ...record, itineraryDay: null, updatedAt: now })
        .then(() => { record.itineraryDay = null; })),
    ).then(() => true).catch(() => false);
  }
  async function refreshMemories() {
    if (memoryState.available && memoryState.db) {
      try {
        const records = await getAllMemories();
        if (Array.isArray(records)) memoryState.records = records;
      } catch (error) {
        // Keep showing whatever is already loaded if a read fails.
      }
    }
    await handleReducedTripDays();
    renderMemories();
    syncVisibleDayLinks();
    updateMemoryUsage();
  }
  async function updateMemoryUsage() {
    const usage = memoryEl('memory-usage');
    if (!usage) return;
    if (!memoryState.available || !navigator.storage?.estimate) {
      usage.hidden = true;
      return;
    }
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate && typeof estimate.usage === 'number') {
        usage.textContent = `Local storage used: approximately ${(estimate.usage / (1024 * 1024)).toFixed(1)} MB.`;
        usage.hidden = false;
      } else {
        usage.hidden = true;
      }
    } catch (error) {
      usage.hidden = true;
    }
  }
  async function requestPersistentStorage() {
    if (memoryState.persistRequested || !navigator.storage?.persist) return;
    memoryState.persistRequested = true;
    try {
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      if (!persisted) await navigator.storage.persist();
    } catch (error) {
      // Persistence is optional; never block saving on it.
    }
  }
  function setMemoryStorageUnavailable() {
    memoryState.available = false;
    memoryState.db = null;
    memoryState.records = [];
    const alert = memoryEl('memory-unavailable');
    if (alert) alert.hidden = false;
    ['memory-add-button', 'memory-empty-add', 'memory-clear-button'].forEach((id) => {
      const element = memoryEl(id);
      if (element) element.disabled = true;
    });
    announceMemory(MEMORY_MESSAGES.unavailable);
  }

  // ---------- Public gallery photo viewer ----------
  function galleryPhotos() {
    return [...document.querySelectorAll('#gallery-explore-pane .gallery-item')].map((item) => {
      const image = item.querySelector('img');
      return {
        src: image?.getAttribute('src') || '',
        alt: image?.getAttribute('alt') || '',
      };
    });
  }
  function showGalleryPhoto(index) {
    const photos = galleryPhotos();
    if (!photos.length) return;
    const total = photos.length;
    memoryState.viewerIndex = ((index % total) + total) % total;
    const photo = photos[memoryState.viewerIndex];
    const image = memoryEl('photo-viewer-image');
    if (image) {
      image.src = photo.src;
      image.alt = photo.alt;
    }
    const caption = memoryEl('photo-viewer-caption');
    if (caption) caption.textContent = photo.alt;
    const counter = memoryEl('photo-viewer-counter');
    if (counter) counter.textContent = `Photo ${memoryState.viewerIndex + 1} of ${total}`;
  }
  function stepGallery(delta) {
    showGalleryPhoto(memoryState.viewerIndex + delta);
  }
  function initGalleryViewer() {
    const modal = memoryEl('photo-viewer-modal');
    if (!modal) return;
    modal.addEventListener('show.bs.modal', (event) => {
      const trigger = event.relatedTarget;
      const index = Number(trigger?.dataset?.galleryIndex);
      showGalleryPhoto(Number.isInteger(index) ? index : 0);
    });
    memoryEl('photo-viewer-prev')?.addEventListener('click', () => stepGallery(-1));
    memoryEl('photo-viewer-next')?.addEventListener('click', () => stepGallery(1));
    document.addEventListener('keydown', (event) => {
      const viewer = memoryEl('photo-viewer-modal');
      if (!viewer?.classList.contains('show')) return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepGallery(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepGallery(1);
      }
    });
  }

  // ---------- Initialization ----------
  function initMemories() {
    if (!memoryEl('gallery')) return;

    memoryEl('memory-photo')?.addEventListener('change', handlePhotoSelection);
    memoryEl('memory-change-photo')?.addEventListener('click', () => memoryEl('memory-photo')?.click());
    memoryEl('memory-caption')?.addEventListener('input', () => setMemoryFieldError('memory-caption', 'memory-caption-error', ''));
    memoryEl('memory-notes')?.addEventListener('input', () => setMemoryFieldError('memory-notes', 'memory-notes-error', ''));
    memoryEl('memory-save')?.addEventListener('click', handleMemorySave);
    memoryEl('memory-add-button')?.addEventListener('click', () => openAddMemoryModal());
    memoryEl('memory-empty-add')?.addEventListener('click', () => openAddMemoryModal());
    memoryEl('memory-clear-button')?.addEventListener('click', () => {
      hideModalError('clear-memories-modal');
      showModal('clear-memories-modal');
    });
    memoryEl('memory-clear-confirm')?.addEventListener('click', confirmClearMemories);
    memoryEl('memory-delete-confirm')?.addEventListener('click', confirmDeleteMemory);
    memoryEl('memory-details-edit')?.addEventListener('click', () => {
      const id = memoryState.detailsId;
      const details = memoryEl('memory-details-modal');
      if (!details || !id) return;
      hideModal('memory-details-modal');
      details.addEventListener('hidden.bs.modal', () => openEditMemory(id), { once: true });
    });
    memoryEl('memory-details-delete')?.addEventListener('click', () => deleteMemoryWithConfirmation(memoryState.detailsId));
    memoryEl('memory-details-modal')?.addEventListener('hidden.bs.modal', () => {
      memoryRevokeUrl('details');
      memoryState.detailsId = null;
    });
    memoryEl('add-memory-modal')?.addEventListener('hidden.bs.modal', () => {
      memoryState.editingId = null;
      resetMemoryForm();
    });
    memoryEl('delete-memory-modal')?.addEventListener('hidden.bs.modal', () => {
      memoryState.pendingDeleteId = null;
      hideModalError('delete-memory-modal');
    });
    memoryEl('clear-memories-modal')?.addEventListener('hidden.bs.modal', () => hideModalError('clear-memories-modal'));
    memoryEl('memory-sort')?.addEventListener('change', (event) => {
      memoryState.sort = event.target.value === 'oldest' ? 'oldest' : 'newest';
      renderMemories();
    });
    memoryEl('gallery-memories-tab')?.addEventListener('shown.bs.tab', () => refreshMemories());

    document.addEventListener('click', (event) => {
      const filterButton = event.target.closest?.('[data-memory-filter]');
      if (filterButton) {
        setMemoryFilterFromButton(filterButton);
        return;
      }
      const dayAdd = event.target.closest?.('[data-memory-day-add]');
      if (dayAdd) {
        openAddMemoryModal({ itineraryDay: Number(dayAdd.dataset.memoryDayAdd) });
        return;
      }
      const dayLink = event.target.closest?.('[data-memory-day-link]');
      if (dayLink) {
        activateMemoriesForDay(Number(dayLink.dataset.memoryDayLink));
        return;
      }
      const card = event.target.closest?.('[data-memory-id]');
      if (card && card.closest('#memory-grid')) openMemoryViewer(card.dataset.memoryId);
    });

    // Trip day reductions reconcile memory day associations without deleting
    // any memory. Reset Trip and Clear Itinerary never touch memories. The
    // change hook sits on the planner form so Phase 3 updates the day count
    // and Phase 4 opens the reduce-days modal before this runs.
    const reduceModal = memoryEl('reduce-days-modal');
    reduceModal?.addEventListener('show.bs.modal', () => { memoryState.reducePending = true; });
    reduceModal?.addEventListener('hidden.bs.modal', () => {
      memoryState.reducePending = false;
      refreshMemories();
    });
    memoryEl('trip-planner')?.addEventListener('change', (event) => {
      if (event.target.id !== 'planner-days' || memoryState.reducePending) return;
      refreshMemories();
    });
    memoryEl('confirm-reset-trip')?.addEventListener('click', () => {
      if (memoryState.reducePending) return;
      refreshMemories();
    });

    if (!('indexedDB' in window) || !window.indexedDB) {
      setMemoryStorageUnavailable();
      renderMemories();
      return;
    }
    openMemoryDB()
      .then((db) => {
        memoryState.db = db;
        memoryState.available = true;
        return refreshMemories();
      })
      .catch(() => {
        setMemoryStorageUnavailable();
        renderMemories();
      });
  }

  // Small, read-mostly surface for the itinerary integration and tests.
  window.perezMemories = Object.freeze({
    renderDayLinks,
    refresh: refreshMemories,
    getAll: () => memoryState.records.slice(),
    countForDay: (day) => memoryState.records.filter((record) => record.itineraryDay === day).length,
    isAvailable: () => memoryState.available,
    openAdd: (day) => openAddMemoryModal(day ? { itineraryDay: day } : {}),
  });

  function initNewsletterSignup() {
    const form = document.getElementById('newsletter-form');
    const status = document.getElementById('newsletter-status');
    const email = document.getElementById('newsletter-email');
    if (!form || !status || !email) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!email.value.trim() || !email.checkValidity()) {
        email.classList.add('is-invalid');
        status.textContent = 'Enter a valid email address.';
        email.focus();
        return;
      }
      email.classList.remove('is-invalid');
      form.reset();
      status.textContent = 'Thanks for subscribing! This school-project demo does not send emails.';
    });
    email.addEventListener('input', () => {
      email.classList.remove('is-invalid');
      if (status.textContent) status.textContent = '';
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
    initItinerary();
    initEvents();
    initGalleryViewer();
    initMemories();
    initNewsletterSignup();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
