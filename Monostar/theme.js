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
    midnight: "ffffff b3c8f5 0a1430 12204a 1a2d5c 22386d 060d22 060d22 12204a 000000 d2e2ff 5b8cff 82a8ff 34457a 1a2d5c 5b8cff ff5c7a 4fd2ff",
    sunset: "ffffff f0c9b8 1c0f12 2c171b 3d2026 4d2a30 120a0c 120a0c 2c171b 000000 ffe0cc ff8a4c ffa775 5c4038 3d2026 ff8a4c ff4d6d ff5e8a",
    crimson: "ffffff e0b4b4 0e0606 1a0b0b 261010 331515 070303 070303 1a0b0b 000000 ffd6d6 e5243b ff4d5e 4a2a2a 261010 e5243b ff8a3d ff3d6e",
  };

  const colorsOf = (name) => Object.fromEntries(SCHEMES[name].split(" ").map((hex, i) => [KEYS[i], hex]));
  const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");

  let redrawStars = () => {};

  const DEFAULTS = { pulse: true, mood: true, words: true, fx: "glow", blur: true, glass: true, intro: true, lite: false };
  const settings = { ...DEFAULTS };
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem("ms-settings")) || {});
  } catch {}
  if (!["glow", "fill", "notes", "embers"].includes(settings.fx)) settings.fx = "glow";

  function applySettings() {
    root.classList.toggle("ms-lite", settings.lite);
    root.classList.toggle("ms-no-blur", !settings.blur || settings.lite);
    root.classList.toggle("ms-no-words", !settings.words);
    root.classList.toggle("ms-no-glass", !settings.glass);
    root.dataset.msFx = settings.fx;
    if (!settings.mood || settings.lite) calmSky();
  }

  function setSetting(key, value) {
    settings[key] = value;
    try {
      localStorage.setItem("ms-settings", JSON.stringify(settings));
    } catch {}
    applySettings();
    if (key === "words" && card.lines.length) showLines(card.lines, card.synced);
  }

  let painted = null;
  let tween = 0;

  function apply(colors) {
    for (const [key, hex] of Object.entries(colors)) {
      root.style.setProperty(`--spice-${key}`, "#" + hex);
      root.style.setProperty(`--spice-rgb-${key}`, rgb(hex));
    }
  }

  function paint(colors) {
    cancelAnimationFrame(tween);
    apply(colors);
    painted = colors;
    redrawStars();
  }

  const mix = (a, b, t) =>
    [0, 2, 4]
      .map((i) => {
        const x = parseInt(a.slice(i, i + 2), 16);
        const y = parseInt(b.slice(i, i + 2), 16);
        return Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
      })
      .join("");

  function fade(colors, ms = 700) {
    const from = painted;
    if (!from || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return paint(colors);
    cancelAnimationFrame(tween);
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / ms, 1);
      const t = 1 - Math.pow(1 - p, 3);
      apply(Object.fromEntries(Object.keys(colors).map((k) => [k, mix(from[k] || colors[k], colors[k], t)])));
      if (p < 1) tween = requestAnimationFrame(step);
      else paint(colors);
    };
    tween = requestAnimationFrame(step);
  }

  function setColors(name, remember) {
    if (name !== "auto" && !SCHEMES[name]) return;
    root.dataset.msScheme = name;
    if (remember) {
      try {
        localStorage.setItem("ms-scheme", name);
      } catch {}
    }
    if (name !== "auto") return remember ? fade(colorsOf(name), 450) : paint(colorsOf(name));
    autoFor = null;
    autoColors();
  }

  const hex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255).toString(16).padStart(2, "0");
    };
    return f(0) + f(8) + f(4);
  };

  function autoPalette(h, s, h2) {
    const gray = s < 20;
    const accent = gray ? 30 : Math.min(Math.max(s, 55), 95);
    const deep = gray ? 10 : Math.min(Math.max(s * 0.7, 30), 70);
    const other = h2 ?? (h + 35) % 360;
    const list = [
      "ffffff", hex(h, 35, 80), hex(h, deep, 8), hex(h, deep, 12), hex(h, deep, 17), hex(h, deep, 21),
      hex(other, deep * 0.8, 5), hex(other, deep * 0.8, 5), hex(h, deep, 12), "000000", hex(h, 80, 86), hex(h, accent, 62),
      hex(h, accent, 72), hex(h, 18, 30), hex(h, deep, 17), hex(h, accent, 62), "ff5c6c", hex(other, Math.max(accent - 10, 50), 66),
    ];
    return Object.fromEntries(list.map((c, i) => [KEYS[i], c]));
  }

  async function coverHue(item) {
    const images = item.images || item.album?.images || [];
    const src = (images.find((i) => i.label === "small") || images[0])?.url;
    if (!src) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src.startsWith("spotify:image:") ? "https://i.scdn.co/image/" + src.split(":")[2] : src;
    try {
      await img.decode();
    } catch {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 32, 32);
    const px = ctx.getImageData(0, 0, 32, 32).data;

    const score = new Array(36).fill(0);
    const count = new Array(36).fill(0);
    const sumX = new Array(36).fill(0);
    const sumY = new Array(36).fill(0);
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
      if (d < 0.08 || l < 0.12 || l > 0.9) continue;
      const s = d / (1 - Math.abs(2 * l - 1));
      let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      const bin = Math.floor(h / 10);
      score[bin] += s;
      count[bin]++;
      sumX[bin] += Math.cos((h * Math.PI) / 180) * s;
      sumY[bin] += Math.sin((h * Math.PI) / 180) * s;
    }

    const exact = (bin) => {
      let x = 0, y = 0;
      for (const k of [bin - 1, bin, bin + 1]) {
        const j = (k + 36) % 36;
        x += sumX[j];
        y += sumY[j];
      }
      return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
    };

    const best = score.indexOf(Math.max(...score));
    if (score[best] < 3) return null;
    let second = -1;
    for (let k = 0; k < 36; k++) {
      const gap = Math.min(Math.abs(k - best), 36 - Math.abs(k - best));
      if (gap >= 5 && score[k] >= Math.max(1.5, score[best] * 0.25) && (second < 0 || score[k] > score[second])) second = k;
    }
    return [exact(best), Math.round((score[best] / count[best]) * 100), second < 0 ? null : exact(second)];
  }

  let autoFor = null;

  async function autoColors() {
    if (root.dataset.msScheme !== "auto") return;
    const item = track();
    const id = idOf(item?.uri);
    if (!id || id === autoFor) return;
    autoFor = id;
    const hue = await coverHue(item);
    if (root.dataset.msScheme !== "auto" || autoFor !== id) return;
    paintHue(hue, true);
    try {
      localStorage.setItem("ms-auto-hue", JSON.stringify(hue));
    } catch {}
  }

  function paintHue(hue, smooth) {
    const colors = autoPalette(...(hue || [220, 14, 250]));
    smooth ? fade(colors) : paint(colors);
  }

  function loadColors() {
    const saved = localStorage.getItem("ms-scheme");
    if (saved === "auto" || SCHEMES[saved]) return setColors(saved);

    const scheme = String(window.Spicetify?.Config?.color_scheme || "").toLowerCase();
    if (SCHEMES[scheme]) {
      root.dataset.msScheme = scheme;
      return;
    }

    const main = getComputedStyle(root).getPropertyValue("--spice-rgb-main").replace(/\s/g, "");
    root.dataset.msScheme = Object.keys(SCHEMES).find((s) => rgb(colorsOf(s).main) === main) || "clean";
  }

  const savedScheme = localStorage.getItem("ms-scheme");
  if (SCHEMES[savedScheme]) setColors(savedScheme);
  if (savedScheme === "auto") {
    root.dataset.msScheme = "auto";
    try {
      paintHue(JSON.parse(localStorage.getItem("ms-auto-hue")));
    } catch {}
  }

  function makeSky() {
    if (document.getElementById("ms-sky")) return;

    const sky = document.createElement("div");
    const canvas = document.createElement("canvas");
    const sparkles = document.createElement("div");
    const shooting = document.createElement("div");
    sky.id = "ms-sky";
    sparkles.className = "ms-sparkles";
    shooting.className = "ms-shooting";
    const aura = document.createElement("div");
    aura.className = "ms-aura";
    sky.append(aura, canvas, sparkles, shooting);
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
        s.style.animationDuration = `calc(${(2.5 + Math.random() * 3.5).toFixed(2)}s * var(--ms-pace, 1))`;
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
    skyLayers = [canvas, sparkles];

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

  let skyLayers = [];
  const beat = { id: null, times: [], last: 0, sections: [], tempo: 120, energy: -1 };
  const calm = matchMedia("(prefers-reduced-motion: reduce)");

  let coolUntil = 0;

  async function spGet(url) {
    if (Date.now() < coolUntil) throw new Error("busy");
    const token = Spicetify.Platform?.AuthorizationAPI?.getState?.()?.token?.accessToken;
    if (!token) return Spicetify.CosmosAsync ? Spicetify.CosmosAsync.get(url) : null;
    const r = await fetch(url, { headers: { authorization: "Bearer " + token, "app-platform": "WebPlayer" } });
    if (r.status === 429 || r.status >= 500) {
      coolUntil = Date.now() + Math.min(Math.max(+r.headers.get("retry-after") || 60, 20), 300) * 1000;
      throw new Error("busy");
    }
    return r.ok ? r.json() : null;
  }

  async function loadBeats(item) {
    const id = idOf(item?.uri);
    if (!id || id === beat.id) return;
    beat.id = id;
    beat.times = [];
    beat.sections = [];
    beat.last = 0;
    if (!item.uri.startsWith("spotify:track:")) return calmSky();
    try {
      const data = await spGet(`https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/${id}?format=json`);
      if (beat.id !== id) return;
      beat.times = (data?.beats || []).filter((b) => b.confidence > 0.25).map((b) => b.start * 1000);
      beat.sections = (data?.sections || []).map((x) => ({ start: x.start * 1000, loudness: x.loudness }));
      beat.tempo = data?.track?.tempo || 120;
    } catch {}
  }

  function calmSky() {
    beat.energy = -1;
    root.style.removeProperty("--ms-energy");
    root.style.removeProperty("--ms-pace");
  }

  function updateMood() {
    if (!settings.mood || settings.lite || !beat.sections.length) return;
    const pos = position();
    let sec = beat.sections[0];
    for (const x of beat.sections) if (x.start <= pos) sec = x;
    const energy = Math.round(Math.min(Math.max((sec.loudness + 16) / 12, 0), 1) * 20) / 20;
    if (energy === beat.energy) return;
    beat.energy = energy;
    root.style.setProperty("--ms-energy", energy);
    root.style.setProperty("--ms-pace", Math.min(Math.max(118 / beat.tempo, 0.6), 1.5).toFixed(2));
  }

  function pulse() {
    if (root.classList.contains("ms-resizing")) return;
    const e = beat.energy < 0 ? 0.5 : beat.energy;
    for (const layer of skyLayers) {
      layer.animate([{ opacity: 0.85 + e * 0.15 }, {}], { duration: 260 + e * 160, easing: "ease-out" });
    }
  }

  function scheduleBeats() {
    if (!settings.pulse || settings.lite || !beat.times.length || !isPlaying() || calm.matches) return;
    const pos = position();
    if (pos < beat.last - 1000) beat.last = pos;
    for (const t of beat.times) {
      if (t <= Math.max(pos, beat.last)) continue;
      if (t > pos + 300) break;
      setTimeout(pulse, t - pos);
      beat.last = t;
    }
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

  const card = { el: null, lines: [], words: [], synced: false, trackId: null, current: -2, cache: new Map() };
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
      if (idOf(artist.uri)) a.onclick = () => go("/artist/" + idOf(artist.uri));
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
      const lyrics = (await spGet(url))?.lyrics;
      return {
        ok: true,
        synced: lyrics?.syncType === "LINE_SYNCED" || lyrics?.syncType === "SYLLABLE_SYNCED",
        lines: (lyrics?.lines || [])
          .map((l) => ({ start: +l.startTimeMs, raw: l.words || "", text: (l.words || "").trim(), syllables: l.syllables || [] }))
          .filter((l) => l.text && l.text !== "♪"),
      };
    } catch {
      return { ok: false, synced: false, lines: [] };
    }
  }

  let lyricsTimer = 0;

  async function loadLyrics(id) {
    clearTimeout(lyricsTimer);
    showLines([], false);
    if (!card.cache.has(id)) {
      await new Promise((r) => (lyricsTimer = setTimeout(r, 1200)));
      if (id !== card.trackId) return;
      const data = await fetchLyrics(id);
      if (!data.ok) {
        if (id === card.trackId) lyricsTimer = setTimeout(() => id === card.trackId && loadLyrics(id), Math.max(coolUntil - Date.now(), 15000));
        return;
      }
      card.cache.set(id, data);
      if (card.cache.size > 30) card.cache.delete(card.cache.keys().next().value);
    }
    const data = card.cache.get(id);
    if (id === card.trackId) showLines(data.lines, data.synced);
  }

  function wordsOf(line, next) {
    const syl = line.syllables;
    if (syl.length && syl.every((x) => +x.numChars > 0)) {
      let at = 0;
      return syl.map((x) => ({ text: line.raw.slice(at, (at += +x.numChars)), start: +x.startTimeMs }));
    }

    const parts = line.text.split(/(?<=\s)/);
    const chars = line.text.length;
    const room = next ? next.start - line.start - 200 : chars * 80;
    const span = Math.max(Math.min(room, chars * 80), 400);
    let done = 0;
    return parts.map((text) => {
      const start = line.start + (done / chars) * span;
      done += text.length;
      return { text, start };
    });
  }

  function showLines(lines, synced) {
    Object.assign(card, { lines, synced, current: -2, words: [] });
    if (!card.el) return;

    card.lyrics.classList.toggle("is-empty", !lines.length);
    card.lyrics.classList.toggle("is-unsynced", !synced);
    card.linesBox.style.transform = "";
    card.linesBox.innerHTML = "";

    lines.forEach((line, i) => {
      const el = document.createElement("div");
      el.className = "ms-np__line";
      el.dataset.start = line.start;
      if (synced && settings.words) {
        const words = wordsOf(line, lines[i + 1]);
        const end = lines[i + 1] ? lines[i + 1].start : words[words.length - 1].start + 600;
        card.words[i] = words.map((w, k) => {
          const span = document.createElement("span");
          span.className = "ms-w";
          span.textContent = w.text;
          const until = k + 1 < words.length ? words[k + 1].start : Math.min(end, w.start + 700);
          span.style.setProperty("--ms-d", Math.max(until - w.start, 120) + "ms");
          el.appendChild(span);
          return { start: w.start, el: span };
        });
      } else {
        el.textContent = line.text;
      }
      card.linesBox.appendChild(el);
    });
    syncLyrics(true);
  }

  let wordTimer = 0;

  function tickWords() {
    clearTimeout(wordTimer);
    wordTimer = 0;
    const words = card.words[card.current];
    if (!words || !card.el?.isConnected) return;
    const pos = position() + 60;
    words[0].el.parentElement.classList.toggle("is-pre", words[0].start > pos);
    for (const w of words) {
      const sung = w.start <= pos;
      if (sung && !w.el.classList.contains("is-sung") && pos - w.start < 500) sparkle(w.el);
      w.el.classList.toggle("is-sung", sung);
    }
    if (isPlaying() && !document.hidden) wordTimer = setTimeout(tickWords, 50);
  }

  const NOTES = ["♪", "♫", "♩", "♬"];

  function sparkle(word) {
    const fx = settings.fx;
    if ((fx !== "notes" && fx !== "embers") || calm.matches) return;
    const embers = fx === "embers";
    const count = embers ? 3 + ((Math.random() * 3) | 0) : Math.random() < 0.6 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = embers ? "ms-fx ms-ember" : "ms-fx";
      if (embers) {
        const size = (2 + Math.random() * 3.5).toFixed(1) + "px";
        p.style.width = p.style.height = size;
        p.style.animationDuration = (1.1 + Math.random() * 0.9).toFixed(2) + "s";
      } else {
        p.textContent = NOTES[(Math.random() * NOTES.length) | 0];
      }
      p.style.left = 5 + Math.random() * 90 + "%";
      p.style.setProperty("--x", (Math.random() * 30 - 15).toFixed(1) + "px");
      p.style.setProperty("--y", -(24 + Math.random() * 22).toFixed(0) + "px");
      p.style.setProperty("--r", (Math.random() * 50 - 25).toFixed(0) + "deg");
      p.style.animationDelay = i * (embers ? 70 : 140) + "ms";
      p.addEventListener("animationend", () => p.remove());
      word.appendChild(p);
    }
  }

  function syncLyrics(force) {
    if (!card.synced || !card.lines.length || !card.el?.isConnected) return;

    const pos = position();
    let i = card.lines.length - 1;
    while (i > 0 && card.lines[i].start > pos) i--;
    if (i === card.current && !force) {
      if (!wordTimer) tickWords();
      return;
    }
    card.current = i;
    tickWords();

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
      checkSongEnd();
      if (document.hidden) return;
      autoColors();
      loadBeats(track());
      scheduleBeats();
      const id = idOf(track()?.uri);
      if (id && id !== card.trackId && card.el?.isConnected) {
        showCard();
        fillCard();
      }
      updateMood();
      syncLyrics(false);
      Promise.resolve(Spicetify.Platform.PlaybackAPI?.getVolume?.())
        .then((v) => typeof v === "number" && root.style.setProperty("--ms-vol", Math.round(v * 100) + "%"))
        .catch(() => {});
    }, 250);

    Spicetify.Player?.addEventListener?.("songchange", checkSongEnd);

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
    box.style.webkitAppRegion = "no-drag";
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

  let backdrop = null;

  function closeMenus() {
    document.querySelectorAll(".ms-menu.is-open").forEach((m) => m.classList.remove("is-open"));
    backdrop?.classList.remove("is-open");
  }

  function makeMenu(id, items) {
    const menu = document.createElement("div");
    menu.id = id;
    menu.className = "ms-menu";

    for (const { label, dot, key, onClick, toggle, heading, segment } of items) {
      if (heading) {
        menu.insertAdjacentHTML("beforeend", `<div class="ms-menu-heading">${heading}</div>`);
        continue;
      }
      if (segment) {
        const box = document.createElement("div");
        box.className = "ms-seg";
        for (const [value, text] of segment.options) {
          const b = document.createElement("button");
          b.textContent = text;
          b.dataset.value = value;
          b.onclick = () => {
            segment.set(value);
            box.sync();
          };
          box.appendChild(b);
        }
        box.sync = () => [...box.children].forEach((b) => b.classList.toggle("is-active", b.dataset.value === segment.get()));
        menu.appendChild(box);
        continue;
      }
      const item = document.createElement("button");
      item.className = toggle ? "ms-menu-item ms-menu-toggle" : "ms-menu-item";
      item.dataset.key = key;
      item.innerHTML = (dot ? `<span class="ms-menu-dot" style="background:${dot}"></span>` : "") + label;
      if (toggle) item.insertAdjacentHTML("beforeend", '<span class="ms-switch"></span>');
      item.onclick = () => {
        onClick();
        if (!toggle) return closeMenus();
        menu.querySelectorAll(".ms-menu-toggle").forEach((t) => t.sync());
      };
      if (toggle) item.sync = () => item.classList.toggle("is-on", toggle());
      menu.appendChild(item);
    }

    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "ms-backdrop";
      backdrop.addEventListener("pointerdown", closeMenus);
      addEventListener("keydown", (e) => e.key === "Escape" && closeMenus(), true);
      addEventListener("blur", closeMenus);
      document.body.appendChild(backdrop);
    }
    document.body.appendChild(menu);
    return menu;
  }

  function openMenu(menu, btn, activeKey) {
    const wasOpen = menu.classList.contains("is-open");
    closeMenus();
    if (wasOpen) return;
    const r = btn.getBoundingClientRect();
    menu.style.left = r.left + "px";
    menu.style.top = r.bottom + 8 + "px";
    for (const item of menu.children) {
      if (item.sync) item.sync();
      else if (item.dataset.key) item.classList.toggle("is-active", item.dataset.key === activeKey);
    }
    menu.classList.add("is-open");
    backdrop.classList.add("is-open");
  }

  function topButton(id, label, icon, onClick) {
    const wrap = document.querySelector(".main-globalNav-historyButtonsWrapper");
    if (!wrap || document.getElementById(id)?.parentElement === wrap) return;

    const btn = document.getElementById(id) || document.createElement("button");
    if (!btn.id) {
      btn.id = id;
      btn.className = "ms-app-btn";
      btn.style.cssText = `-webkit-app-region:no-drag;position:relative;flex-shrink:0;margin-left:4px;order:${{ "ms-palette-btn": 99, "ms-sleep-btn": 100, "ms-settings-btn": 101 }[id] || 99}`;
      btn.innerHTML = icon;
      tooltip(btn, label);
      btn.onclick = () => onClick(btn);
    }
    wrap.appendChild(btn);
  }

  let paletteList = null;

  function paletteButton() {
    topButton("ms-palette-btn", "Colors", paletteIcon, (btn) => {
      paletteList ||= makeMenu("ms-palette-menu", [
        {
          key: "auto",
          label: "Auto",
          dot: "conic-gradient(#ff6fb5,#ffa775,#ffe066,#4fd18b,#7aa8ff,#b48cff,#ff6fb5)",
          onClick: () => setColors("auto", true),
        },
        ...Object.keys(SCHEMES).map((name) => {
          const c = colorsOf(name);
          return {
            key: name,
            label: name[0].toUpperCase() + name.slice(1),
            dot: `radial-gradient(circle at 35% 30%,#${c["button-active"]},#${c.button} 45%,#${c.main})`,
            onClick: () => setColors(name, true),
          };
        }),
      ]);
      openMenu(paletteList, btn, root.dataset.msScheme);
    });
  }

  const moonIcon =
    '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M20.7 14.6A8.6 8.6 0 0 1 9.4 3.3a.8.8 0 0 0-1-1A10.2 10.2 0 1 0 21.7 15.6a.8.8 0 0 0-1-1Z"/></svg>';

  const sleep = { end: 0, endOfSong: false, songId: null, timers: [], badge: 0, volume: null };
  let sleepList = null;

  function later(fn, ms) {
    sleep.timers.push(setTimeout(fn, Math.max(ms, 0)));
  }

  function setSleep(minutes) {
    sleep.timers.forEach(clearTimeout);
    sleep.timers = [];
    if (sleep.volume !== null) Spicetify.Platform.PlaybackAPI.setVolume(sleep.volume);
    sleep.volume = null;

    sleep.end = minutes > 0 ? Date.now() + minutes * 60000 : 0;
    sleep.endOfSong = minutes === -1;
    sleep.key = sleep.endOfSong ? "end" : sleep.end ? String(minutes) : "off";
    sleep.songId = idOf(track()?.uri);

    if (sleep.end) scheduleFade(minutes * 60000);
    if (sleep.endOfSong) scheduleSongEnd();

    clearInterval(sleep.badge);
    if (sleep.end || sleep.endOfSong) sleep.badge = setInterval(showBadge, 15000);
    showBadge();
  }

  async function scheduleFade(ms) {
    const fade = Math.min(10000, ms);
    const api = Spicetify.Platform.PlaybackAPI;

    later(async () => {
      sleep.volume = await api.getVolume();
      for (let i = 1; i <= 20; i++) later(() => api.setVolume(sleep.volume * (1 - i / 20)), (fade / 20) * i);
    }, ms - fade);

    later(async () => {
      await Spicetify.Platform.PlayerAPI.pause();
      setSleep(0);
    }, ms + 300);
  }

  function scheduleSongEnd() {
    sleep.timers.forEach(clearTimeout);
    sleep.timers = [];
    const left = (state()?.duration || 0) - position();
    sleep.songEndAt = Date.now() + left;
    sleep.wasPlaying = isPlaying();
    if (sleep.wasPlaying) later(stopSong, left - 400);
  }

  function stopSong() {
    Spicetify.Platform.PlayerAPI.pause();
    setSleep(0);
  }

  function checkSongEnd() {
    if (!sleep.endOfSong) return;
    if (idOf(track()?.uri) !== sleep.songId) return stopSong();
    const left = (state()?.duration || 0) - position();
    if (isPlaying() !== sleep.wasPlaying || Math.abs(Date.now() + left - sleep.songEndAt) > 1500) scheduleSongEnd();
  }

  function showBadge() {
    const btn = document.getElementById("ms-sleep-btn");
    const on = !!(sleep.end || sleep.endOfSong);
    btn?.classList.toggle("is-on", on);
    if (!on) return btn?.removeAttribute("data-left");
    btn?.setAttribute("data-left", sleep.endOfSong ? "♪" : Math.max(1, Math.ceil((sleep.end - Date.now()) / 60000)) + "m");
  }

  function sleepButton() {
    topButton("ms-sleep-btn", "Sleep timer", moonIcon, (btn) => {
      sleepList ||= makeMenu("ms-sleep-menu", [
        { key: "15", label: "15 minutes", onClick: () => setSleep(15) },
        { key: "30", label: "30 minutes", onClick: () => setSleep(30) },
        { key: "60", label: "1 hour", onClick: () => setSleep(60) },
        { key: "end", label: "End of song", onClick: () => setSleep(-1) },
        { key: "off", label: "Off", onClick: () => setSleep(0) },
      ]);
      openMenu(sleepList, btn, sleep.key || "off");
    });
  }

  const gearIcon =
    '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.3 7.3 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.5 8.8a.5.5 0 0 0 .1.6L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3c.1.2.4.3.6.2l2.4-1c.5.4 1.1.7 1.7 1l.4 2.6c0 .2.2.4.5.4h3.8c.3 0 .5-.2.5-.4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.4 1c.2.1.5 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>';

  let settingsList = null;

  function settingsButton() {
    topButton("ms-settings-btn", "Settings", gearIcon, (btn) => {
      const item = (key, label) => ({ key, label, toggle: () => settings[key], onClick: () => setSetting(key, !settings[key]) });
      settingsList ||= makeMenu("ms-settings-menu", [
        { heading: "Sky" },
        item("pulse", "Stars pulse to the beat"),
        item("mood", "Sky follows the song"),
        { heading: "Lyrics" },
        item("words", "Word by word"),
        item("blur", "Blur nearby lines"),
        { heading: "Word effect" },
        {
          segment: {
            options: [["glow", "Glow"], ["fill", "Fill"], ["notes", "Notes"], ["embers", "Embers"]],
            get: () => settings.fx,
            set: (v) => setSetting("fx", v),
          },
        },
        { heading: "Other" },
        item("glass", "Glass and blur"),
        item("intro", "Intro on startup"),
        item("lite", "Performance mode"),
      ]);
      openMenu(settingsList, btn);
    });
  }

  function intro() {
    if (!document.body) return setTimeout(intro, 20);
    if (!settings.intro) return;
    try {
      if (sessionStorage.getItem("ms-intro")) return;
      sessionStorage.setItem("ms-intro", "1");
    } catch {}

    const el = document.createElement("div");
    el.id = "ms-intro";
    el.innerHTML = `<div class="ms-intro__star">✦</div><div class="ms-intro__name">${"Monostar"
      .split("")
      .map((ch, i) => `<span style="animation-delay:${0.15 + i * 0.05}s">${ch}</span>`)
      .join("")}</div><div class="ms-intro__by">created by Tobko <span>♡</span></div>`;
    document.body.appendChild(el);

    const shown = Date.now();
    const ready = () => document.querySelector("#main-view section, #main-view main > *");
    const hide = () => {
      if (el.classList.contains("is-done")) return;
      el.classList.add("is-done");
      setTimeout(() => el.remove(), 700);
    };
    const wait = setInterval(() => {
      if ((ready() && Date.now() - shown > 1400) || Date.now() - shown > 8000) {
        clearInterval(wait);
        hide();
      }
    }, 100);
  }

  intro();

  if (document.querySelector("style.marketplaceUserCSS") && !document.getElementById("ms-css")) {
    fetch("https://cdn.jsdelivr.net/gh/brutaltobko/monostar@main/Monostar/user.css")
      .then((r) => (r.ok ? r.text() : ""))
      .then((css) => {
        if (!css) return;
        const st = document.createElement("style");
        st.id = "ms-css";
        st.textContent = css;
        document.head.appendChild(st);
      })
      .catch(() => {});
  }

  function start() {
    const top = document.querySelector(".Root__top-container");
    if (!document.body || !top) return setTimeout(start, 300);

    loadColors();
    setTimeout(loadColors, 3000);
    makeSky();
    checkSidebar();
    applySettings();
    paletteButton();
    sleepButton();
    settingsButton();
    watchPlayer();

    new MutationObserver(checkSidebar).observe(top, { childList: true });
    setInterval(() => {
      if (document.hidden) return;
      checkSidebar();
      marketplaceButton();
      paletteButton();
      sleepButton();
      settingsButton();
      document.querySelectorAll("#global-nav-bar [title]").forEach((el) => el.removeAttribute("title"));
    }, 1000);
  }

  start();
})();
