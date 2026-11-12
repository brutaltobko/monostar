// Monostar by Tobko

(function () {
  const root = document.documentElement;

  const KEYS = [
    "text", "subtext", "main", "main-elevated", "highlight", "highlight-elevated", "sidebar", "player", "card",
    "shadow", "selected-row", "button", "button-active", "button-disabled", "tab-active", "notification",
    "notification-error", "misc",
  ];

  const SCHEMES = {
    clean: "f2f2f2 a3a3a3 121212 1c1c1c 262626 303030 070707 070707 1c1c1c 000000 e6e6e6 e8e8e8 ffffff 474747 262626 e8e8e8 ff6b6b 8a8a8a",
    forest: "ffffff b9d6c4 0c1a14 142820 1d382c 254637 07110d 07110d 142820 000000 d4f5e2 4fd18b 7ee3ab 3a5446 1d382c 4fd18b ff5c6c 2fb8c4",
    pink: "ffffff f2c4df 1a0d24 2a1438 3a1c4a 4a2460 12081a 12081a 2a1438 000000 ffd1ea ff6fb5 ff92c8 5a3a5a 3a1c4a ff6fb5 ff4f7b c9a0ff",
    lavender: "ffffff d6c8f5 140f26 221a3d 30264f 3d3163 0d0a1a 0d0a1a 221a3d 000000 e6dcff b48cff caa8ff 4a4266 30264f b48cff ff5c8a ff8fd0",
    midnight: "ffffff bcd0f0 0b1226 141e3a 1e2b4f 283863 070c1a 070c1a 141e3a 000000 d6e6ff 7aa8ff 9cbfff 3a4566 1e2b4f 7aa8ff ff5c7a ff8fd0",
    sunset: "ffffff f0c9b8 1c0f12 2c171b 3d2026 4d2a30 120a0c 120a0c 2c171b 000000 ffe0cc ff8a4c ffa775 5c4038 3d2026 ff8a4c ff4d6d ff5e8a",
  };

  const colorsOf = (name) => Object.fromEntries(SCHEMES[name].split(" ").map((hex, i) => [KEYS[i], hex]));
  const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");

  let redrawStars = () => {};

  function setColors(name, remember) {
    if (!SCHEMES[name]) return;
    for (const [key, hex] of Object.entries(colorsOf(name))) {
      root.style.setProperty(`--spice-${key}`, "#" + hex);
      root.style.setProperty(`--spice-rgb-${key}`, rgb(hex));
    }
    root.dataset.msScheme = name;
    if (remember) localStorage.setItem("ms-scheme", name);
    redrawStars();
  }

  function loadColors() {
    const saved = localStorage.getItem("ms-scheme");
    if (SCHEMES[saved]) return setColors(saved);

    const scheme = String(window.Spicetify?.Config?.color_scheme || "").toLowerCase();
    if (SCHEMES[scheme]) {
      root.dataset.msScheme = scheme;
      return;
    }

    const main = getComputedStyle(root).getPropertyValue("--spice-rgb-main").replace(/\s/g, "");
    root.dataset.msScheme = Object.keys(SCHEMES).find((s) => rgb(colorsOf(s).main) === main) || "clean";
  }

  setColors(localStorage.getItem("ms-scheme"));

  function makeSky() {
    if (document.getElementById("ms-sky")) return;

    const sky = document.createElement("div");
    const canvas = document.createElement("canvas");
    const sparkles = document.createElement("div");
    const shooting = document.createElement("div");
    sky.id = "ms-sky";
    shooting.className = "ms-shooting";
    sky.append(canvas, sparkles, shooting);
    document.body.prepend(sky);

    const ctx = canvas.getContext("2d");
    const nearButtons = (x, y) => x > innerWidth - 300 && y < 110;
    const cssColor = (name) => `rgb(${getComputedStyle(root).getPropertyValue(name).trim() || "255,255,255"})`;

    function stars() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      const colors = ["#fff", "#fff", cssColor("--spice-rgb-selected-row"), cssColor("--spice-rgb-misc")];

      for (let i = 0; i < (innerWidth * innerHeight) / 3000; i++) {
        const x = Math.random() * innerWidth;
        const y = Math.random() * innerHeight;
        if (nearButtons(x, y)) continue;
        ctx.globalAlpha = 0.35 + Math.random() * 0.6;
        ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
        ctx.beginPath();
        ctx.arc(x, y, 0.4 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function twinkles() {
      sparkles.textContent = "";
      for (let i = 0; i < 18; i++) {
        let x, y;
        do {
          x = Math.random() * innerWidth;
          y = Math.random() * innerHeight;
        } while (nearButtons(x, y));

        const s = document.createElement("span");
        const size = (8 + Math.random() * 10) | 0;
        s.className = Math.random() < 0.3 ? "ms-twinkle ms-twinkle--alt" : "ms-twinkle";
        s.style.cssText = `left:${x | 0}px;top:${y | 0}px;width:${size}px;height:${size}px;`;
        s.style.animationDuration = (2.5 + Math.random() * 3.5).toFixed(2) + "s";
        s.style.animationDelay = -(Math.random() * 6).toFixed(2) + "s";
        sparkles.appendChild(s);
      }
    }

    function moveShootingStar() {
      const left = Math.random() < 0.6;
      const angle = 18 + Math.random() * 20;
      const x = left ? 0.05 + Math.random() * 0.45 : 0.35 + Math.random() * 0.4;
      shooting.style.left = ((x * innerWidth) | 0) + "px";
      shooting.style.top = (((0.05 + Math.random() * 0.4) * innerHeight) | 0) + "px";
      shooting.style.setProperty("--ms-angle", ((left ? angle : 180 - angle) | 0) + "deg");
    }

    shooting.addEventListener("animationiteration", moveShootingStar);
    stars();
    twinkles();
    moveShootingStar();
    redrawStars = stars;

    let timer;
    addEventListener("resize", () => {
      root.classList.add("ms-resizing");
      clearTimeout(timer);
      timer = setTimeout(() => {
        root.classList.remove("ms-resizing");
        stars();
        twinkles();
      }, 250);
    });
  }

  const state = () => {
    try {
      return Spicetify.Platform.PlayerAPI.getState();
    } catch {
      return null;
    }
  };

  const track = () => state()?.item || window.Spicetify?.Player?.data?.item;
  const isPlaying = () => state()?.isPaused === false;
  const idOf = (uri) => (uri || "").split(":")[2];
  const go = (path) => Spicetify.Platform.History.push(path);

  function position() {
    const s = state();
    if (!s) return 0;
    return s.isPaused ? s.positionAsOfTimestamp : s.positionAsOfTimestamp + Date.now() - s.timestamp;
  }

  const card = { el: null, lines: [], synced: false, trackId: null, current: -2, cache: new Map() };
  const NPV = ".main-nowPlayingView-nowPlayingWidget, .main-nowPlayingView-contextItemInfo, [data-testid='cover-art-slot'], [data-testid='lyrics-npv-section'], video";
  let npvLabel = null;
  let wasShown = false;
  let watched = null;
  let observer = null;
  let pending = 0;

  function sidebar() {
    const top = document.querySelector(".Root__top-container");
    if (!top) return null;
    const box =
      top.querySelector(".Root__right-sidebar") ||
      [...top.children].find((el) => getComputedStyle(el).gridRowStart.startsWith("right-sidebar"));
    return box?.firstElementChild ? { box, panel: box.firstElementChild } : null;
  }

  function isNowPlaying(panel) {
    if (panel.getBoundingClientRect().width > 700) return false;
    const aside = panel.querySelector("aside");
    if (!aside) return wasShown;
    if (aside.querySelector(NPV)) {
      npvLabel = aside.getAttribute("aria-label");
      return true;
    }
    return !!npvLabel && aside.getAttribute("aria-label") === npvLabel;
  }

  function buildCard() {
    card.el = document.createElement("div");
    card.el.id = "ms-np";
    card.el.innerHTML = `
      <div class="ms-np__card">
        <img class="ms-np__cover" alt="" draggable="false">
        <div class="ms-np__meta">
          <div class="ms-np__title"></div>
          <div class="ms-np__artist"></div>
        </div>
      </div>
      <div class="ms-np__lyrics"><div class="ms-np__lines"></div></div>`;

    const $ = (sel) => card.el.querySelector(sel);
    card.cover = $(".ms-np__cover");
    card.title = $(".ms-np__title");
    card.artist = $(".ms-np__artist");
    card.lyrics = $(".ms-np__lyrics");
    card.linesBox = $(".ms-np__lines");

    const openAlbum = () => idOf(track()?.album?.uri) && go("/album/" + idOf(track().album.uri));
    card.cover.onclick = openAlbum;
    card.title.onclick = openAlbum;
    card.linesBox.onclick = (e) => {
      const line = e.target.closest(".ms-np__line");
      if (line && card.synced) Spicetify.Platform.PlayerAPI.seekTo(+line.dataset.start);
    };
  }

  function showCard(panel = document.querySelector(".ms-panel")) {
    if (!panel) return;
    const on = (wasShown = isNowPlaying(panel));
    panel.classList.toggle("ms-np-on", on);
    if (!on) return;

    if (!card.el) buildCard();
    if (card.el.parentElement !== panel) {
      panel.appendChild(card.el);
      fillCard();
      syncLyrics(true);
    }
  }

  function checkSidebar() {
    const sb = sidebar();
    if (!sb) return;

    if (!sb.panel.classList.contains("ms-panel")) {
      document.querySelectorAll(".ms-panel").forEach((p) => p.classList.remove("ms-panel", "ms-np-on"));
      sb.panel.classList.add("ms-panel");
    }

    if (watched !== sb.box) {
      observer?.disconnect();
      observer = new MutationObserver(() => {
        if (!pending) pending = setTimeout(() => ((pending = 0), checkSidebar()), 200);
      });
      observer.observe(sb.box, { childList: true, subtree: true });
      watched = sb.box;
    }

    showCard(sb.panel);
    if (card.el?.isConnected && !card.title.textContent) fillCard();
  }

  function fillCard() {
    const item = track();
    if (!item || !card.el) return;

    const images = item.images || item.album?.images || [];
    const img = (images.find((i) => i.label === "xlarge") || images.find((i) => i.label === "large") || images[0])?.url;
    if (img && card.cover.getAttribute("src") !== img) card.cover.src = img;
    card.title.textContent = item.name || "";

    card.artist.textContent = "";
    (item.artists || []).forEach((artist, i) => {
      if (i) card.artist.append(", ");
      const a = document.createElement("span");
      a.className = "ms-np__artist-link";
      a.textContent = artist.name;
      a.onclick = () => go("/artist/" + idOf(artist.uri));
      card.artist.appendChild(a);
    });

    const id = idOf(item.uri);
    if (id && id !== card.trackId) {
      card.trackId = id;
      loadLyrics(id);
    }
  }

  async function fetchLyrics(id) {
    const url = `https://spclient.wg.spotify.com/color-lyrics/v2/track/${id}?format=json&vocalRemoval=false&market=from_token`;
    try {
      let res;
      if (Spicetify.CosmosAsync) {
        res = await Spicetify.CosmosAsync.get(url);
      } else {
        const token = Spicetify.Platform.AuthorizationAPI.getState().token.accessToken;
        const r = await fetch(url, { headers: { authorization: "Bearer " + token, "app-platform": "WebPlayer" } });
        res = r.ok ? await r.json() : null;
      }

      const lyrics = res?.lyrics;
      return {
        synced: lyrics?.syncType === "LINE_SYNCED",
        lines: (lyrics?.lines || [])
          .map((l) => ({ start: +l.startTimeMs, text: (l.words || "").trim() }))
          .filter((l) => l.text && l.text !== "♪"),
      };
    } catch {
      return { synced: false, lines: [] };
    }
  }

  async function loadLyrics(id) {
    showLines([], false);
    if (!card.cache.has(id)) {
      card.cache.set(id, await fetchLyrics(id));
      if (card.cache.size > 30) card.cache.delete(card.cache.keys().next().value);
    }
    const data = card.cache.get(id);
    if (id === card.trackId) showLines(data.lines, data.synced);
  }

  function showLines(lines, synced) {
    Object.assign(card, { lines, synced, current: -2 });
    if (!card.el) return;

    card.lyrics.classList.toggle("is-empty", !lines.length);
    card.lyrics.classList.toggle("is-unsynced", !synced);
    card.linesBox.style.transform = "";
    card.linesBox.innerHTML = "";

    for (const line of lines) {
      const el = document.createElement("div");
      el.className = "ms-np__line";
      el.dataset.start = line.start;
      el.textContent = line.text;
      card.linesBox.appendChild(el);
    }
    syncLyrics(true);
  }

  function syncLyrics(force) {
    if (!card.synced || !card.lines.length || !card.el?.isConnected) return;

    const pos = position();
    let i = card.lines.length - 1;
    while (i >= 0 && card.lines[i].start > pos) i--;
    if (i === card.current && !force) return;
    card.current = i;

    const els = card.linesBox.children;
    for (let k = 0; k < els.length; k++) {
      const d = Math.abs(k - i);
      els[k].className = "ms-np__line " + (d > 2 ? "is-far" : "is-" + d);
    }

    const cur = els[Math.max(i, 0)];
    if (cur) {
      const y = cur.offsetTop - card.lyrics.clientHeight / 2 + cur.offsetHeight / 2;
      card.linesBox.style.transform = `translateY(${-Math.max(y, 0)}px)`;
    }
  }

  function watchPlayer() {
    if (!track() || !window.Spicetify?.Platform?.History) return setTimeout(watchPlayer, 500);

    setInterval(() => {
      if (document.hidden) return;
      const id = idOf(track()?.uri);
      if (id && id !== card.trackId && card.el?.isConnected) {
        showCard();
        fillCard();
      }
      if (isPlaying()) syncLyrics(false);
    }, 250);

    showCard();
    fillCard();
  }

  function tooltip(el, text) {
    el.setAttribute("aria-label", text);
    if (Spicetify.Tippy && Spicetify.TippyProps) Spicetify.Tippy(el, { ...Spicetify.TippyProps, content: text });
    else el.title = text;
  }

  const appInfo = {};

  function marketplaceButton() {
    const apps = window.Spicetify?.Config?.custom_apps || [];
    const wrap = document.querySelector(".main-globalNav-historyButtonsWrapper");
    const ours = document.getElementById("ms-apps");

    if (!wrap || !apps.length || document.querySelector(".custom-navlinks-scrollable_container")) return ours?.remove();
    if (ours?.parentElement === wrap) return;

    for (const app of apps) {
      if (!(app in appInfo)) {
        appInfo[app] = null;
        fetch(`spicetify-routes-${app}.json`)
          .then((r) => r.json())
          .then((info) => (appInfo[app] = info))
          .catch(() => {});
      }
      if (!appInfo[app]) return;
    }

    const box = document.createElement("div");
    box.id = "ms-apps";
    for (const app of apps) {
      const info = appInfo[app];
      const name = info.name?.en || info.name || app;
      const btn = document.createElement("button");
      btn.className = "ms-app-btn";
      tooltip(btn, name);
      btn.innerHTML = info.icon || "";
      btn.onclick = () => go("/" + app);
      box.appendChild(btn);
    }
    wrap.appendChild(box);
  }

  const paletteIcon =
    '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 10.8C22 5.9 17.5 2 12 2Zm-5.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>';

  function paletteMenu() {
    const menu = document.createElement("div");
    menu.id = "ms-palette-menu";

    for (const name of Object.keys(SCHEMES)) {
      const c = colorsOf(name);
      const item = document.createElement("button");
      item.className = "ms-palette-item";
      item.dataset.scheme = name;
      item.innerHTML = `<span class="ms-palette-dot" style="background:radial-gradient(circle at 35% 30%,#${c["button-active"]},#${c.button} 45%,#${c.main})"></span>${name[0].toUpperCase() + name.slice(1)}`;
      item.onclick = () => {
        setColors(name, true);
        menu.classList.remove("is-open");
      };
      item.style.setProperty("-webkit-app-region", "no-drag");
      menu.appendChild(item);
    }

    const backdrop = document.createElement("div");
    backdrop.id = "ms-palette-backdrop";
    document.body.append(backdrop, menu);

    const close = () => menu.classList.remove("is-open");
    backdrop.addEventListener("pointerdown", close);
    addEventListener("keydown", (e) => e.key === "Escape" && close(), true);
    addEventListener("blur", close);
    return menu;
  }

  function paletteButton() {
    const wrap = document.querySelector(".main-globalNav-historyButtonsWrapper");
    if (!wrap || document.getElementById("ms-palette-btn")?.parentElement === wrap) return;

    const btn = document.createElement("button");
    btn.id = "ms-palette-btn";
    btn.className = "ms-app-btn";
    tooltip(btn, "Colors");
    btn.innerHTML = paletteIcon;
    btn.onclick = () => {
      const menu = document.getElementById("ms-palette-menu") || paletteMenu();
      const r = btn.getBoundingClientRect();
      menu.style.left = r.left + "px";
      menu.style.top = r.bottom + 8 + "px";
      for (const item of menu.children) item.classList.toggle("is-active", item.dataset.scheme === root.dataset.msScheme);
      menu.classList.toggle("is-open");
    };
    wrap.appendChild(btn);
  }

  function start() {
    const top = document.querySelector(".Root__top-container");
    if (!document.body || !top) return setTimeout(start, 300);

    loadColors();
    setTimeout(loadColors, 3000);
    makeSky();
    checkSidebar();
    paletteButton();
    watchPlayer();

    new MutationObserver(checkSidebar).observe(top, { childList: true });
    setInterval(() => {
      if (document.hidden) return;
      checkSidebar();
      marketplaceButton();
      paletteButton();
    }, 1000);
  }

  start();
})();
