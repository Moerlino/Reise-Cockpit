const STORAGE_KEY = "franceTravelCockpit.localData";
const LEGACY_STORAGE_KEYS = [
  "franceTravelCockpit.v4.localWithExample",
  "franceTravelCockpit.v3.localImport",
  "franceTravelCockpit.v2"
];
let routeMapInstance = null;
let routeMapLayerGroup = null;
let leafletLoadPromise = null;

const DATA_SCHEMA_VERSION = 2;

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

let toastTimer = null;
function showToast(message, type = "success") {
  const toast = document.querySelector("#app-toast");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", type === "error");
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3600);
}


const defaultData = {
  meta: {
    tripName: "Frankreichreise",
    importedAt: null,
    sourceName: null,
    schemaVersion: DATA_SCHEMA_VERSION,
    lastEditedAt: null
  },
  days: [],
  documents: [],
  places: [],
  packing: [
    { id: makeId(), text: "Personalausweis / Reisepass", category: "Dokumente", done: false },
    { id: makeId(), text: "Ladekabel & Powerbank", category: "Technik", done: false },
    { id: makeId(), text: "Krankenversicherungskarte", category: "Gesundheit", done: false },
    { id: makeId(), text: "Bequeme Schuhe", category: "Kleidung", done: false },
    { id: makeId(), text: "Offline-Karten speichern", category: "Vorbereitung", done: false }
  ],
  phrases: [
    { category: "Restaurant", de: "Ich habe reserviert.", fr: "J’ai réservé." },
    { category: "Restaurant", de: "Könnten Sie die Karte bringen?", fr: "Est-ce que je pourrais avoir la carte, s’il vous plaît ?" },
    { category: "Restaurant", de: "Kann ich mit Karte zahlen?", fr: "Est-ce que je peux payer par carte ?" },
    { category: "Hotel", de: "Ich möchte einchecken.", fr: "Je voudrais m’enregistrer." },
    { category: "Hotel", de: "Um wie viel Uhr ist der Check-out?", fr: "À quelle heure est le départ ?" },
    { category: "Bahnhof", de: "Von welchem Gleis fährt der Zug?", fr: "De quel quai part le train ?" },
    { category: "Bahnhof", de: "Ist dieser Platz frei?", fr: "Cette place est libre ?" },
    { category: "Alltag", de: "Könnten Sie das bitte wiederholen?", fr: "Vous pouvez répéter, s’il vous plaît ?" },
    { category: "Alltag", de: "Ich spreche nur ein bisschen Französisch.", fr: "Je parle seulement un peu français." },
    { category: "Notfall", de: "Ich brauche Hilfe.", fr: "J’ai besoin d’aide." },
    { category: "Notfall", de: "Wo ist die nächste Apotheke?", fr: "Où est la pharmacie la plus proche ?" }
  ]
};

const exampleTripData = {
  "meta": {
    "tripName": "Beispielreise Frankreich",
    "sourceName": "Beispielplan"
  },
  "days": [
    {
      "date": "2026-06-12",
      "title": "Anreise nach Straßburg",
      "location": "Straßburg",
      "accommodation": "Beispiel-Unterkunft Altstadt",
      "hotelMap": "https://www.google.com/maps/search/?api=1&query=Strasbourg+Altstadt",
      "routeMap": "https://www.google.com/maps/dir/?api=1&destination=Strasbourg",
      "stops": [
        {
          "time": "08:30",
          "title": "Abfahrt vorbereiten",
          "note": "Tickets, Ausweis und Ladegerät bereitlegen."
        },
        {
          "time": "11:45",
          "title": "Ankunft und Orientierung",
          "note": "Bahnhof, Tram und Weg zur Unterkunft prüfen."
        },
        {
          "time": "14:00",
          "title": "Check-in / Gepäck ablegen",
          "note": "Falls Zimmer noch nicht frei: Gepäckaufbewahrung nutzen."
        },
        {
          "time": "16:00",
          "title": "Spaziergang durch La Petite France",
          "note": "Erster Überblick, Fotos, Café-Pause."
        },
        {
          "time": "19:30",
          "title": "Abendessen in der Altstadt",
          "note": "Französische Restaurant-Sätze testen."
        }
      ],
      "notes": "Dieser Tag ist ein Beispiel. Er kann gelöscht oder durch den echten Import ersetzt werden."
    },
    {
      "date": "2026-06-13",
      "title": "Straßburg entdecken",
      "location": "Straßburg",
      "accommodation": "Beispiel-Unterkunft Altstadt",
      "hotelMap": "https://www.google.com/maps/search/?api=1&query=Strasbourg+Altstadt",
      "routeMap": "https://www.google.com/maps/dir/?api=1&destination=Cathedrale+Notre+Dame+de+Strasbourg",
      "stops": [
        {
          "time": "09:30",
          "title": "Cathédrale Notre-Dame",
          "note": "Öffnungszeiten vorher prüfen."
        },
        {
          "time": "11:00",
          "title": "Altstadt und Münsterplatz",
          "note": "Kurze Notizen zu Stadtbild und Atmosphäre machen."
        },
        {
          "time": "13:00",
          "title": "Mittagspause",
          "note": "Bäckerei oder kleines Bistro suchen."
        },
        {
          "time": "15:00",
          "title": "Bootsfahrt / Museum als Option",
          "note": "Plan A oder Regen-Alternative."
        },
        {
          "time": "20:00",
          "title": "Abendrunde am Wasser",
          "note": "Lockerer Tagesabschluss."
        }
      ],
      "notes": "Beispieltag für die Timeline."
    },
    {
      "date": "2026-06-14",
      "title": "Weiterfahrt nach Lyon",
      "location": "Lyon",
      "accommodation": "Beispiel-Hotel Lyon Zentrum",
      "hotelMap": "https://www.google.com/maps/search/?api=1&query=Lyon+Zentrum+Hotel",
      "routeMap": "https://www.google.com/maps/dir/?api=1&destination=Lyon",
      "stops": [
        {
          "time": "08:00",
          "title": "Auschecken",
          "note": "Nichts im Zimmer vergessen."
        },
        {
          "time": "10:15",
          "title": "Zug / Weiterfahrt",
          "note": "Gleis und Reservierung prüfen."
        },
        {
          "time": "14:00",
          "title": "Ankunft in Lyon",
          "note": "Zur Unterkunft navigieren."
        },
        {
          "time": "17:00",
          "title": "Erster Spaziergang: Vieux Lyon",
          "note": "Kartenlink und Rückweg speichern."
        }
      ],
      "notes": "Beispiel für einen Ortswechsel."
    }
  ],
  "documents": [
    {
      "title": "Hinweis: Beispielplan",
      "category": "App-Test",
      "content": "Dies sind nur Beispieldaten. Die echte Reiseplanung wird später lokal importiert und nicht auf GitHub hochgeladen."
    },
    {
      "title": "Ticket-Check",
      "category": "Vorbereitung",
      "content": "Tickets, Reservierungen und Ausweis vor der Abfahrt griffbereit halten."
    }
  ],
  "places": [
    {
      "name": "Straßburg Bahnhof",
      "category": "Bahnhof",
      "address": "Strasbourg, Frankreich",
      "mapUrl": "https://www.google.com/maps/search/?api=1&query=Gare+de+Strasbourg"
    },
    {
      "name": "Cathédrale Notre-Dame de Strasbourg",
      "category": "Sehenswürdigkeit",
      "address": "Place de la Cathédrale, Strasbourg",
      "mapUrl": "https://www.google.com/maps/search/?api=1&query=Cathedrale+Notre+Dame+de+Strasbourg"
    },
    {
      "name": "Vieux Lyon",
      "category": "Stadtviertel",
      "address": "Vieux Lyon, Lyon",
      "mapUrl": "https://www.google.com/maps/search/?api=1&query=Vieux+Lyon"
    }
  ],
  "packing": [
    {
      "text": "Personalausweis / Reisepass",
      "category": "Dokumente",
      "done": false
    },
    {
      "text": "Tickets / Reservierungen offline speichern",
      "category": "Dokumente",
      "done": false
    },
    {
      "text": "Ladekabel & Powerbank",
      "category": "Technik",
      "done": false
    },
    {
      "text": "Krankenversicherungskarte",
      "category": "Gesundheit",
      "done": false
    },
    {
      "text": "Bequeme Schuhe",
      "category": "Kleidung",
      "done": false
    },
    {
      "text": "Kleine Reiseapotheke",
      "category": "Gesundheit",
      "done": false
    },
    {
      "text": "Regenschutz / leichte Jacke",
      "category": "Kleidung",
      "done": false
    }
  ]
};

let data = loadData();
let activePhraseCategory = "Alle";
let activePackingCategory = "Alle";
let pendingInstallPrompt = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeDay(day) {
  const stops = Array.isArray(day.stops) ? day.stops : String(day.tasks || "")
    .split("\n")
    .filter(Boolean)
    .map((line, index) => ({ time: index === 0 ? "" : "", title: line, note: "" }));
  return {
    id: day.id || makeId(),
    date: day.date || localISODate(),
    title: day.title || "Reisetag",
    location: day.location || "",
    accommodation: day.accommodation || "",
    hotelMap: day.hotelMap || "",
    routeMap: day.routeMap || "",
    coordinates: day.coordinates && Number.isFinite(Number(day.coordinates.lat)) && Number.isFinite(Number(day.coordinates.lng))
      ? { lat: Number(day.coordinates.lat), lng: Number(day.coordinates.lng) }
      : null,
    tasks: day.tasks || stops.map(stop => stop.title).join("\n"),
    notes: day.notes || "",
    stops: stops.map(stop => ({ time: stop.time || "", title: stop.title || "Programmpunkt", note: stop.note || "" }))
  };
}

function normalizeData(raw = {}) {
  const base = structuredClone(defaultData);
  return {
    ...base,
    ...raw,
    meta: { ...base.meta, ...(raw.meta || {}), schemaVersion: DATA_SCHEMA_VERSION },
    days: Array.isArray(raw.days) ? raw.days.map(normalizeDay) : base.days,
    documents: Array.isArray(raw.documents) ? raw.documents.map(item => ({ id: item.id || makeId(), title: item.title || "Info", category: item.category || "Allgemein", content: item.content || "" })) : base.documents,
    places: Array.isArray(raw.places) ? raw.places.map(item => ({ id: item.id || makeId(), name: item.name || "Ort", category: item.category || "Allgemein", address: item.address || "", mapUrl: item.mapUrl || "" })) : base.places,
    packing: Array.isArray(raw.packing) ? raw.packing.map(item => ({ id: item.id || makeId(), text: item.text || "Eintrag", category: item.category || "Allgemein", done: Boolean(item.done) })) : base.packing,
    phrases: Array.isArray(raw.phrases) ? raw.phrases : base.phrases
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return normalizeData(JSON.parse(saved));
    } catch {
      console.warn("Lokale Daten konnten nicht gelesen werden.");
    }
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (!legacy) continue;
    try {
      const migrated = normalizeData(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(`${STORAGE_KEY}.migratedFrom`, key);
      return migrated;
    } catch {
      console.warn(`Alte lokale Daten konnten nicht migriert werden: ${key}`);
    }
  }

  return normalizeData({ ...structuredClone(defaultData), ...structuredClone(exampleTripData), meta: { ...exampleTripData.meta, sourceName: "Beispielplan" } });
}

function saveData() {
  data.meta = { ...(data.meta || {}), schemaVersion: DATA_SCHEMA_VERSION, lastEditedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}


function markUserEdited() {
  localStorage.setItem(`${STORAGE_KEY}.userEdited`, "true");
}

function hasLocalTripData() {
  return data.days.length > 0 || data.documents.length > 0 || data.places.length > 0;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value + "T12:00:00"));
}

function todayDay() {
  if (!data.days.length) return null;
  const today = localISODate();
  const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.find(day => day.date === today) || sorted.find(day => day.date > today) || sorted.at(-1);
}

function tripPeriod() {
  const dates = data.days
    .map(day => day.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  if (!dates.length) return "Reisezeitraum noch nicht festgelegt";
  const start = formatDate(dates[0]);
  const end = formatDate(dates.at(-1));
  return start === end ? start : `${start} – ${end}`;
}

const TAB_ORDER = ["dashboard", "plan", "documents", "map", "packing", "phrases"];

const TAB_ANIMATION_MS = 360;
let tabTransitionRunning = false;
let tabTransitionCleanupTimer = null;
let swipeGesture = null;

function getActiveTabId() {
  return document.querySelector(".tab.active")?.dataset.tab || TAB_ORDER[0];
}

function getTabDirection(tabId, directionHint = 0) {
  if (directionHint) return directionHint > 0 ? 1 : -1;
  const currentIndex = TAB_ORDER.indexOf(getActiveTabId());
  const nextIndex = TAB_ORDER.indexOf(tabId);
  return nextIndex >= currentIndex ? 1 : -1;
}

function updateActiveTab(tabId) {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === tabId));
  document.querySelector(`.tab[data-tab="${tabId}"]`)?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
    inline: "center"
  });
}

function runAfterTabSwitch(tabId) {
  window.scrollTo({ top: 0, behavior: "auto" });
  if (tabId === "plan") window.setTimeout(scrollTodayIntoView, 80);
  if (tabId === "map") window.setTimeout(() => {
    renderRouteOverview();
    routeMapInstance?.invalidateSize();
  }, 80);
}

function clearPanelAnimationStyles(screen) {
  if (!screen) return;
  screen.classList.remove("swipe-visible", "swipe-current", "swipe-next", "swipe-settling");
  screen.style.removeProperty("transform");
  screen.style.removeProperty("opacity");
  screen.style.removeProperty("transition-duration");
}

function preparePanelTransition(currentScreen, nextScreen, direction) {
  const main = document.querySelector("main");
  const width = Math.max(main?.clientWidth || window.innerWidth, 1);

  clearTimeout(tabTransitionCleanupTimer);
  $$(".screen").forEach(screen => {
    if (screen !== currentScreen && screen !== nextScreen) clearPanelAnimationStyles(screen);
  });

  nextScreen.classList.add("swipe-visible", "swipe-next");
  currentScreen.classList.add("swipe-current");
  nextScreen.style.transform = `translate3d(${direction * width}px, 0, 0)`;
  nextScreen.style.opacity = "0.74";
  currentScreen.style.transform = "translate3d(0, 0, 0)";
  currentScreen.style.opacity = "1";

  // Erst nach dem Sichtbarmachen des Zielbereichs lässt sich dessen Höhe zuverlässig messen.
  const transitionHeight = Math.max(currentScreen.offsetHeight, nextScreen.offsetHeight, 1);
  main?.classList.add("tab-transitioning");
  if (main) main.style.height = `${transitionHeight}px`;

  return { main, width };
}

function setPanelPositions(currentScreen, nextScreen, direction, deltaX, width) {
  const limitedDelta = direction > 0
    ? Math.max(-width, Math.min(0, deltaX))
    : Math.min(width, Math.max(0, deltaX));
  const progress = Math.min(1, Math.abs(limitedDelta) / width);

  currentScreen.style.transform = `translate3d(${limitedDelta}px, 0, 0)`;
  nextScreen.style.transform = `translate3d(${limitedDelta + direction * width}px, 0, 0)`;
  currentScreen.style.opacity = String(1 - progress * 0.18);
  nextScreen.style.opacity = String(0.74 + progress * 0.26);
  return limitedDelta;
}

function finishPanelTransition({ currentScreen, nextScreen, tabId, completed }) {
  const main = document.querySelector("main");

  clearPanelAnimationStyles(currentScreen);
  clearPanelAnimationStyles(nextScreen);
  main?.classList.remove("tab-transitioning");
  main?.style.removeProperty("height");

  if (completed) {
    currentScreen?.classList.remove("active-screen");
    nextScreen?.classList.add("active-screen");
    updateActiveTab(tabId);
    runAfterTabSwitch(tabId);
  } else {
    currentScreen?.classList.add("active-screen");
    nextScreen?.classList.remove("active-screen");
  }

  tabTransitionRunning = false;
  swipeGesture = null;
}

function settlePanelTransition({
  currentScreen,
  nextScreen,
  tabId,
  direction,
  width,
  complete,
  duration = TAB_ANIMATION_MS
}) {
  tabTransitionRunning = true;
  currentScreen.classList.add("swipe-settling");
  nextScreen.classList.add("swipe-settling");
  currentScreen.style.transitionDuration = `${duration}ms`;
  nextScreen.style.transitionDuration = `${duration}ms`;

  // Zwei Frames stellen sicher, dass Safari die Ausgangsposition zeichnet,
  // bevor die Zielposition gesetzt wird.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (complete) {
      currentScreen.style.transform = `translate3d(${-direction * width}px, 0, 0)`;
      currentScreen.style.opacity = "0.72";
      nextScreen.style.transform = "translate3d(0, 0, 0)";
      nextScreen.style.opacity = "1";
    } else {
      currentScreen.style.transform = "translate3d(0, 0, 0)";
      currentScreen.style.opacity = "1";
      nextScreen.style.transform = `translate3d(${direction * width}px, 0, 0)`;
      nextScreen.style.opacity = "0.74";
    }
  }));

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.clearTimeout(tabTransitionCleanupTimer);
    finishPanelTransition({
      currentScreen,
      nextScreen,
      tabId,
      completed: complete
    });
  };

  nextScreen.addEventListener("transitionend", cleanup, { once: true });
  tabTransitionCleanupTimer = window.setTimeout(cleanup, duration + 120);
}

function switchTab(tabId, directionHint = 0) {
  if (swipeGesture?.active) return;
  const currentScreen = document.querySelector(".screen.active-screen");
  const nextScreen = document.getElementById(tabId);
  if (!currentScreen || !nextScreen || currentScreen === nextScreen || tabTransitionRunning) return;

  const direction = getTabDirection(tabId, directionHint);
  const { width } = preparePanelTransition(currentScreen, nextScreen, direction);
  updateActiveTab(tabId);
  settlePanelTransition({
    currentScreen,
    nextScreen,
    tabId,
    direction,
    width,
    complete: true,
    duration: TAB_ANIMATION_MS
  });
}

function setupSwipeNavigation() {
  const swipeArea = document.querySelector("main");
  if (!swipeArea) return;

  const interactiveSelector = [
    "input", "textarea", "select", "button", "a", "label", "dialog",
    "[contenteditable='true']", "#interactive-route-map", ".leaflet-container"
  ].join(",");

  const resetCandidate = () => {
    if (swipeGesture?.active && swipeGesture.currentScreen && swipeGesture.nextScreen) {
      settlePanelTransition({
        currentScreen: swipeGesture.currentScreen,
        nextScreen: swipeGesture.nextScreen,
        tabId: swipeGesture.tabId,
        direction: swipeGesture.direction,
        width: swipeGesture.width,
        complete: false,
        duration: 190
      });
    } else {
      swipeGesture = null;
    }
  };

  swipeArea.addEventListener("touchstart", event => {
    if (tabTransitionRunning || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const edgeMargin = 22;
    const blocked = Boolean(event.target.closest(interactiveSelector))
      || touch.clientX <= edgeMargin
      || touch.clientX >= window.innerWidth - edgeMargin;

    swipeGesture = {
      blocked,
      active: false,
      directionLocked: false,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastTime: performance.now(),
      startedAt: performance.now(),
      deltaX: 0,
      velocityX: 0,
      currentScreen: null,
      nextScreen: null,
      tabId: null,
      direction: 0,
      width: 0
    };
  }, { passive: true });

  swipeArea.addEventListener("touchmove", event => {
    const gesture = swipeGesture;
    if (!gesture || gesture.blocked || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!gesture.directionLocked) {
      if (absX < 8 && absY < 8) return;
      if (absY > absX * 0.9) {
        gesture.blocked = true;
        return;
      }

      const direction = deltaX < 0 ? 1 : -1;
      const currentIndex = TAB_ORDER.indexOf(getActiveTabId());
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) {
        gesture.blocked = true;
        return;
      }

      const currentScreen = document.querySelector(".screen.active-screen");
      const tabId = TAB_ORDER[nextIndex];
      const nextScreen = document.getElementById(tabId);
      if (!currentScreen || !nextScreen) {
        gesture.blocked = true;
        return;
      }

      const prepared = preparePanelTransition(currentScreen, nextScreen, direction);
      gesture.directionLocked = true;
      gesture.active = true;
      gesture.direction = direction;
      gesture.currentScreen = currentScreen;
      gesture.nextScreen = nextScreen;
      gesture.tabId = tabId;
      gesture.width = prepared.width;
      swipeArea.classList.add("is-live-swiping");
    }

    if (!gesture.active) return;
    event.preventDefault();

    const now = performance.now();
    const frameDuration = Math.max(now - gesture.lastTime, 1);
    gesture.velocityX = (touch.clientX - gesture.lastX) / frameDuration;
    gesture.lastX = touch.clientX;
    gesture.lastTime = now;
    gesture.deltaX = setPanelPositions(
      gesture.currentScreen,
      gesture.nextScreen,
      gesture.direction,
      deltaX,
      gesture.width
    );
  }, { passive: false });

  swipeArea.addEventListener("touchend", event => {
    const gesture = swipeGesture;
    swipeArea.classList.remove("is-live-swiping");
    if (!gesture || gesture.blocked || !gesture.active || event.changedTouches.length !== 1) {
      swipeGesture = null;
      return;
    }

    const travelled = Math.abs(gesture.deltaX);
    const progress = travelled / gesture.width;
    const fastSwipe = Math.abs(gesture.velocityX) >= 0.42 && travelled >= 34;
    const complete = progress >= 0.24 || fastSwipe;
    const remaining = complete ? 1 - progress : progress;
    const duration = Math.max(170, Math.min(330, 180 + remaining * 170));

    settlePanelTransition({
      currentScreen: gesture.currentScreen,
      nextScreen: gesture.nextScreen,
      tabId: gesture.tabId,
      direction: gesture.direction,
      width: gesture.width,
      complete,
      duration
    });
  }, { passive: true });

  swipeArea.addEventListener("touchcancel", () => {
    swipeArea.classList.remove("is-live-swiping");
    resetCandidate();
  }, { passive: true });
}

function renderDashboard() {
  const day = todayDay();
  $("#dashboard-date").textContent = formatDate(day?.date);
  $("#dashboard-title").textContent = day?.title || "Frankreichreise";
  $("#dashboard-location").textContent = day ? `${day.location} · ${day.accommodation}` : "Noch kein Tagesplan ausgewählt.";
  $("#today-summary").textContent = tripPeriod();
  $("#hotel-link").href = day?.hotelMap || "#";
  $("#route-link").href = day?.routeMap || "#";
  const tasks = day?.stops?.length ? day.stops.map(stop => `${stop.time ? `${stop.time} · ` : ""}${stop.title}`) : (day?.tasks || "").split("\n").filter(Boolean);
  $("#next-list").innerHTML = tasks.length ? tasks.slice(0, 6).map(task => `<li>${escapeHtml(task)}</li>`).join("") : "<li>Keine Aufgaben eingetragen.</li>";
}

function dayStatus(day) {
  const today = localISODate();
  if (day.date === today) return "today";
  if (day.date < today) return "past";
  return "future";
}

function renderDays() {
  const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) {
    $("#day-list").innerHTML = `<article class="empty-state"><h3>Noch kein lokaler Reiseplan</h3><p>Wähle „Plan importieren“ und lade eine private JSON-Datei von deinem Handy. Die Datei wird nur lokal im Browser gespeichert und nicht zu GitHub hochgeladen.</p></article>`;
    return;
  }
  $("#day-list").innerHTML = `
    <div class="timeline" aria-label="Vertikale Reise-Timeline">
      ${sorted.map((day, index) => {
        const status = dayStatus(day);
        const stops = day.stops || [];
        return `
          <article class="timeline-day ${status}" data-today-card="${status === "today"}" id="day-${escapeAttribute(day.id)}">
            <div class="timeline-day-head">
              <div>
                <div class="day-badge">Tag ${index + 1} · ${formatDate(day.date)} ${status === "today" ? `<span class="current-pill">Heute</span>` : ""}</div>
                <h3>${escapeHtml(day.title)}</h3>
                <p><strong>${escapeHtml(day.location)}</strong><br>${escapeHtml(day.accommodation)}</p>
              </div>
              <button class="mini-button" data-edit-day="${day.id}" type="button">Bearbeiten</button>
            </div>
            ${stops.length ? `
              <div class="timeline-stops">
                ${stops.map(stop => `
                  <div class="stop">
                    <div class="stop-time">${escapeHtml(stop.time || "—")}</div>
                    <div>
                      <div class="stop-title">${escapeHtml(stop.title)}</div>
                      ${stop.note ? `<div class="stop-note">${linkifyText(stop.note)}</div>` : ""}
                    </div>
                  </div>`).join("")}
              </div>` : `<div class="day-empty">Noch keine Programmpunkte eingetragen.</div>`}
            <div class="item-actions" style="padding: 0 16px 16px;">
              <a class="mini-button" href="${escapeAttribute(day.hotelMap)}" target="_blank" rel="noreferrer">Unterkunft</a>
              <a class="mini-button" href="${escapeAttribute(day.routeMap)}" target="_blank" rel="noreferrer">Route</a>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function scrollTodayIntoView() {
  const card = document.querySelector('[data-today-card="true"]');
  if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDocuments() {
  if (!data.documents.length) {
    $("#document-list").innerHTML = `<article class="empty-state"><h3>Noch keine Reiseinfos</h3><p>Du kannst Infos manuell hinzufügen oder über deine lokale Reiseplan-Datei importieren.</p></article>`;
    return;
  }
  $("#document-list").innerHTML = data.documents.map(doc => `
    <article class="item-card">
      <header>
        <div>
          <div class="meta">${escapeHtml(doc.category)}</div>
          <h3>${escapeHtml(doc.title)}</h3>
        </div>
        <button class="mini-button" data-edit-document="${doc.id}" type="button">Bearbeiten</button>
      </header>
      <p>${escapeHtml(doc.content)}</p>
      <div class="item-actions"><button class="mini-button danger" data-delete-document="${doc.id}" type="button">Löschen</button></div>
    </article>
  `).join("");
}

function isValidCoordinates(value) {
  return value && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));
}

function sameCoordinates(a, b, tolerance = 0.0001) {
  return isValidCoordinates(a) && isValidCoordinates(b)
    && Math.abs(Number(a.lat) - Number(b.lat)) < tolerance
    && Math.abs(Number(a.lng) - Number(b.lng)) < tolerance;
}

function routeDaysWithCoordinates() {
  return [...data.days]
    .filter(day => isValidCoordinates(day.coordinates))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function routePointsWithCoordinates() {
  const days = routeDaysWithCoordinates();
  const start = data.meta?.routeStart;
  const points = [];

  if (start && isValidCoordinates(start.coordinates)) {
    points.push({
      kind: "start",
      title: start.name || "Start",
      location: start.name || "Start",
      date: days[0]?.date || "",
      coordinates: {
        lat: Number(start.coordinates.lat),
        lng: Number(start.coordinates.lng)
      }
    });
  }

  days.forEach((day, dayIndex) => {
    const isReturnToStart = points.length > 0
      && dayIndex === days.length - 1
      && sameCoordinates(day.coordinates, points[0].coordinates);
    points.push({
      ...day,
      kind: isReturnToStart ? "end" : "stop"
    });
  });

  return points;
}

function routePointLabel(point, index, points) {
  if (point.kind === "start") return "S";
  if (point.kind === "end") return "Z";
  const stopsBefore = points.slice(0, index).filter(item => item.kind === "stop").length;
  return String(stopsBefore + 1);
}

function routePointDescription(point) {
  if (point.kind === "start") return `Start: ${point.location || point.title}`;
  if (point.kind === "end") return `Rückkehr: ${point.location || point.title}`;
  return point.location || point.title;
}

function renderRouteOverview() {
  const container = $("#route-overview");
  const status = $("#map-status");
  if (!container || !status) return;

  const routeDays = routePointsWithCoordinates();
  if (!routeDays.length) {
    container.innerHTML = `<div class="map-empty">Im importierten Reiseplan fehlen Kartenkoordinaten.</div>`;
    status.textContent = "Ergänze pro Reisetag coordinates mit lat und lng.";
    return;
  }

  const width = 900;
  const height = 520;
  const padding = 48;
  const lats = routeDays.map(day => day.coordinates.lat);
  const lngs = routeDays.map(day => day.coordinates.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.1);
  const lngSpan = Math.max(maxLng - minLng, 0.1);

  const points = routeDays.map((day, index) => {
    const x = padding + ((day.coordinates.lng - minLng) / lngSpan) * (width - padding * 2);
    const y = height - padding - ((day.coordinates.lat - minLat) / latSpan) * (height - padding * 2);
    return { day, index, x, y };
  });

  const polyline = points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const markers = points.map(point => {
    const label = routePointLabel(point.day, point.index, routeDays);
    const description = routePointDescription(point.day);
    const dateText = point.day.date ? ` · ${formatDate(point.day.date)}` : "";
    return `
    <g class="overview-marker" tabindex="0" role="img" aria-label="${escapeAttribute(`${description}${dateText}`)}">
      <circle cx="${point.x}" cy="${point.y}" r="16"></circle>
      <text x="${point.x}" y="${point.y + 5}" text-anchor="middle">${escapeHtml(label)}</text>
      <title>${escapeHtml(`${description}${dateText}`)}</title>
    </g>`;
  }).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Schematischer Verlauf der Frankreichreise">
      <defs>
        <linearGradient id="route-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f7fbf8"></stop>
          <stop offset="100%" stop-color="#e4f1e9"></stop>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="28" fill="url(#route-bg)"></rect>
      <polyline class="overview-route-line" points="${polyline}"></polyline>
      ${markers}
    </svg>
    <div class="overview-legend">${routeDays.map((point, index) => `<span><strong>${escapeHtml(routePointLabel(point, index, routeDays))}</strong>${escapeHtml(routePointDescription(point))}</span>`).join("")}</div>`;
  const stopCount = routeDays.filter(point => point.kind === "stop").length;
  status.textContent = `${stopCount} Stopps · Karlsruhe als Start und Rückkehr.`;
}

function loadLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.leaflet = "true";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.leaflet = "true";
    script.onload = () => resolve(window.L);
    script.onerror = () => {
      leafletLoadPromise = null;
      reject(new Error("Leaflet konnte nicht geladen werden."));
    };
    document.head.appendChild(script);
  });
  return leafletLoadPromise;
}

async function loadInteractiveMap() {
  const container = $("#route-map");
  const loading = $("#map-loading");
  const loadButton = $("#load-interactive-map");
  const unloadButton = $("#unload-interactive-map");
  const status = $("#map-status");
  if (!container || !loading || !loadButton || !unloadButton || !status) return;

  loading.classList.remove("hidden");
  loadButton.disabled = true;
  try {
    await loadLeafletAssets();
    container.classList.remove("hidden");
    renderRouteMap();
    loadButton.classList.add("hidden");
    unloadButton.classList.remove("hidden");
    status.textContent = `${routePointsWithCoordinates().filter(point => point.kind === "stop").length} Stopps auf der interaktiven Karte.`;
  } catch (error) {
    showToast("Die interaktive Karte konnte nicht geladen werden. Prüfe die Internetverbindung.", "error");
    status.textContent = "Die lokale Routenübersicht bleibt weiterhin verfügbar.";
  } finally {
    loading.classList.add("hidden");
    loadButton.disabled = false;
  }
}

function renderRouteMap() {
  const container = $("#route-map");
  if (!container || typeof L === "undefined" || container.classList.contains("hidden")) return;

  const routeDays = routePointsWithCoordinates();
  if (!routeMapInstance) {
    routeMapInstance = L.map(container, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      updateWhenIdle: true,
      keepBuffer: 1,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(routeMapInstance);
    routeMapLayerGroup = L.layerGroup().addTo(routeMapInstance);
  }

  routeMapLayerGroup.clearLayers();
  if (!routeDays.length) {
    routeMapInstance.setView([46.7, 2.5], 5);
    return;
  }

  const points = routeDays.map(day => [day.coordinates.lat, day.coordinates.lng]);
  L.polyline(points, { color: "#19704a", weight: 5, opacity: .82 }).addTo(routeMapLayerGroup);
  routeDays.forEach((day, index) => {
    const marker = L.marker([day.coordinates.lat, day.coordinates.lng]).addTo(routeMapLayerGroup);
    const label = routePointLabel(day, index, routeDays);
    marker.bindPopup(`
      <div class="route-marker-label">${escapeHtml(label)} · ${escapeHtml(routePointDescription(day))}</div>
      ${day.date ? `<div>${escapeHtml(formatDate(day.date))}</div>` : ""}
    `);
  });
  routeMapInstance.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
  setTimeout(() => routeMapInstance?.invalidateSize(), 80);
}

function unloadInteractiveMap() {
  routeMapInstance?.remove();
  routeMapInstance = null;
  routeMapLayerGroup = null;
  $("#route-map")?.classList.add("hidden");
  $("#unload-interactive-map")?.classList.add("hidden");
  $("#load-interactive-map")?.classList.remove("hidden");
  $("#map-status").textContent = `${routePointsWithCoordinates().filter(point => point.kind === "stop").length} Stopps · Karlsruhe als Start und Rückkehr.`;
}

function renderPlaces() {
  if (!data.places.length) {
    $("#place-list").innerHTML = `<article class="empty-state"><h3>Noch keine Orte</h3><p>Importiere Kartenlinks über die Reiseplan-Datei oder füge wichtige Orte manuell hinzu.</p></article>`;
    return;
  }
  $("#place-list").innerHTML = data.places.map(place => `
    <article class="item-card">
      <header>
        <div>
          <div class="meta">${escapeHtml(place.category)}</div>
          <h3>${escapeHtml(place.name)}</h3>
        </div>
        <button class="mini-button" data-edit-place="${place.id}" type="button">Bearbeiten</button>
      </header>
      <p>${escapeHtml(place.address)}</p>
      <div class="item-actions">
        <a class="mini-button" href="${escapeAttribute(place.mapUrl)}" target="_blank" rel="noreferrer">In Karte öffnen</a>
        <button class="mini-button danger" data-delete-place="${place.id}" type="button">Löschen</button>
      </div>
    </article>
  `).join("");
}

function getPackingCategories() {
  return [...new Set(data.packing.map(item => item.category || "Allgemein"))]
    .sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
}

function sortedPackingItems() {
  return [...data.packing].sort((a, b) => {
    const categoryCompare = (a.category || "Allgemein").localeCompare(b.category || "Allgemein", "de", { sensitivity: "base" });
    if (categoryCompare !== 0) return categoryCompare;
    return (a.text || "").localeCompare(b.text || "", "de", { sensitivity: "base" });
  });
}

function renderPacking() {
  const done = data.packing.filter(item => item.done).length;
  const total = data.packing.length || 1;
  const percent = Math.round(done / total * 100);
  $("#packing-progress-text").textContent = `${percent}%`;
  $("#packing-progress").style.width = `${percent}%`;

  const categories = ["Alle", ...getPackingCategories()];
  if (!categories.includes(activePackingCategory)) activePackingCategory = "Alle";
  const filterHost = $("#packing-filters");
  if (filterHost) {
    filterHost.innerHTML = categories.map(category => `
      <button class="filter-pill ${category === activePackingCategory ? "active" : ""}" data-packing-category="${escapeAttribute(category)}" type="button">${escapeHtml(category === "Alle" ? "Alle Kategorien" : category)}</button>
    `).join("");
  }

  if (!data.packing.length) {
    $("#packing-list").innerHTML = `<article class="empty-state"><h3>Noch keine Packeinträge</h3><p>Füge eigene Einträge manuell hinzu. Du kannst sie später bearbeiten, löschen und abhaken.</p></article>`;
    return;
  }

  const items = sortedPackingItems().filter(item => activePackingCategory === "Alle" || (item.category || "Allgemein") === activePackingCategory);
  if (!items.length) {
    $("#packing-list").innerHTML = `<article class="empty-state"><h3>Keine Einträge in dieser Kategorie</h3><p>Wähle eine andere Kategorie oder lege einen neuen Eintrag an.</p></article>`;
    return;
  }

  let lastCategory = null;
  $("#packing-list").innerHTML = items.map(item => {
    const category = item.category || "Allgemein";
    const categoryHeader = category !== lastCategory ? `<div class="category-heading">${escapeHtml(category)}</div>` : "";
    lastCategory = category;
    return `
      ${categoryHeader}
      <article class="item-card">
        <div class="pack-row ${item.done ? "done" : ""}">
          <input type="checkbox" ${item.done ? "checked" : ""} data-toggle-pack="${item.id}" aria-label="${escapeAttribute(item.text)} abhaken" />
          <div>
            <div class="meta">${escapeHtml(category)}</div>
            <strong>${escapeHtml(item.text)}</strong>
          </div>
        </div>
        <div class="item-actions">
          <button class="mini-button" data-edit-pack="${item.id}" type="button">Bearbeiten</button>
          <button class="mini-button danger" data-delete-pack="${item.id}" type="button">Löschen</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderPhrases() {
  const categories = ["Alle", ...new Set(data.phrases.map(phrase => phrase.category))];
  $("#phrase-filters").innerHTML = categories.map(category => `
    <button class="filter-pill ${category === activePhraseCategory ? "active" : ""}" data-phrase-category="${escapeAttribute(category)}" type="button">${escapeHtml(category)}</button>
  `).join("");
  const phrases = activePhraseCategory === "Alle" ? data.phrases : data.phrases.filter(phrase => phrase.category === activePhraseCategory);
  $("#phrase-list").innerHTML = phrases.map(phrase => `
    <article class="item-card">
      <div class="meta">${escapeHtml(phrase.category)}</div>
      <h3>${escapeHtml(phrase.fr)}</h3>
      <p>${escapeHtml(phrase.de)}</p>
    </article>
  `).join("");
}

function renderLocalStatus() {
  const status = $("#local-data-status");
  if (!status) return;
  const imported = data.meta.importedAt ? formatDateTime(data.meta.importedAt) : "noch nicht importiert";
  status.innerHTML = `
    <strong>Lokaler Speicher</strong>
    <p>${hasLocalTripData() ? `Reiseplan lokal aktiv: ${escapeHtml(data.meta.sourceName || "manuell angelegt")}. Import: ${escapeHtml(imported)}.` : "Noch kein privater Reiseplan gespeichert. GitHub enthält nur die App, nicht deine Route. Änderungen bleiben lokal erhalten und können exportiert werden."}</p>
  `;
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderAll() {
  renderDashboard();
  renderLocalStatus();
  renderDays();
  renderDocuments();
  renderPlaces();
  renderRouteOverview();
  if (routeMapInstance) renderRouteMap();
  renderPacking();
  renderPhrases();
}

function renderField(field) {
  if (field.type === "textarea") {
    return `<div class="field"><label>${field.label}<textarea name="${field.name}">${escapeHtml(field.value || "")}</textarea></label></div>`;
  }
  if (field.type === "stops") {
    const stops = Array.isArray(field.value) && field.value.length ? field.value : [{ time: "", title: "", note: "" }];
    return `
      <div class="field stop-editor-field">
        <div class="field-label-row">
          <span>${field.label}</span>
          <button class="mini-button" data-add-stop-row type="button">Programmpunkt hinzufügen</button>
        </div>
        <div class="stop-editor-list" data-stop-editor>
          ${stops.map(renderStopEditorRow).join("")}
        </div>
        <p class="field-help">Jeder Programmpunkt erscheint später automatisch in der vertikalen Timeline.</p>
      </div>`;
  }
  return `<div class="field"><label>${field.label}<input name="${field.name}" type="${field.type || "text"}" value="${escapeAttribute(field.value || "")}" /></label></div>`;
}

function renderStopEditorRow(stop = {}) {
  return `
    <div class="stop-editor-row" data-stop-row>
      <input data-stop-time type="time" value="${escapeAttribute(stop.time || "")}" aria-label="Uhrzeit" />
      <input data-stop-title type="text" value="${escapeAttribute(stop.title || "")}" placeholder="Programmpunkt" aria-label="Programmpunkt" />
      <textarea data-stop-note placeholder="Hinweis / Notiz" aria-label="Hinweis">${escapeHtml(stop.note || "")}</textarea>
      <button class="mini-button danger" data-remove-stop-row type="button">Entfernen</button>
    </div>`;
}

function collectStopsFromDialog() {
  return $$("[data-stop-row]").map(row => ({
    time: row.querySelector("[data-stop-time]")?.value || "",
    title: row.querySelector("[data-stop-title]")?.value.trim() || "Programmpunkt",
    note: row.querySelector("[data-stop-note]")?.value.trim() || ""
  })).filter(stop => stop.time || stop.title !== "Programmpunkt" || stop.note);
}

function openEditor({ title, fields, onSave, dangerAction = null }) {
  const dialog = $("#editor-dialog");
  const form = $("#editor-form");
  $("#dialog-title").textContent = title;
  $("#dialog-fields").innerHTML = fields.map(renderField).join("") + (dangerAction ? `
    <div class="dialog-danger-zone">
      <button class="danger-button full-width" data-dialog-danger type="button">${escapeHtml(dangerAction.label)}</button>
    </div>` : "");

  form.onclick = (event) => {
    const addButton = event.target.closest("[data-add-stop-row]");
    const removeButton = event.target.closest("[data-remove-stop-row]");
    const dangerButton = event.target.closest("[data-dialog-danger]");
    if (dangerButton && dangerAction) {
      event.preventDefault();
      const confirmed = awaitDeleteConfirmation();
      confirmed.then((shouldDelete) => {
        if (!shouldDelete) return;
        dangerAction.onConfirm();
        markUserEdited();
        saveData();
        renderAll();
        dialog.close();
      });
      return;
    }
    if (addButton) {
      const list = form.querySelector("[data-stop-editor]");
      list.insertAdjacentHTML("beforeend", renderStopEditorRow({}));
    }
    if (removeButton) {
      const rows = $$("[data-stop-row]");
      if (rows.length <= 1) {
        const row = removeButton.closest("[data-stop-row]");
        row.querySelector("[data-stop-time]").value = "";
        row.querySelector("[data-stop-title]").value = "";
        row.querySelector("[data-stop-note]").value = "";
      } else {
        removeButton.closest("[data-stop-row]").remove();
      }
    }
  };

  form.onkeydown = (event) => {
    const target = event.target;
    const isTextInput = target instanceof HTMLInputElement && ["text", "search", "email", "url", "tel", "number", "date", "time"].includes(target.type);
    if (event.key === "Enter" && isTextInput) {
      event.preventDefault();
      const saveButton = form.querySelector("#save-dialog");
      if (form.requestSubmit && saveButton) {
        form.requestSubmit(saveButton);
      } else {
        saveButton?.click();
      }
    }
  };

  form.onsubmit = (event) => {
    const result = event.submitter?.value;
    if (result === "cancel") return;
    event.preventDefault();
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    if (fields.some(field => field.type === "stops")) values.stops = collectStopsFromDialog();
    onSave(values);
    markUserEdited();
    saveData();
    renderAll();
    dialog.close();
  };
  dialog.showModal();
}

function stopsToText(stops = []) {
  return stops.map(stop => `${stop.time || ""}|${stop.title || ""}|${stop.note || ""}`).join("\n");
}

function textToStops(text = "") {
  return text.split("\n").filter(line => line.trim()).map(line => {
    const parts = line.split("|").map(part => part.trim());
    if (parts.length >= 3) return { time: parts[0], title: parts[1] || "Programmpunkt", note: parts.slice(2).join(" | ") };
    if (/^\d{1,2}:\d{2}/.test(line)) {
      const [time, ...rest] = line.split(/\s+/, 2);
      return { time, title: rest.join(" ") || "Programmpunkt", note: "" };
    }
    return { time: "", title: line.trim(), note: "" };
  });
}

function awaitDeleteConfirmation() {
  const dialog = $("#confirm-dialog");
  return new Promise((resolve) => {
    const handler = () => {
      dialog.removeEventListener("close", handler);
      resolve(dialog.returnValue === "delete");
    };
    dialog.addEventListener("close", handler);
    dialog.showModal();
  });
}

function editDay(day = null) {
  const item = day || { id: makeId(), date: localISODate(), title: "Neuer Reisetag", location: "", accommodation: "", hotelMap: "", routeMap: "", tasks: "", notes: "", stops: [] };
  openEditor({
    title: day ? "Reisetag bearbeiten" : "Reisetag hinzufügen",
    fields: [
      { name: "date", label: "Datum", type: "date", value: item.date },
      { name: "title", label: "Titel", value: item.title },
      { name: "location", label: "Ort / Region", value: item.location },
      { name: "accommodation", label: "Unterkunft", value: item.accommodation },
      { name: "hotelMap", label: "Link zur Unterkunft/Karte", value: item.hotelMap },
      { name: "routeMap", label: "Routenlink", value: item.routeMap },
      { name: "stops", label: "Programmpunkte", type: "stops", value: item.stops },
      { name: "notes", label: "Notizen", type: "textarea", value: item.notes }
    ],
    onSave: values => {
      const stops = values.stops || [];
      Object.assign(item, values, { stops, tasks: stops.map(stop => stop.title).join("\n") });
      if (!day) data.days.push(item);
    },
    dangerAction: day ? {
      label: "Tagesplanung löschen",
      onConfirm: () => {
        data.days = data.days.filter(entry => entry.id !== day.id);
      }
    } : null
  });
}

function editDocument(doc = null) {
  const item = doc || { id: makeId(), title: "Neue Info", category: "Allgemein", content: "" };
  openEditor({
    title: doc ? "Info bearbeiten" : "Info hinzufügen",
    fields: [
      { name: "title", label: "Titel", value: item.title },
      { name: "category", label: "Kategorie", value: item.category },
      { name: "content", label: "Inhalt", type: "textarea", value: item.content }
    ],
    onSave: values => {
      Object.assign(item, values);
      if (!doc) data.documents.push(item);
    }
  });
}

function editPlace(place = null) {
  const item = place || { id: makeId(), name: "Neuer Ort", category: "Allgemein", address: "", mapUrl: "" };
  openEditor({
    title: place ? "Ort bearbeiten" : "Ort hinzufügen",
    fields: [
      { name: "name", label: "Name", value: item.name },
      { name: "category", label: "Kategorie", value: item.category },
      { name: "address", label: "Adresse / Hinweis", value: item.address },
      { name: "mapUrl", label: "Kartenlink", value: item.mapUrl }
    ],
    onSave: values => {
      Object.assign(item, values);
      if (!place) data.places.push(item);
    }
  });
}

function editPackItem(item = null) {
  const packItem = item || { id: makeId(), text: "Neuer Gegenstand", category: "Allgemein", done: false };
  openEditor({
    title: item ? "Packeintrag bearbeiten" : "Packeintrag hinzufügen",
    fields: [
      { name: "text", label: "Eintrag", value: packItem.text },
      { name: "category", label: "Kategorie", value: packItem.category }
    ],
    onSave: values => {
      Object.assign(packItem, values);
      if (!item) data.packing.push(packItem);
      activePackingCategory = values.category || "Alle";
    }
  });
}

function deleteById(collection, id) {
  data[collection] = data[collection].filter(item => item.id !== id);
  markUserEdited();
  saveData();
  renderAll();
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeImportedPacking(raw) {
  let items = raw;
  if (raw && !Array.isArray(raw) && Array.isArray(raw.packing)) items = raw.packing;
  if (!Array.isArray(items)) throw new Error("Keine Packliste gefunden");

  return items.map((item, index) => {
    if (typeof item === "string") {
      return { id: makeId(), text: item.trim(), category: "Allgemein", done: false };
    }
    if (!item || typeof item !== "object") throw new Error(`Ungültiger Eintrag in Zeile ${index + 1}`);
    const text = String(item.text ?? item.eintrag ?? item.item ?? item.name ?? "").trim();
    if (!text) throw new Error(`Eintrag ${index + 1} hat keinen Namen`);
    const category = String(item.category ?? item.kategorie ?? "Allgemein").trim() || "Allgemein";
    const doneValue = item.done ?? item.erledigt ?? item.gepackt ?? false;
    const done = doneValue === true || ["true", "1", "ja", "yes", "x"].includes(String(doneValue).trim().toLowerCase());
    return { id: item.id || makeId(), text, category, done };
  }).filter(item => item.text);
}

function parsePackingText(text, fileName = "") {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Die Datei ist leer");
  if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return normalizeImportedPacking(JSON.parse(trimmed));
  }

  const lines = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const rows = lines.map(line => parseDelimitedLine(line, delimiter));
  const first = rows[0].map(value => value.toLowerCase());
  const hasHeader = first.some(value => ["eintrag", "text", "item", "name", "kategorie", "category", "erledigt", "done"].includes(value));
  let indexes = { text: 0, category: 1, done: 2 };
  let dataRows = rows;
  if (hasHeader) {
    indexes = {
      text: first.findIndex(value => ["eintrag", "text", "item", "name"].includes(value)),
      category: first.findIndex(value => ["kategorie", "category"].includes(value)),
      done: first.findIndex(value => ["erledigt", "done", "gepackt"].includes(value))
    };
    dataRows = rows.slice(1);
  }

  return normalizeImportedPacking(dataRows.map(row => ({
    text: row[indexes.text >= 0 ? indexes.text : 0] || "",
    category: indexes.category >= 0 ? row[indexes.category] : "Allgemein",
    done: indexes.done >= 0 ? row[indexes.done] : false
  })));
}

async function importPackingFile(file) {
  if (!file) return;
  try {
    const importedItems = parsePackingText(await file.text(), file.name);
    if (!importedItems.length) throw new Error("Keine Einträge gefunden");

    const replace = confirm(
      `${importedItems.length} Packeinträge gefunden.\n\n` +
      "OK: vorhandene Packliste ersetzen\nAbbrechen: Einträge zur vorhandenen Liste hinzufügen"
    );

    if (replace) {
      data.packing = importedItems;
    } else {
      const existing = new Map(data.packing.map(item => [`${(item.category || "Allgemein").toLowerCase()}\u0000${item.text.toLowerCase()}`, item]));
      importedItems.forEach(item => {
        const key = `${item.category.toLowerCase()}\u0000${item.text.toLowerCase()}`;
        if (!existing.has(key)) {
          data.packing.push(item);
          existing.set(key, item);
        }
      });
    }

    activePackingCategory = "Alle";
    markUserEdited();
    saveData();
    renderPacking();
    alert("Die Packliste wurde lokal importiert.");
  } catch (error) {
    console.error(error);
    alert("Die Packliste konnte nicht importiert werden. Verwende eine gültige JSON-, CSV- oder TXT-Datei.");
  }
}

async function importPlanFile(file) {
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    data = normalizeData({
      ...data,
      ...imported,
      meta: {
        ...(data.meta || {}),
        ...(imported.meta || {}),
        importedAt: new Date().toISOString(),
        sourceName: file.name
      }
    });
    markUserEdited();
    saveData();
    renderAll();
    switchTab("plan");

    const dayCount = Array.isArray(data.days) ? data.days.length : 0;
    const tripName = data.meta?.tripName ? `„${data.meta.tripName}“` : "Der Reiseplan";
    showToast(`${tripName} wurde erfolgreich importiert${dayCount ? ` · ${dayCount} Reisetage` : ""}.`);
  } catch (error) {
    console.error(error);
    showToast("Import fehlgeschlagen. Bitte eine gültige Reiseplan-JSON-Datei verwenden.", "error");
  } finally {
    const input = document.querySelector("#plan-import");
    if (input) input.value = "";
  }
}

function exportLocalData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frankreich-reise-cockpit-export-${localISODate()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearLocalData() {
  if (!confirm("Lokale Reisedaten auf diesem Gerät löschen? Die GitHub-App bleibt unverändert.")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}.userEdited`);
  data = normalizeData({ ...structuredClone(defaultData), ...structuredClone(exampleTripData), meta: { ...exampleTripData.meta, sourceName: "Beispielplan" } });
  renderAll();
  switchTab("plan");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}
function linkifyText(value = "") {
  const escaped = escapeHtml(value);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, (url) => {
    const cleanUrl = url.replace(/[),.;!?]+$/, "");
    const suffix = url.slice(cleanUrl.length);
    return `<a href="${escapeAttribute(cleanUrl)}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${suffix}`;
  });
}

function escapeAttribute(value = "") { return escapeHtml(value).replace(/'/g, "&#039;"); }

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  pendingInstallPrompt = event;
  $("#install-button").classList.remove("hidden");
});

$("#install-button").addEventListener("click", async () => {
  if (!pendingInstallPrompt) return;
  pendingInstallPrompt.prompt();
  await pendingInstallPrompt.userChoice;
  pendingInstallPrompt = null;
  $("#install-button").classList.add("hidden");
});

window.addEventListener("click", event => {
  const target = event.target.closest("button, input");
  if (!target) return;

  if (target.matches(".tab")) switchTab(target.dataset.tab);
  if (target.matches(".quick-card")) switchTab(target.dataset.jump);
  if (target.id === "add-day") editDay();
  if (target.id === "scroll-today") scrollTodayIntoView();
  if (target.id === "export-data") exportLocalData();
  if (target.id === "clear-local-data") clearLocalData();
  if (target.id === "add-document") editDocument();
  if (target.id === "add-place") editPlace();
  if (target.id === "load-interactive-map") loadInteractiveMap();
  if (target.id === "unload-interactive-map") unloadInteractiveMap();
  if (target.id === "add-pack-item") editPackItem();

  if (target.dataset.editDay) editDay(data.days.find(item => item.id === target.dataset.editDay));
  if (target.dataset.editDocument) editDocument(data.documents.find(item => item.id === target.dataset.editDocument));
  if (target.dataset.editPlace) editPlace(data.places.find(item => item.id === target.dataset.editPlace));
  if (target.dataset.editPack) editPackItem(data.packing.find(item => item.id === target.dataset.editPack));

  if (target.dataset.deleteDocument) deleteById("documents", target.dataset.deleteDocument);
  if (target.dataset.deletePlace) deleteById("places", target.dataset.deletePlace);
  if (target.dataset.deletePack) deleteById("packing", target.dataset.deletePack);

  if (target.dataset.togglePack) {
    const item = data.packing.find(pack => pack.id === target.dataset.togglePack);
    if (item) item.done = target.checked;
    markUserEdited();
    saveData();
    renderPacking();
  }

  if (target.dataset.packingCategory) {
    activePackingCategory = target.dataset.packingCategory;
    renderPacking();
  }

  if (target.dataset.phraseCategory) {
    activePhraseCategory = target.dataset.phraseCategory;
    renderPhrases();
  }
});

window.addEventListener("change", event => {
  if (event.target.id === "plan-import") importPlanFile(event.target.files?.[0]);
  if (event.target.id === "packing-import") {
    importPackingFile(event.target.files?.[0]);
    event.target.value = "";
  }
});

if ("serviceWorker" in navigator) {
  let serviceWorkerReloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (serviceWorkerReloading) return;
    serviceWorkerReloading = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("Service Worker konnte nicht aktualisiert werden:", error);
    }
  });
}

setupSwipeNavigation();
renderAll();
