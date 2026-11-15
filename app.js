/* ============================================================
   Planboard · Tableros de actividades estilo Trello
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Constantes ---------- */

  const STORAGE_KEY = "planboard.state.v1";
  const ACTIVE_KEY = "planboard.activeBoard.v1";

  /* ============================================================
     Colaboración en línea (Firebase Realtime Database)
     ------------------------------------------------------------
     OPCIONAL. Normalmente no hace falta tocar nada aquí: en la
     app, pulsa "Compartir" y pega ahí tu configuración de
     Firebase (o solo la databaseURL). Se guarda en este
     navegador y el enlace compartido la lleva incluida.

     Si prefieres fijarla en el código, rellena estos valores con
     los de TU proyecto (Consola de Firebase > Configuración del
     proyecto > Tus apps > Configuración del SDK).
     ============================================================ */
  const FIREBASE_CONFIG = {
    apiKey: "REEMPLAZA_API_KEY",
    authDomain: "REEMPLAZA.firebaseapp.com",
    databaseURL: "https://REEMPLAZA-default-rtdb.firebaseio.com",
    projectId: "REEMPLAZA",
    storageBucket: "REEMPLAZA.appspot.com",
    messagingSenderId: "REEMPLAZA",
    appId: "REEMPLAZA"
  };
  const SHARE_PARAM = "b";

  const STATUSES = {
    planificada: { label: "Planificada", dot: "#8590a2", pill: "#e9edf2", text: "#44546f" },
    en_proceso: { label: "En proceso", dot: "#e2b203", pill: "#fff3c4", text: "#7f5f01" },
    ejecutada: { label: "Ejecutada", dot: "#22a06b", pill: "#dcfff1", text: "#216e4e" }
  };
  const STATUS_KEYS = ["planificada", "en_proceso", "ejecutada"];

  const LABEL_COLORS = [
    { name: "Verde", value: "#61bd4f", text: "#093d0b" },
    { name: "Amarillo", value: "#f2d600", text: "#4d3b00" },
    { name: "Naranja", value: "#ff9f1a", text: "#4b2c00" },
    { name: "Rojo", value: "#eb5a46", text: "#ffffff" },
    { name: "Morado", value: "#c377e0", text: "#ffffff" },
    { name: "Azul", value: "#0079bf", text: "#ffffff" },
    { name: "Celeste", value: "#00c2e0", text: "#043b45" },
    { name: "Lima", value: "#51e898", text: "#064a2b" },
    { name: "Rosa", value: "#ff78cb", text: "#4d0f38" },
    { name: "Negro", value: "#344563", text: "#ffffff" }
  ];

  const BACKGROUNDS = [
    { id: "azul", name: "Azul", css: "linear-gradient(135deg,#0c66e4 0%,#0747a6 100%)" },
    { id: "turquesa", name: "Turquesa", css: "linear-gradient(135deg,#0f8a9d 0%,#075a6b 100%)" },
    { id: "violeta", name: "Violeta", css: "linear-gradient(135deg,#7b4fd6 0%,#4b2a91 100%)" },
    { id: "rosa", name: "Rosa", css: "linear-gradient(135deg,#c7487f 0%,#7d2652 100%)" },
    { id: "atardecer", name: "Atardecer", css: "linear-gradient(135deg,#d9662f 0%,#8c2f2f 100%)" },
    { id: "bosque", name: "Bosque", css: "linear-gradient(135deg,#2e7d5b 0%,#14503a 100%)" },
    { id: "grafito", name: "Grafito", css: "linear-gradient(135deg,#44546f 0%,#1c2b45 100%)" },
    { id: "oceano", name: "Océano", css: "linear-gradient(135deg,#1773b0 0%,#0a3559 100%)" }
  ];

  const ICON = {
    star: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starFill: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    checklist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    desc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 10H3M21 6H3M21 14H3M17 18H3"/></svg>',
    paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.05 12.25 20.2a6 6 0 0 1-8.49-8.49l8.49-8.49a4 4 0 0 1 5.66 5.66l-8.49 8.49a2 2 0 0 1-2.83-2.83l7.78-7.78"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
  };

  /* ---------- Utilidades ---------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const uid = (prefix) => prefix + Math.random().toString(36).slice(2, 9);

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function isoOffset(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function formatDue(iso) {
    if (!iso) return "";
    const parts = iso.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (Number.isNaN(date.getTime())) return iso;
    try {
      return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date).replace(".", "");
    } catch (err) {
      return iso;
    }
  }

  function formatDateLong(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(date);
    } catch (err) {
      return "";
    }
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const parts = iso.split("-").map(Number);
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function dueHint(iso) {
    const days = daysUntil(iso);
    if (days === null) return "";
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    if (days > 1) return "Vence en " + days + " días";
    if (days === -1) return "Venció ayer";
    return "Venció hace " + Math.abs(days) + " días";
  }

  function isOverdue(card) {
    if (!card || !card.dueDate || card.status === "ejecutada") return false;
    const days = daysUntil(card.dueDate);
    return days !== null && days < 0;
  }

  function labelTextColor(value) {
    const found = LABEL_COLORS.find((c) => c.value === value);
    return found ? found.text : "#ffffff";
  }

  function getBg(id) {
    return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS[0];
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatSize(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(size < 10240 ? 1 : 0) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  function fileExtension(name) {
    const match = /\.([A-Za-z0-9]{1,5})$/.exec(String(name || ""));
    return match ? match[1].toUpperCase() : "DOC";
  }

  /* Los documentos se guardan en IndexedDB para no llenar localStorage.
     En el estado solo se guardan sus datos descriptivos. */
  const FILE_DB = "planboard-files";
  const FILE_STORE = "files";
  let fileDbPromise = null;

  function openFileDB() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    if (!fileDbPromise) {
      fileDbPromise = new Promise((resolve) => {
        const request = indexedDB.open(FILE_DB, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    }
    return fileDbPromise;
  }

  function filePut(key, blob) {
    return openFileDB().then((db) => {
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(FILE_STORE, "readwrite");
        tx.objectStore(FILE_STORE).put(blob, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    });
  }

  function fileGet(key) {
    return openFileDB().then((db) => {
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(FILE_STORE, "readonly");
        const request = tx.objectStore(FILE_STORE).get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    });
  }

  function fileDelete(key) {
    return openFileDB().then((db) => {
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(FILE_STORE, "readwrite");
        tx.objectStore(FILE_STORE).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    });
  }

  function makeLabels() {
    const defs = [
      ["Prioridad alta", "#eb5a46"],
      ["Prioridad media", "#ff9f1a"],
      ["Planificación", "#0079bf"],
      ["En revisión", "#f2d600"],
      ["Diseño", "#c377e0"],
      ["Cliente", "#61bd4f"],
      ["Documentación", "#00c2e0"],
      ["Marketing", "#ff78cb"]
    ];
    return defs.map((def) => ({ id: uid("lb"), name: def[0], color: def[1] }));
  }

  function templateLists() {
    return ["Pendientes", "Planificadas", "En proceso", "Ejecutadas"].map((name) => ({
      id: uid("l"),
      name: name,
      cards: []
    }));
  }

  /* ---------- Estado y persistencia ---------- */

  function safeId(value, prefix) {
    if (typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value)) return value;
    return uid(prefix);
  }

  function normalizeState(data) {
    if (!data || !Array.isArray(data.boards)) return null;
    data.boards.forEach((board) => {
      board.id = safeId(board.id, "b");
      board.name = typeof board.name === "string" && board.name.trim() ? board.name : "Tablero sin título";
      board.bg = getBg(board.bg).id;
      board.starred = !!board.starred;
      board.labels = Array.isArray(board.labels) ? board.labels : [];
      board.labels.forEach((label) => {
        label.id = safeId(label.id, "lb");
        label.name = typeof label.name === "string" ? label.name : "";
        label.color = LABEL_COLORS.some((c) => c.value === label.color)
          ? label.color
          : LABEL_COLORS[0].value;
      });
      board.lists = Array.isArray(board.lists) ? board.lists : [];
      board.lists.forEach((list) => {
        list.id = safeId(list.id, "l");
        list.name = typeof list.name === "string" && list.name.trim() ? list.name : "Lista";
        list.cards = Array.isArray(list.cards) ? list.cards : [];
        list.cards.forEach((card) => {
          card.id = safeId(card.id, "c");
          card.title = typeof card.title === "string" ? card.title : "Sin título";
          card.desc = typeof card.desc === "string" ? card.desc : "";
          card.status = STATUSES[card.status] ? card.status : "planificada";
          card.dueDate = typeof card.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(card.dueDate)
            ? card.dueDate
            : "";
          card.labels = Array.isArray(card.labels) ? card.labels : [];
          card.checklist = Array.isArray(card.checklist) ? card.checklist : [];
          card.checklist.forEach((item) => {
            item.id = safeId(item.id, "i");
            item.text = typeof item.text === "string" ? item.text : "";
            item.done = !!item.done;
          });
          card.attachments = Array.isArray(card.attachments) ? card.attachments : [];
          card.attachments.forEach((file) => {
            file.id = safeId(file.id, "at");
            file.name = typeof file.name === "string" ? file.name : "documento";
            file.type = typeof file.type === "string" ? file.type : "";
            file.size = typeof file.size === "number" ? file.size : 0;
            file.addedAt = file.addedAt || new Date().toISOString();
          });
          card.createdAt = card.createdAt || new Date().toISOString();
        });
      });
    });
    return data;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalizeState(JSON.parse(raw));
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn("No se pudo leer el estado guardado:", err);
    }
    return seedState();
  }

  function storageAvailable() {
    try {
      const key = "__planboard_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  let storageWarned = false;
  function notifyStorageError() {
    if (storageWarned) return;
    storageWarned = true;
    if (typeof toast === "function") {
      toast("No se pudo guardar: el navegador bloquea el almacenamiento local");
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const board = currentBoard();
      if (board) localStorage.setItem(ACTIVE_KEY, board.id);
    } catch (err) {
      console.warn("No se pudo guardar el estado:", err);
      notifyStorageError();
    }
    scheduleCloudPush();
  }

  /* Pequeña confirmación visual de que los cambios se han guardado. */
  let saveFlashTimer = null;
  function flashSaved() {
    const el = $("#detailSaveState");
    if (!el) return;
    el.textContent = "Guardado ✓";
    el.classList.add("is-saved");
    clearTimeout(saveFlashTimer);
    saveFlashTimer = setTimeout(() => {
      el.classList.remove("is-saved");
      el.textContent = "Los cambios se guardan automáticamente";
    }, 1400);
  }

  /* ---------- Colaboración en línea (Firebase) ---------- */

  const CLOUD_KEY = "planboard.firebase.v1";

  function b64urlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function b64urlDecode(str) {
    let s = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return decodeURIComponent(escape(atob(s)));
  }

  /* Acepta un objeto de configuración de Firebase, su JSON como texto,
     o directamente la URL de la base de datos. */
  function normalizeCloudConfig(input) {
    if (!input) return null;
    if (typeof input === "string") {
      const text = input.trim();
      if (!text) return null;
      if (/^https?:\/\//i.test(text)) return { databaseURL: text };
      try {
        return normalizeCloudConfig(JSON.parse(text));
      } catch (err) {
        return null;
      }
    }
    if (typeof input !== "object") return null;
    const url = String(
      input.databaseURL || input.databaseUrl || input.database_url || ""
    ).trim();
    if (!url || !/^https?:\/\//i.test(url)) return null;
    return {
      apiKey: input.apiKey,
      authDomain: input.authDomain,
      databaseURL: url,
      projectId: input.projectId,
      storageBucket: input.storageBucket,
      messagingSenderId: input.messagingSenderId,
      appId: input.appId
    };
  }

  function cloudConfig() {
    /* 1) Configuración fijada en el código (opcional). */
    if (
      FIREBASE_CONFIG &&
      FIREBASE_CONFIG.databaseURL &&
      !/REEMPLAZA/.test(FIREBASE_CONFIG.databaseURL)
    ) {
      return normalizeCloudConfig(FIREBASE_CONFIG);
    }
    /* 2) Configuración guardada en este navegador. */
    try {
      const raw = localStorage.getItem(CLOUD_KEY);
      if (raw) {
        const cfg = normalizeCloudConfig(JSON.parse(raw));
        if (cfg) return cfg;
      }
    } catch (err) { /* ignore */ }
    return null;
  }

  function saveCloudConfig(cfg) {
    try {
      if (cfg) localStorage.setItem(CLOUD_KEY, JSON.stringify(cfg));
      else localStorage.removeItem(CLOUD_KEY);
    } catch (err) { /* ignore */ }
  }

  function firebaseConfigured() {
    return !!cloudConfig();
  }

  /* ¿La app se está sirviendo desde el servidor local con SQL Server?
     Si es así, ese pasa a ser el almacén principal (por encima de Firebase). */
  async function detectApiBackend() {
    try {
      const res = await fetch("/api/info", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.backend === "sqlserver") return data;
    } catch (err) { /* sin servidor local: seguimos con Firebase o en local */ }
    return null;
  }

  function ensureBackend() {
    if (!cloud.probe) {
      cloud.probe = (async () => {
        const api = await detectApiBackend();
        if (api) {
          cloud.mode = "api";
          cloud.publicUrl = api.publicUrl || "";
          return "api";
        }
        if (firebaseConfigured()) {
          cloud.mode = "firebase";
          return "firebase";
        }
        cloud.mode = null;
        return null;
      })();
    }
    return cloud.probe;
  }

  async function refreshPublicUrl() {
    if (cloud.mode !== "api") return;
    try {
      const res = await fetch("/api/info", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.publicUrl) cloud.publicUrl = data.publicUrl;
      }
    } catch (err) { /* ignore */ }
  }

  function resetCloudState() {
    if (cloud.ref) {
      try { cloud.ref.off(); } catch (err) { /* ignore */ }
    }
    stopApiPolling();
    cloud.ready = false;
    cloud.db = null;
    cloud.shareId = null;
    cloud.ref = null;
    cloud.connecting = null;
  }

  function initCloud() {
    if (cloud.ready) return true;
    const cfg = cloudConfig();
    if (!cfg) return false;
    if (typeof firebase === "undefined") {
      console.warn("El SDK de Firebase no se ha cargado.");
      return false;
    }
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
      cloud.db = firebase.database();
      cloud.ready = true;
      return true;
    } catch (err) {
      console.warn("No se pudo iniciar Firebase:", err);
      cloud.ready = false;
      return false;
    }
  }

  function randomShareId() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function hashParams() {
    return new URLSearchParams(location.hash.replace(/^#/, ""));
  }

  /* ¿La app se está viendo ya por el enlace público (no localhost)? */
  function viewingFromPublicOrigin() {
    if (location.protocol === "file:") return false;
    return !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  }

  /* Base del enlace de compartir en modo SQL Server: si ya estás dentro por el
     enlace público, se usa tal cual (así funciona aunque el servidor acabe de
     arrancar y aún no conociera su URL); si no, la que reporta el servidor. */
  function apiShareBase() {
    if (viewingFromPublicOrigin()) return location.origin;
    return cloud.publicUrl || location.origin;
  }

  function shareUrlFor(shareId) {
    const params = new URLSearchParams();
    params.set(SHARE_PARAM, shareId);
    /* Con SQL Server local, el enlace apunta al túnel público (si existe). */
    if (cloud.mode === "api") {
      const base = apiShareBase().replace(/\/+$/, "");
      const pathName = location.pathname && location.pathname !== "/" ? location.pathname : "/";
      return base + pathName + "#" + params.toString();
    }
    /* El enlace lleva la conexión para que quien lo abra no configure nada. */
    const cfg = cloudConfig();
    if (cfg && cfg.databaseURL) params.set("c", b64urlEncode(JSON.stringify(cfg)));
    return location.origin + location.pathname + "#" + params.toString();
  }

  function readShareIdFromUrl() {
    const fromHash = hashParams().get(SHARE_PARAM);
    if (fromHash) return fromHash;
    return new URLSearchParams(location.search).get(SHARE_PARAM);
  }

  function applyCloudFromUrl() {
    const raw =
      hashParams().get("c") || new URLSearchParams(location.search).get("c");
    if (!raw) return;
    try {
      const cfg = normalizeCloudConfig(JSON.parse(b64urlDecode(raw)));
      if (cfg) saveCloudConfig(cfg);
    } catch (err) { /* ignore */ }
  }

  function boardForShare(shareId) {
    return state.boards.find((b) => b.shareId === shareId) || null;
  }

  function scheduleCloudPush() {
    if (!cloud.mode || !cloud.shareId || cloud.applyingRemote) return;
    clearTimeout(cloud.pushTimer);
    cloud.pushTimer = setTimeout(pushCloudNow, 500);
  }

  function pushCloudNow() {
    if (!cloud.shareId || cloud.applyingRemote) return;
    const board = boardForShare(cloud.shareId) || currentBoard();
    if (!board) return;
    board.shareId = cloud.shareId;
    const clone = JSON.parse(JSON.stringify(board));
    delete clone.seeded;

    if (cloud.mode === "api") {
      fetch("/api/board/" + encodeURIComponent(cloud.shareId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: clone })
      })
        .then((res) => {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then((data) => {
          /* Recordamos la versión que acabamos de escribir para no volver a
             traer nuestro propio cambio en el siguiente sondeo. */
          if (data && data.rev) cloud.pollRev = data.rev;
        })
        .catch((err) => {
          console.warn("No se pudo guardar en SQL Server:", err);
          toast("No se pudo guardar en tu SQL Server");
        });
      return;
    }

    if (cloud.mode !== "firebase" || !cloud.ref) return;
    cloud.ref
      .set({ board: clone, updatedAt: Date.now() })
      .catch((err) => {
        console.warn("No se pudo sincronizar con la nube:", err);
        toast("No se pudo sincronizar (revisa tu conexión)");
      });
  }

  function boardIsEmpty(board) {
    if (!board || !Array.isArray(board.lists)) return true;
    return board.lists.every((l) => !Array.isArray(l.cards) || l.cards.length === 0);
  }

  function applyRemoteBoard(remoteBoard) {
    const normalized = normalizeState({ boards: [remoteBoard] });
    if (!normalized || !normalized.boards.length) return;
    const board = normalized.boards[0];
    board.shareId = cloud.shareId;
    delete board.seeded;

    cloud.applyingRemote = true;
    const index = state.boards.findIndex(
      (b) => b.shareId === cloud.shareId || b.id === board.id
    );
    if (index >= 0) {
      state.boards[index] = board;
    } else {
      /* Quitamos el tablero inicial vacío para no duplicarlo al abrir un enlace. */
      state.boards = state.boards.filter((b) => !(b.seeded && boardIsEmpty(b)));
      state.boards.push(board);
    }
    ui.boardId = board.id;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(ACTIVE_KEY, board.id);
    } catch (err) { /* ignore */ }
    render();
    if (!$("#shareModal").classList.contains("hidden")) renderShareBody(cloud.shareId);
    cloud.applyingRemote = false;
  }

  /* --- Modo SQL Server local: estado inicial + sondeo periódico ---
     Usamos sondeo en vez de SSE porque los túneles (Cloudflare) almacenan en
     búfer los eventos y no llegan al instante. Sondeamos una versión ligera y
     solo traemos el tablero completo cuando cambió. */

  function stopApiPolling() {
    if (cloud.pollTimer) {
      clearTimeout(cloud.pollTimer);
      cloud.pollTimer = null;
    }
    cloud.polling = false;
    cloud.pollRev = null;
    cloud.pollFails = 0;
  }

  const API_POLL_MS = 1200;

  function apiPollDelay() {
    if (cloud.pollFails > 0) {
      return Math.min(API_POLL_MS * cloud.pollFails * 2, 8000);
    }
    return API_POLL_MS;
  }

  async function apiPollTick() {
    const shareId = cloud.shareId;
    if (!shareId || cloud.mode !== "api") return;

    try {
      const res = await fetch(
        "/api/board/" + encodeURIComponent(shareId) + "/rev",
        { cache: "no-store" }
      );
      if (res.ok) {
        cloud.pollFails = 0;
        const data = await res.json();
        const rev = data && data.rev ? data.rev : null;
        if (rev && rev !== cloud.pollRev) {
          /* Cambió: traemos el tablero completo y lo aplicamos. */
          const full = await fetch("/api/board/" + encodeURIComponent(shareId), { cache: "no-store" });
          if (full.ok) {
            const d = await full.json();
            if (d && d.rev) cloud.pollRev = d.rev;
            if (d && d.board) applyRemoteBoard(d.board);
          }
        }
      } else {
        cloud.pollFails += 1;
      }
    } catch (err) {
      cloud.pollFails += 1;
    }

    if (cloud.shareId === shareId && cloud.mode === "api") {
      cloud.pollTimer = setTimeout(apiPollTick, apiPollDelay());
    }
  }

  function startApiPolling(shareId, rev) {
    stopApiPolling();
    cloud.shareId = shareId;
    cloud.pollRev = rev || null;
    cloud.polling = true;
    cloud.pollTimer = setTimeout(apiPollTick, API_POLL_MS);
  }

  function connectApiBoard(shareId, o) {
    const options = o || {};
    cloud.connecting = shareId;
    return fetch("/api/board/" + encodeURIComponent(shareId), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.board) {
          if (data.rev) cloud.pollRev = data.rev;
          applyRemoteBoard(data.board);
          startApiPolling(shareId, data.rev);
        } else if (options.firstConnect) {
          /* Todavía no existe en SQL Server: subimos el nuestro. */
          startApiPolling(shareId, null);
          pushCloudNow();
          toast("Tablero compartido creado");
        } else {
          /* Aún no existe (p. ej. el dueño no lo ha creado): sondeamos. */
          startApiPolling(shareId, null);
        }
        return true;
      })
      .catch(() => {
        /* Sin conexión puntual con el servidor: seguimos sondeando. */
        startApiPolling(shareId, null);
        return true;
      })
      .then((result) => {
        if (cloud.connecting === shareId) cloud.connecting = null;
        return result;
      });
  }

  function connectSharedBoard(shareId, opts) {
    const o = opts || {};
    if (!cloud.mode) {
      if (!o.silent) toast("La colaboración aún no está configurada");
      return false;
    }
    if (cloud.shareId === shareId && (cloud.ref || cloud.polling || cloud.connecting === shareId)) {
      return true;
    }
    if (cloud.ref) { try { cloud.ref.off(); } catch (err) { /* ignore */ } cloud.ref = null; }
    stopApiPolling();
    cloud.shareId = shareId;

    if (cloud.mode === "api") return connectApiBoard(shareId, o);

    if (!initCloud()) {
      if (!o.silent) toast("La colaboración aún no está configurada");
      return false;
    }
    cloud.ref = cloud.db.ref("boards/" + shareId);
    cloud.ref.on(
      "value",
      (snap) => {
        const val = snap.val();
        if (!val || !val.board) {
          if (o.firstConnect) {
            /* El tablero todavía no existe en la nube: lo subimos nosotros. */
            pushCloudNow();
            toast("Tablero compartido creado");
          }
          return;
        }
        applyRemoteBoard(val.board);
      },
      (err) => {
        console.warn("Error de sincronización:", err);
        toast("Error de conexión con el tablero compartido");
      }
    );
    return true;
  }

  function ensureBoardShareId(board) {
    if (!board) return null;
    if (!board.shareId) {
      board.shareId = randomShareId();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* ignore */ }
    }
    return board.shareId;
  }

  /* En modo SQL Server, el tablero activo se sincroniza solo (sin pulsar Compartir). */
  function syncActiveBoard() {
    if (cloud.mode !== "api") return;
    /* Si estamos viendo un enlace compartido, manda ese tablero. */
    if (readShareIdFromUrl()) return;
    const board = currentBoard();
    if (!board) return;
    const shareId = ensureBoardShareId(board);
    connectSharedBoard(shareId, { firstConnect: true, silent: true });
  }

  async function shareBoard() {
    const board = currentBoard();
    if (!board) {
      toast("Crea un tablero primero");
      return;
    }
    await ensureBackend();
    if (!cloud.mode) {
      renderShareBody(null);
      showModal("shareModal");
      return;
    }
    if (cloud.mode === "api") await refreshPublicUrl();
    if (!board.shareId) board.shareId = randomShareId();
    saveState();
    const first = cloud.shareId !== board.shareId;
    connectSharedBoard(board.shareId, { firstConnect: first });
    renderShareBody(board.shareId);
    showModal("shareModal");
  }

  function saveFbConfigFromInput() {
    const el = $("#fbConfig");
    const cfg = normalizeCloudConfig(el ? el.value : "");
    if (!cfg) {
      toast("No se reconoce la configuración. Revisa el texto pegado.");
      return;
    }
    saveCloudConfig(cfg);
    const activate = () => {
      resetCloudState();
      toast("Colaboración activada");
      shareBoard();
    };
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      /* Si ya había una app iniciada, la reiniciamos con la nueva configuración. */
      try {
        firebase.app().delete().then(activate, activate);
      } catch (err) {
        activate();
      }
    } else {
      activate();
    }
  }

  function resetFbConfig() {
    saveCloudConfig(null);
    resetCloudState();
    renderShareBody(null);
    toast("Conexión borrada. Puedes pegar otra.");
  }

  function renderShareBody(shareId) {
    const body = $("#shareBody");
    if (!body) return;

    /* --- Modo SQL Server local (tu computador) --- */
    if (cloud.mode === "api") {
      const url = shareUrlFor(shareId);
      const base = apiShareBase();
      const isRemote =
        /^https?:\/\//i.test(base) &&
        !/localhost|127\.0\.0\.1/i.test(base);
      body.innerHTML =
        '<p class="share-ok">Guardando en <strong>tu SQL Server local</strong>. ' +
        "Los datos quedan en tu computador.</p>" +
        '<label class="field"><span>Enlace para compartir</span>' +
          '<div class="share-row">' +
            '<input id="shareLink" class="input" type="text" readonly value="' + url + '">' +
            '<button class="btn-primary" id="btnCopyShare" type="button">Copiar</button>' +
          "</div>" +
        "</label>" +
        (isRemote
          ? '<p class="share-note">Envía este enlace a tu compañero: podrá <strong>ver y editar</strong> el ' +
            "tablero en tiempo real. Funciona mientras <strong>tu computador esté encendido</strong> y con el " +
            "servidor y el túnel abiertos.</p>"
          : '<p class="share-warn">Ahora mismo el enlace apunta a tu equipo local, así que solo sirve en tu ' +
            "computador. Para que tu compañero entre desde otra parte, inicia el <strong>túnel</strong> " +
            "(mira el README), reinicia el servidor y vuelve a abrir este panel.</p>") +
        '<div class="modal-actions">' +
          '<button class="btn-ghost" id="btnReconnect" type="button">Actualizar enlace</button>' +
          '<button class="btn-ghost" data-close="shareModal" type="button">Cerrar</button>' +
        "</div>";
      return;
    }

    if (!firebaseConfigured()) {
      body.innerHTML =
        '<p class="share-warn">Para compartir en línea necesitas una base de datos ' +
        "<strong>gratuita</strong> de Firebase. Se configura <strong>una sola vez</strong>.</p>" +
        '<label class="field"><span>Pega aquí la configuración de Firebase</span>' +
          '<textarea id="fbConfig" class="input" rows="4" spellcheck="false" ' +
          "placeholder='{\"databaseURL\":\"https://tu-proyecto-default-rtdb.firebaseio.com\"}'></textarea>" +
        "</label>" +
        '<p class="share-note">Puedes pegar el <strong>objeto completo</strong> de configuración ' +
        "(Configuración del proyecto → Tus apps → Configuración del SDK) o solo la " +
        "<strong>URL de la base de datos</strong>. Encontrarás los pasos en el README.</p>" +
        '<div class="modal-actions">' +
          '<button class="btn-ghost" data-close="shareModal" type="button">Cerrar</button>' +
          '<button class="btn-primary" id="btnSaveFbConfig" type="button">Guardar y activar</button>' +
        "</div>";
      return;
    }

    const url = shareUrlFor(shareId);
    body.innerHTML =
      '<label class="field"><span>Enlace para compartir</span>' +
        '<div class="share-row">' +
          '<input id="shareLink" class="input" type="text" readonly value="' + url + '">' +
          '<button class="btn-primary" id="btnCopyShare" type="button">Copiar</button>' +
        "</div>" +
      "</label>" +
      '<p class="share-note">Cualquier persona con este enlace podrá <strong>ver y editar</strong> este ' +
      "tablero en tiempo real, aunque esté en otra ciudad. El enlace ya incluye la conexión, así que tu " +
      "compañero no tiene que configurar nada.</p>" +
      '<div class="modal-actions">' +
        '<button class="btn-ghost" id="btnResetFbConfig" type="button">Cambiar base de datos</button>' +
        '<button class="btn-ghost" data-close="shareModal" type="button">Cerrar</button>' +
      "</div>";
  }

  function copyShareLink() {
    const input = $("#shareLink");
    if (!input) return;
    const text = input.value;
    const done = () => toast("Enlace copiado");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {
        input.select();
        document.execCommand("copy");
        done();
      });
    } else {
      input.select();
      document.execCommand("copy");
      done();
    }
  }

  function seedState() {
    /* Tablero inicial con las secciones listas pero VACÍAS, para que el
       usuario añada y edite sus propias actividades desde cero. */
    const board = {
      id: uid("b"),
      name: "Plan de actividades",
      bg: "azul",
      starred: true,
      seeded: true,
      labels: makeLabels(),
      lists: [
        { id: uid("l"), name: "Ideas y pendientes", cards: [] },
        { id: uid("l"), name: "Planificadas", cards: [] },
        { id: uid("l"), name: "En proceso", cards: [] },
        { id: uid("l"), name: "Ejecutadas", cards: [] }
      ]
    };
    return { boards: [board] };
  }

  let state = loadState();

  const ui = {
    boardId: null,
    search: "",
    filterLabels: new Set(),
    filterStatuses: new Set(),
    composerListId: null,
    composerDraft: "",
    renamingListId: null,
    listMenuId: null,
    editingCardId: null,
    openCardId: null,
    boardModalMode: "new",
    boardDraftBg: BACKGROUNDS[0].id,
    suppressClickUntil: 0,
    sidebarOpen: window.innerWidth > 900
  };

  try {
    const storedActive = localStorage.getItem(ACTIVE_KEY);
    if (storedActive && state.boards.some((b) => b.id === storedActive)) {
      ui.boardId = storedActive;
    }
  } catch (err) { /* ignore */ }

  if (!ui.boardId && state.boards.length) ui.boardId = state.boards[0].id;

  let dragState = null;
  let toastTimer = null;

  /* Estado de la sincronización en la nube. */
  const cloud = {
    ready: false,
    db: null,
    shareId: null,
    ref: null,
    applyingRemote: false,
    pushTimer: null,
    mode: null,        /* "api" (SQL Server local) o "firebase" (nube) */
    publicUrl: "",     /* URL pública del túnel, si la hay */
    connecting: null,
    probe: null,
    /* Modo SQL Server: sondeo periódico (más fiable que SSE tras un túnel). */
    pollTimer: null,
    pollRev: null,     /* última versión conocida del tablero */
    pollFails: 0,
    polling: false
  };

  /* ---------- Selectores ---------- */

  function currentBoard() {
    if (!state.boards.length) return null;
    let board = state.boards.find((b) => b.id === ui.boardId);
    if (!board) {
      board = state.boards[0];
      ui.boardId = board.id;
    }
    return board;
  }

  function allCards(board) {
    if (!board) return [];
    return board.lists.reduce((acc, list) => acc.concat(list.cards), []);
  }

  function findCard(cardId) {
    const board = currentBoard();
    if (!board) return null;
    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return { board: board, list: list, card: card };
    }
    return null;
  }

  function findCardInBoard(board, cardId) {
    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  }

  /* La sección (lista) determina el estado de avance de sus tarjetas, de modo
     que mover una actividad entre secciones actualice el progreso. */
  function statusFromListName(name) {
    const n = String(name || "").toLowerCase();
    if (/planificad/.test(n)) return "planificada";
    if (/proceso|progres/.test(n)) return "en_proceso";
    if (/ejecutad|hech|complet|finaliz/.test(n)) return "ejecutada";
    return null;
  }

  function listForStatus(board, status) {
    if (!board) return null;
    return board.lists.find((l) => statusFromListName(l.name) === status) || null;
  }

  /* Mueve la tarjeta a la lista que corresponde a su estado, si existe. */
  function syncCardToList(found) {
    const target = listForStatus(found.board, found.card.status);
    if (!target || target.id === found.list.id) return target;
    found.list.cards = found.list.cards.filter((c) => c.id !== found.card.id);
    target.cards.push(found.card);
    return target;
  }

  function isFiltering() {
    return !!ui.search.trim() || ui.filterLabels.size > 0 || ui.filterStatuses.size > 0;
  }

  function cardMatches(card) {
    const query = ui.search.trim().toLowerCase();
    if (query) {
      const haystack = (card.title + " " + card.desc).toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (ui.filterLabels.size) {
      const cardLabels = new Set(card.labels);
      for (const id of ui.filterLabels) {
        if (!cardLabels.has(id)) return false;
      }
    }
    if (ui.filterStatuses.size && !ui.filterStatuses.has(card.status)) return false;
    return true;
  }

  /* ---------- Render ---------- */

  function render() {
    renderSidebar();
    renderBoard();
    updateLegend();
    updateFilterButton();
    syncActiveBoard();
  }

  function updateLegend() {
    const buttons = document.querySelectorAll(".legend-btn");
    buttons.forEach((button) => {
      button.classList.toggle("active", ui.filterStatuses.has(button.dataset.id));
    });
  }

  function renderSidebar() {
    const list = $("#boardList");
    if (!list) return;
    if (!state.boards.length) {
      list.innerHTML = '<li class="sidebar-empty">Aún no tienes tableros.<br>Crea el primero con el botón +.</li>';
      return;
    }
    const active = currentBoard();
    list.innerHTML = state.boards.map((board) => {
      const bg = getBg(board.bg);
      return (
        '<li><button class="board-item' + (active && active.id === board.id ? " active" : "") + '" ' +
        'data-action="open-board" data-id="' + board.id + '">' +
        '<span class="board-dot" style="background:' + bg.css + '"></span>' +
        '<span class="board-name">' + escapeHtml(board.name) + "</span>" +
        (board.starred ? '<span class="board-star-mini">' + ICON.starFill + "</span>" : "") +
        "</button></li>"
      );
    }).join("");
  }

  function renderBoard() {
    const board = currentBoard();
    const canvas = $("#boardCanvas");
    const empty = $("#emptyState");

    if (!board) {
      canvas.classList.add("hidden");
      empty.classList.remove("hidden");
      $("#boardTitle").textContent = "";
      $("#boardSub").textContent = "";
      $("#boardProgress").innerHTML = "";
      $("#lists").innerHTML = "";
      return;
    }

    canvas.classList.remove("hidden");
    empty.classList.add("hidden");
    canvas.style.backgroundImage = getBg(board.bg).css;

    const title = $("#boardTitle");
    if (document.activeElement !== title) title.textContent = board.name;

    const star = $("#btnStar");
    star.classList.toggle("is-starred", !!board.starred);
    star.title = board.starred ? "Quitar destacado" : "Destacar tablero";

    renderBoardMeta();
    renderLists();
    renderFilters();
  }

  function renderBoardMeta() {
    const board = currentBoard();
    if (!board) return;
    const cards = allCards(board);
    const planned = cards.filter((c) => c.status === "planificada").length;
    const done = cards.filter((c) => c.status === "ejecutada").length;
    const inProgress = cards.filter((c) => c.status === "en_proceso").length;
    /* Progreso ponderado: ejecutada = 100 %, en proceso = 50 %. */
    const pct = cards.length
      ? Math.round(((done + inProgress * 0.5) / cards.length) * 100)
      : 0;

    const parts = [
      cards.length + (cards.length === 1 ? " tarjeta" : " tarjetas"),
      planned + " planificadas",
      inProgress + " en proceso",
      done + " ejecutadas"
    ];
    if (isFiltering()) parts.push("filtros activos");
    $("#boardSub").textContent = parts.join(" · ");

    $("#boardProgress").innerHTML =
      '<div class="bp-top"><span>Progreso</span><strong>' + pct + "%</strong></div>" +
      '<div class="progress light"><div class="progress-bar" style="width:' + pct + '%"></div></div>';
  }

  function renderLists() {
    const board = currentBoard();
    const container = $("#lists");
    if (!board) {
      container.innerHTML = "";
      return;
    }

    const filtering = isFiltering();
    const draggable = filtering ? "false" : "true";

    container.innerHTML = board.lists.map((list) => {
      const visibleCards = list.cards.filter(cardMatches);
      const countText = filtering
        ? visibleCards.length + "/" + list.cards.length
        : String(list.cards.length);

      const renaming = ui.renamingListId === list.id;
      const menuOpen = ui.listMenuId === list.id;

      const header = renaming
        ? '<form class="list-rename-form" data-list-id="' + list.id + '">' +
          '<input class="list-rename-input" type="text" maxlength="60" value="' + escapeHtml(list.name) + '" aria-label="Nombre de la lista">' +
          "</form>"
        : '<button type="button" class="list-title" data-action="rename-list" data-id="' + list.id + '" title="Clic para renombrar la lista">' + escapeHtml(list.name) + "</button>";

      const body = visibleCards.length
        ? visibleCards.map((card) => cardMarkup(card, board, list.id, draggable)).join("")
        : (list.cards.length
          ? '<p class="no-results">Sin resultados con los filtros actuales</p>'
          : "");

      const footer = ui.composerListId === list.id
        ? composerMarkup(list)
        : '<button class="add-card-btn" data-action="open-composer" data-id="' + list.id + '">' + ICON.plus + " Añadir una tarjeta</button>";

      return (
        '<section class="list" data-id="' + list.id + '">' +
          '<header class="list-header">' +
            '<span class="drag-handle" draggable="' + (filtering ? "false" : "true") + '" title="Arrastrar para mover la lista" aria-hidden="true">⠿</span>' +
            header +
            '<span class="list-count" title="' + list.cards.length + ' tarjetas">' + countText + "</span>" +
            '<button class="list-menu-btn" data-action="toggle-list-menu" data-id="' + list.id + '" title="Opciones de la lista" aria-label="Opciones de la lista">⋯</button>' +
            (menuOpen
              ? '<div class="list-menu">' +
                '<button data-action="rename-list" data-id="' + list.id + '">Renombrar lista</button>' +
                '<button class="danger" data-action="delete-list" data-id="' + list.id + '">Eliminar lista</button>' +
                "</div>"
              : "") +
          "</header>" +
          '<div class="list-body" data-list-body data-list-id="' + list.id + '">' + body + "</div>" +
          '<div class="list-footer">' + footer + "</div>" +
        "</section>"
      );
    }).join("");

    requestAnimationFrame(() => {
      if (ui.composerListId) {
        const textarea = $(".composer textarea");
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }
      if (ui.renamingListId) {
        const input = $(".list-rename-input");
        if (input) {
          input.focus();
          input.select();
        }
      }
      if (ui.editingCardId) {
        const input = $(".card-edit-input");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
          autosize(input);
        }
      }
    });
  }

  function cardMarkup(card, board, listId, draggable) {
    const labels = card.labels
      .map((id) => board.labels.find((l) => l.id === id))
      .filter(Boolean);
    const status = STATUSES[card.status] || STATUSES.planificada;
    const over = isOverdue(card);
    const checksDone = card.checklist.filter((i) => i.done).length;
    const checksTotal = card.checklist.length;

    const labelHtml = labels.length
      ? '<div class="card-labels">' + labels.map((l) =>
          '<span class="label-chip" style="background:' + l.color + ";color:" + labelTextColor(l.color) + '" title="' + escapeHtml(l.name) + '">' +
          escapeHtml(l.name) + "</span>"
        ).join("") + "</div>"
      : "";

    const dueHtml = card.dueDate
      ? '<span class="badge' + (over ? " overdue" : "") + (card.status === "ejecutada" ? " complete" : "") + '" title="Fecha límite">' +
        ICON.calendar + escapeHtml(formatDue(card.dueDate)) + "</span>"
      : "";

    const checkHtml = checksTotal
      ? '<span class="badge' + (checksDone === checksTotal ? " complete" : "") + '" title="Checklist">' +
        ICON.checklist + checksDone + "/" + checksTotal + "</span>"
      : "";

    const descHtml = card.desc
      ? '<span class="badge" title="Tiene descripción">' + ICON.desc + "</span>"
      : "";

    const attachTotal = (card.attachments || []).length;
    const attachHtml = attachTotal
      ? '<span class="badge" title="' + attachTotal + " documento(s) adjunto(s)" + '">' + ICON.paperclip + attachTotal + "</span>"
      : "";

    const editing = ui.editingCardId === card.id;
    const titleHtml = editing
      ? '<form class="card-edit" data-id="' + card.id + '">' +
          '<textarea class="card-edit-input" rows="2" maxlength="200" aria-label="Editar texto de la tarjeta">' + escapeHtml(card.title) + "</textarea>" +
          '<div class="card-edit-actions">' +
            '<button class="btn-primary tiny" type="submit">Guardar</button>' +
            '<button class="icon-btn tiny" type="button" data-action="cancel-edit-card" title="Cancelar" aria-label="Cancelar">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
            "</button>" +
            '<span class="card-edit-hint">Enter guarda · Esc cancela</span>' +
          "</div>" +
        "</form>"
      : '<div class="card-title" title="Doble clic para editar">' + escapeHtml(card.title) + "</div>" +
        '<button class="card-edit-btn" type="button" data-action="edit-card" data-id="' + card.id + '" title="Editar el texto de la tarjeta" aria-label="Editar el texto de la tarjeta">' + ICON.pencil + "</button>";

    return (
      '<article class="card' + (editing ? " editing" : "") + '" draggable="' + (editing ? "false" : draggable) + '" data-id="' + card.id + '" data-list="' + listId + '" tabindex="0" aria-label="' + escapeHtml(card.title) + '">' +
        labelHtml +
        titleHtml +
        '<div class="card-badges">' +
          '<button type="button" class="status-pill" data-action="cycle-status" data-id="' + card.id + '" ' +
            'title="Cambiar estado (clic)" style="background:' + status.pill + ";color:" + status.text + '">' +
            '<span class="status-dot" style="background:' + status.dot + '"></span>' + status.label +
          "</button>" +
          dueHtml + checkHtml + attachHtml + descHtml +
        "</div>" +
      "</article>"
    );
  }

  function composerMarkup(list) {
    return (
      '<form class="composer" data-list-id="' + list.id + '">' +
        '<textarea class="composer-text" maxlength="200" placeholder="Introduce un título para la tarjeta…" aria-label="Título de la nueva tarjeta">' +
          escapeHtml(ui.composerDraft) +
        "</textarea>" +
        '<div class="composer-actions">' +
          '<button class="btn-primary" type="submit">Añadir tarjeta</button>' +
          '<button class="icon-btn" type="button" data-action="close-composer" title="Cancelar" aria-label="Cancelar">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          "</button>" +
        "</div>" +
      "</form>"
    );
  }

  function renderFilters() {
    const board = currentBoard();
    const pop = $("#filterPopover");
    if (!board) {
      pop.innerHTML = "";
      return;
    }

    const labelsHtml = board.labels.length
      ? '<div class="chips">' + board.labels.map((l) =>
          '<button class="filter-chip' + (ui.filterLabels.has(l.id) ? " active" : "") + '" data-action="filter-label" data-id="' + l.id + '">' +
            '<span class="swatch" style="background:' + l.color + '"></span>' + escapeHtml(l.name) +
          "</button>"
        ).join("") + "</div>"
      : '<p class="filter-empty">Este tablero todavía no tiene etiquetas.</p>';

    const statusHtml = STATUS_KEYS.map((key) => {
      const status = STATUSES[key];
      return (
        '<button class="filter-chip status-chip' + (ui.filterStatuses.has(key) ? " active" : "") + '" data-action="filter-status" data-id="' + key + '">' +
          '<span class="dot" style="background:' + status.dot + ";width:8px;height:8px;flex:0 0 8px;box-shadow:none" + '"></span>' +
          status.label +
        "</button>"
      );
    }).join("");

    pop.innerHTML =
      '<div class="popover-head"><strong>Filtros</strong><button type="button" data-action="clear-filters">Limpiar filtros</button></div>' +
      '<div class="filter-group"><h4>Etiquetas</h4>' + labelsHtml + "</div>" +
      '<div class="filter-group"><h4>Estado de la actividad</h4><div class="chips">' + statusHtml + "</div></div>" +
      '<p class="popover-note">' +
        (isFiltering()
          ? "Se están ocultando las tarjetas que no coinciden con los filtros seleccionados."
          : "Selecciona etiquetas o estados para enfocar tu planificación. También puedes buscar por texto en la barra superior.") +
      "</p>";
  }

  function updateFilterButton() {
    const count = ui.filterLabels.size + ui.filterStatuses.size;
    const badge = $("#filterCount");
    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
    $("#btnFilter").classList.toggle("is-active", count > 0 || !!ui.search.trim());
  }

  /* ---------- Modales ---------- */

  function showModal(id) {
    $("#" + id).classList.remove("hidden");
  }

  function closeModal(id) {
    const modal = $("#" + id);
    if (!modal || modal.classList.contains("hidden")) return;
    modal.classList.add("hidden");

    if (id === "cardModal") {
      const found = findCard(ui.openCardId);
      if (found && !found.card.title.trim()) found.card.title = "Sin título";
      ui.openCardId = null;
      saveState();
      render();
      return;
    }

    if (id === "labelsModal") {
      render();
      if (ui.openCardId) fillCardModal();
      return;
    }

    if (id === "boardModal") {
      renderSidebar();
    }
  }

  function closeTopModal() {
    if (!$("#labelsModal").classList.contains("hidden")) return closeModal("labelsModal");
    if (!$("#boardModal").classList.contains("hidden")) return closeModal("boardModal");
    if (!$("#cardModal").classList.contains("hidden")) return closeModal("cardModal");
    if ($("#filterPopover").classList.contains("show")) {
      $("#filterPopover").classList.remove("show");
      return;
    }
    if (ui.listMenuId) {
      ui.listMenuId = null;
      renderLists();
    }
  }

  /* ---------- Detalle de tarjeta ---------- */

  function openCard(cardId) {
    if (Date.now() < ui.suppressClickUntil) return;
    const found = findCard(cardId);
    if (!found) return;
    ui.openCardId = cardId;
    fillCardModal();
    showModal("cardModal");
    requestAnimationFrame(() => {
      const titleInput = $("#detailTitle");
      if (titleInput) {
        titleInput.focus();
        const end = titleInput.value.length;
        titleInput.setSelectionRange(end, end);
      }
    });
  }

  function fillCardModal() {
    const found = findCard(ui.openCardId);
    if (!found) return;
    const board = found.board;
    const card = found.card;
    const list = found.list;

    const titleInput = $("#detailTitle");
    titleInput.value = card.title;
    autosize(titleInput);

    $("#detailSubtitle").innerHTML = "en la lista <strong>" + escapeHtml(list.name) + "</strong>";
    $("#detailDesc").value = card.desc;
    $("#detailDue").value = card.dueDate || "";

    const hint = $("#detailDueHint");
    hint.textContent = card.dueDate ? dueHint(card.dueDate) : "";
    hint.className = "due-hint" + (isOverdue(card) ? " is-overdue" : "");

    renderDetailLabels(board, card);
    renderDetailStatus(card);
    renderDetailListSelect(board, list);
    renderChecklist(card);
    renderAttachments(card);

    const created = formatDateLong(card.createdAt);
    $("#detailCreated").textContent = created ? "Creada el " + created : "";
  }

  function renderDetailLabels(board, card) {
    const wrap = $("#detailLabels");
    if (!board.labels.length) {
      wrap.innerHTML = '<p class="muted small">Sin etiquetas todavía. Usa «Administrar etiquetas» para crear algunas.</p>';
      return;
    }
    wrap.innerHTML = board.labels.map((label) => {
      const active = card.labels.includes(label.id);
      const style = active
        ? "background:" + label.color + ";color:" + labelTextColor(label.color) + ";border-color:transparent"
        : "background:#fff;color:" + label.color + ";border-color:" + label.color;
      return (
        '<button type="button" class="label-toggle' + (active ? " active" : "") + '" data-label-id="' + label.id + '" style="' + style + '">' +
          (active ? "✓ " : "") + escapeHtml(label.name) +
        "</button>"
      );
    }).join("");
  }

  function renderDetailStatus(card) {
    $("#detailStatus").innerHTML = STATUS_KEYS.map((key) => {
      const status = STATUSES[key];
      return (
        '<button type="button" class="status-btn' + (card.status === key ? " active" : "") + '" data-set-status="' + key + '">' +
          '<span class="dot" style="background:' + status.dot + '"></span>' + status.label +
        "</button>"
      );
    }).join("");
  }

  function renderDetailListSelect(board, list) {
    $("#detailList").innerHTML = board.lists.map((item) =>
      '<option value="' + item.id + '"' + (item.id === list.id ? " selected" : "") + ">" + escapeHtml(item.name) + "</option>"
    ).join("");
  }

  function renderChecklist(card) {
    const done = card.checklist.filter((item) => item.done).length;
    const total = card.checklist.length;
    $("#checkProgressText").textContent = total ? done + "/" + total + " completados" : "Sin elementos";
    $("#checkProgressBar").style.width = total ? Math.round((done / total) * 100) + "%" : "0%";

    $("#detailChecklist").innerHTML = card.checklist.map((item) =>
      '<li class="check-item' + (item.done ? " done" : "") + '">' +
        '<label class="check-label">' +
          '<input type="checkbox"' + (item.done ? " checked" : "") + ' data-check-toggle="' + item.id + '">' +
          "<span>" + escapeHtml(item.text) + "</span>" +
        "</label>" +
        '<button type="button" class="icon-btn tiny danger" data-check-delete="' + item.id + '" title="Eliminar elemento" aria-label="Eliminar elemento">' +
          "×" +
        "</button>" +
      "</li>"
    ).join("");
  }

  function renderAttachments(card) {
    const files = card.attachments || [];
    $("#attachCount").textContent = files.length
      ? files.length + (files.length === 1 ? " archivo" : " archivos")
      : "Sin archivos";

    const list = $("#attachList");
    if (!files.length) {
      list.innerHTML = '<li class="attach-empty">Todavía no hay documentos adjuntos.</li>';
      return;
    }

    list.innerHTML = files.map((file) =>
      '<li class="attach-item" data-attach-id="' + file.id + '">' +
        '<span class="attach-icon">' + escapeHtml(fileExtension(file.name)) + "</span>" +
        '<div class="attach-info">' +
          '<button type="button" class="attach-name" data-open-attach="' + file.id + '" title="Abrir o descargar documento">' +
            escapeHtml(file.name) +
          "</button>" +
          '<span class="attach-meta">' + escapeHtml(formatSize(file.size)) + " · " + escapeHtml(formatDateLong(file.addedAt)) + "</span>" +
        "</div>" +
        '<button type="button" class="icon-btn danger" data-delete-attach="' + file.id + '" title="Quitar documento" aria-label="Quitar documento">×</button>' +
      "</li>"
    ).join("");
  }

  function addAttachmentsToCard(fileList) {
    const found = findCard(ui.openCardId);
    if (!found) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const MAX_SIZE = 15 * 1024 * 1024;
    let added = 0;
    let skipped = 0;

    const tasks = files.map((file) => {
      if (file.size > MAX_SIZE) {
        skipped++;
        return Promise.resolve();
      }
      const id = uid("at");
      return filePut(id, file).then((ok) => {
        if (!ok) {
          skipped++;
          return;
        }
        found.card.attachments = found.card.attachments || [];
        found.card.attachments.push({
          id: id,
          name: file.name || "documento",
          type: file.type || "",
          size: file.size || 0,
          addedAt: new Date().toISOString()
        });
        added++;
      });
    });

    Promise.all(tasks).then(() => {
      saveState();
      renderAttachments(found.card);
      if (added && skipped) toast(added + " adjuntado(s), " + skipped + " omitido(s) por tamaño");
      else if (added) toast(added === 1 ? "Documento adjuntado" : added + " documentos adjuntados");
      else if (skipped) toast("El archivo supera el límite de 15 MB");
    });
  }

  function openAttachment(attachId) {
    const found = findCard(ui.openCardId);
    if (!found) return;
    const file = (found.card.attachments || []).find((f) => f.id === attachId);
    if (!file) return;

    fileGet(attachId).then((blob) => {
      if (!blob) {
        toast("El archivo ya no está disponible en este navegador");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || "documento";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    });
  }

  function deleteAttachment(attachId) {
    const found = findCard(ui.openCardId);
    if (!found) return;
    found.card.attachments = (found.card.attachments || []).filter((f) => f.id !== attachId);
    saveState();
    fileDelete(attachId);
    renderAttachments(found.card);
    toast("Documento quitado");
  }

  function autosize(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  /* ---------- Editor de etiquetas ---------- */

  function openLabelsModal() {
    if (!currentBoard()) {
      toast("Crea un tablero primero");
      return;
    }
    renderLabelsEditor();
    showModal("labelsModal");
  }

  function renderLabelsEditor() {
    const board = currentBoard();
    const wrap = $("#labelsEditor");
    if (!board) {
      wrap.innerHTML = "";
      return;
    }

    if (!board.labels.length) {
      wrap.innerHTML = '<p class="muted small" style="padding:8px 2px">Este tablero no tiene etiquetas. Añade la primera para empezar.</p>';
      return;
    }

    wrap.innerHTML = board.labels.map((label) =>
      '<div class="label-row" data-label-id="' + label.id + '">' +
        '<span class="label-swatch" style="background:' + label.color + '"></span>' +
        '<input class="label-name-input" type="text" maxlength="28" value="' + escapeHtml(label.name) + '" placeholder="Nombre de la etiqueta" aria-label="Nombre de la etiqueta">' +
        '<button type="button" class="icon-btn danger" data-delete-label="' + label.id + '" title="Eliminar etiqueta" aria-label="Eliminar etiqueta">×</button>' +
        '<div class="label-colors">' +
          LABEL_COLORS.map((color) =>
            '<button type="button" class="color-dot' + (label.color === color.value ? " active" : "") + '" ' +
              'data-color="' + color.value + '" style="background:' + color.value + '" title="' + color.name + '" aria-label="' + color.name + '"></button>'
          ).join("") +
        "</div>" +
      "</div>"
    ).join("");
  }

  /* ---------- Tableros: crear / ajustar ---------- */

  function openBoardModal(mode) {
    const board = currentBoard();
    ui.boardModalMode = mode;

    if (mode === "new") {
      ui.boardDraftBg = BACKGROUNDS[0].id;
      $("#boardModalTitle").textContent = "Crear tablero";
      $("#boardNameInput").value = "";
      $("#templateRow").classList.remove("hidden");
      $("#boardTemplate").checked = true;
      $("#btnSaveBoard").textContent = "Crear tablero";
      $("#btnDuplicateBoard").classList.add("hidden");
      $("#btnDeleteBoard").classList.add("hidden");
    } else {
      if (!board) return;
      ui.boardDraftBg = board.bg;
      $("#boardModalTitle").textContent = "Ajustes del tablero";
      $("#boardNameInput").value = board.name;
      $("#templateRow").classList.add("hidden");
      $("#btnSaveBoard").textContent = "Guardar cambios";
      $("#btnDuplicateBoard").classList.remove("hidden");
      $("#btnDeleteBoard").classList.remove("hidden");
    }

    renderBgChoices();
    showModal("boardModal");
    setTimeout(() => {
      $("#boardNameInput").focus();
      $("#boardNameInput").select();
    }, 60);
  }

  function renderBgChoices() {
    $("#bgChoices").innerHTML = BACKGROUNDS.map((bg) =>
      '<button type="button" class="bg-choice' + (ui.boardDraftBg === bg.id ? " active" : "") + '" ' +
        'data-bg-id="' + bg.id + '" style="background-image:' + bg.css + '" title="' + bg.name + '">' +
        "<span>" + bg.name + "</span>" +
      "</button>"
    ).join("");
  }

  function saveBoardModal() {
    const name = $("#boardNameInput").value.trim() || "Tablero sin título";

    if (ui.boardModalMode === "new") {
      const board = {
        id: uid("b"),
        name: name,
        bg: ui.boardDraftBg,
        starred: false,
        labels: makeLabels(),
        lists: $("#boardTemplate").checked ? templateLists() : []
      };
      state.boards.push(board);
      ui.boardId = board.id;
      clearFilters();
      saveState();
      closeModal("boardModal");
      render();
      toast("Tablero creado");
    } else {
      const board = currentBoard();
      if (!board) return;
      board.name = name;
      board.bg = ui.boardDraftBg;
      saveState();
      closeModal("boardModal");
      render();
      toast("Tablero actualizado");
    }
  }

  function duplicateCurrentBoard() {
    const board = currentBoard();
    if (!board) return;

    const copy = deepClone(board);
    copy.id = uid("b");
    copy.name = board.name + " (copia)";
    copy.starred = false;

    const labelMap = {};
    copy.labels = copy.labels.map((label) => {
      const newId = uid("lb");
      labelMap[label.id] = newId;
      label.id = newId;
      return label;
    });

    copy.lists = copy.lists.map((list) => {
      list.id = uid("l");
      list.cards = list.cards.map((card) => {
        card.id = uid("c");
        card.labels = card.labels.map((id) => labelMap[id]).filter(Boolean);
        card.checklist = (card.checklist || []).map((item) => {
          item.id = uid("i");
          return item;
        });
        return card;
      });
      return list;
    });

    state.boards.push(copy);
    ui.boardId = copy.id;
    clearFilters();
    saveState();
    closeModal("boardModal");
    render();
    toast("Tablero duplicado");
  }

  function deleteCurrentBoard() {
    const board = currentBoard();
    if (!board) return;
    if (!confirm('¿Eliminar el tablero "' + board.name + '" y todas sus tarjetas? Esta acción no se puede deshacer.')) return;

    state.boards = state.boards.filter((b) => b.id !== board.id);
    ui.boardId = state.boards.length ? state.boards[0].id : null;
    clearFilters();
    saveState();
    closeModal("boardModal");
    render();
    toast("Tablero eliminado");
  }

  /* ---------- Filtros ---------- */

  function clearFilters() {
    ui.filterLabels.clear();
    ui.filterStatuses.clear();
    ui.search = "";
    const input = $("#searchInput");
    if (input) input.value = "";
    $("#btnClearSearch").classList.add("hidden");
  }

  function toggleFilter(kind, id) {
    const set = kind === "label" ? ui.filterLabels : ui.filterStatuses;
    if (set.has(id)) set.delete(id);
    else set.add(id);
    renderFilters();
    renderLists();
    renderBoardMeta();
    updateLegend();
    updateFilterButton();
  }

  /* ---------- Listas y tarjetas ---------- */

  function addList(name) {
    const board = currentBoard();
    if (!board) return;
    board.lists.push({ id: uid("l"), name: name, cards: [] });
    saveState();
    renderBoardMeta();
    renderLists();
    const scroller = $(".lists-scroll");
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }

  function addCard(listId, title) {
    const board = currentBoard();
    if (!board) return;
    const list = board.lists.find((l) => l.id === listId);
    if (!list) return;
    const card = {
      id: uid("c"),
      title: title,
      desc: "",
      status: statusFromListName(list.name) || "planificada",
      dueDate: "",
      labels: [],
      checklist: [],
      attachments: [],
      createdAt: new Date().toISOString()
    };
    list.cards.push(card);
    saveState();
    renderBoardMeta();
    renderLists();
    requestAnimationFrame(() => {
      const listEl = document.querySelector('.list[data-id="' + listId + '"] .list-body');
      if (listEl) listEl.scrollTop = listEl.scrollHeight;
      const cardEl = document.querySelector('.card[data-id="' + card.id + '"]');
      if (cardEl) {
        cardEl.classList.add("card-added");
        setTimeout(() => cardEl.classList.remove("card-added"), 1200);
      }
    });
    toast("Tarjeta añadida");
  }

  /* Guarda el texto editado en línea de una tarjeta. */
  function saveCardEdit(form) {
    if (!form || !form.dataset) return;
    const found = findCard(form.dataset.id);
    const input = $(".card-edit-input", form);
    const value = input ? input.value.trim() : "";
    if (found && value && value !== found.card.title) {
      found.card.title = value;
      saveState();
      toast("Actividad actualizada");
    }
    ui.editingCardId = null;
    render();
  }

  function deleteList(listId) {
    const board = currentBoard();
    if (!board) return;
    const list = board.lists.find((l) => l.id === listId);
    if (!list) return;
    const warning = list.cards.length
      ? 'La lista "' + list.name + '" contiene ' + list.cards.length + " tarjeta(s). ¿Eliminarla con todo su contenido?"
      : '¿Eliminar la lista "' + list.name + '"?';
    if (!confirm(warning)) return;

    board.lists = board.lists.filter((l) => l.id !== listId);
    ui.listMenuId = null;
    if (ui.composerListId === listId) ui.composerListId = null;
    saveState();
    render();
    toast("Lista eliminada");
  }

  function commitFromDom() {
    const board = currentBoard();
    if (!board) return;

    const listEls = $$("#lists > .list");
    if (!listEls.length) return;

    /* Guardar todas las tarjetas antes de reasignar listas: si no, una
       tarjeta movida a otra lista ya no se encontraría en su lista original. */
    const cardMap = new Map();
    const prevList = new Map();
    board.lists.forEach((list) => {
      list.cards.forEach((card) => {
        cardMap.set(card.id, card);
        prevList.set(card.id, list.id);
      });
    });

    const ordered = [];
    const seen = new Set();

    listEls.forEach((el) => {
      const list = board.lists.find((l) => l.id === el.dataset.id);
      if (!list) return;
      const body = $(".list-body", el);
      if (!body) return;
      const cards = $$(".card", body)
        .map((cardEl) => cardMap.get(cardEl.dataset.id))
        .filter(Boolean);
      /* Si la tarjeta cambió de sección, su estado pasa a ser el de la nueva. */
      const newStatus = statusFromListName(list.name);
      cards.forEach((card) => {
        if (newStatus && prevList.get(card.id) !== list.id) card.status = newStatus;
      });
      list.cards = cards;
      ordered.push(list);
      seen.add(list.id);
    });

    board.lists.forEach((list) => {
      if (!seen.has(list.id)) ordered.push(list);
    });

    if (!ordered.length) return;
    board.lists = ordered;
    saveState();
    render();
  }

  /* ---------- Arrastrar y soltar ---------- */

  function getDragAfterElement(container, y) {
    const elements = $$(".card:not(.dragging)", container);
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    elements.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, element: child };
      }
    });
    return closest.element;
  }

  function getListAfterElement(container, x) {
    const elements = $$(".list:not(.dragging-list)", container);
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    elements.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, element: child };
      }
    });
    return closest.element;
  }

  function setupDragAndDrop() {
    document.addEventListener("dragstart", (event) => {
      const handle = event.target.closest(".drag-handle");
      if (handle) {
        const listEl = handle.closest(".list");
        if (!listEl || isFiltering()) {
          event.preventDefault();
          return;
        }
        dragState = { type: "list", id: listEl.dataset.id, el: listEl };
        event.dataTransfer.effectAllowed = "move";
        try { event.dataTransfer.setData("text/plain", listEl.dataset.id); } catch (err) { /* ignore */ }
        setTimeout(() => listEl.classList.add("dragging-list"), 0);
        return;
      }

      const cardEl = event.target.closest(".card");
      if (cardEl) {
        if (isFiltering()) {
          event.preventDefault();
          return;
        }
        dragState = { type: "card", id: cardEl.dataset.id, el: cardEl };
        event.dataTransfer.effectAllowed = "move";
        try { event.dataTransfer.setData("text/plain", cardEl.dataset.id); } catch (err) { /* ignore */ }
        setTimeout(() => cardEl.classList.add("dragging"), 0);
      }
    });

    document.addEventListener("dragover", (event) => {
      if (!dragState) return;

      if (dragState.type === "card") {
        const body = event.target.closest(".list-body");
        if (!body) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        const after = getDragAfterElement(body, event.clientY);
        if (!after) body.appendChild(dragState.el);
        else body.insertBefore(dragState.el, after);
        return;
      }

      const targetList = event.target.closest(".list");
      if (!targetList || targetList === dragState.el) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const container = $("#lists");
      const after = getListAfterElement(container, event.clientX);
      if (!after) container.appendChild(dragState.el);
      else container.insertBefore(dragState.el, after);
    });

    document.addEventListener("drop", (event) => {
      if (dragState) event.preventDefault();
    });

    document.addEventListener("dragend", () => {
      if (!dragState) return;
      const type = dragState.type;
      const el = dragState.el;
      el.classList.remove(type === "card" ? "dragging" : "dragging-list");
      dragState = null;
      ui.suppressClickUntil = Date.now() + 300;
      commitFromDom();
    });
  }

  /* ---------- Toast ---------- */

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------- Exportar / importar ---------- */

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date();
    link.href = url;
    link.download = "planboard-" + date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("Copia exportada");
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeState(JSON.parse(String(reader.result)));
        if (!parsed || !parsed.boards.length) throw new Error("Formato no válido");
        if (!confirm("Se reemplazarán tus tableros actuales por los del archivo. ¿Continuar?")) return;
        state = parsed;
        ui.boardId = state.boards[0].id;
        clearFilters();
        saveState();
        render();
        toast("Datos importados correctamente");
      } catch (err) {
        console.warn(err);
        toast("No se pudo importar el archivo");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Eventos ---------- */

  function setupEvents() {
    /* Sidebar y tableros */
    $("#btnNewBoard").addEventListener("click", () => openBoardModal("new"));
    $("#btnEmptyCreate").addEventListener("click", () => openBoardModal("new"));
    $("#btnBoardMenu").addEventListener("click", () => openBoardModal("edit"));
    $("#btnShare").addEventListener("click", shareBoard);

    $("#btnToggleSidebar").addEventListener("click", () => setSidebar(!ui.sidebarOpen));
    $("#scrim").addEventListener("click", () => setSidebar(false));

    $("#btnStar").addEventListener("click", () => {
      const board = currentBoard();
      if (!board) return;
      board.starred = !board.starred;
      saveState();
      renderSidebar();
      renderBoard();
    });

    /* Título editable */
    const title = $("#boardTitle");
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        title.blur();
      }
      if (event.key === "Escape") {
        const board = currentBoard();
        if (board) title.textContent = board.name;
        title.blur();
      }
    });
    title.addEventListener("input", () => {
      const board = currentBoard();
      if (!board) return;
      const value = title.textContent.replace(/\s+/g, " ").trim();
      if (value) {
        board.name = value;
        saveState();
      }
    });
    title.addEventListener("blur", () => {
      const board = currentBoard();
      if (!board) return;
      const value = title.textContent.trim();
      if (!value) {
        title.textContent = board.name;
        return;
      }
      board.name = value;
      saveState();
      renderSidebar();
    });

    /* Añadir lista */
    $("#btnAddList").addEventListener("click", () => {
      if (!currentBoard()) return;
      $("#btnAddList").classList.add("hidden");
      $("#addListForm").classList.remove("hidden");
      $("#newListName").value = "";
      $("#newListName").focus();
    });

    $("#btnCancelList").addEventListener("click", () => {
      $("#addListForm").classList.add("hidden");
      $("#btnAddList").classList.remove("hidden");
      $("#newListName").value = "";
    });

    $("#addListForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#newListName");
      const name = input.value.trim();
      if (!name) {
        input.focus();
        return;
      }
      addList(name);
      input.value = "";
      input.focus();
      const scroller = $(".lists-scroll");
      if (scroller) scroller.scrollLeft = scroller.scrollWidth;
    });

    /* Búsqueda */
    const search = $("#searchInput");
    search.addEventListener("input", () => {
      ui.search = search.value;
      $("#btnClearSearch").classList.toggle("hidden", !search.value);
      renderLists();
      renderBoardMeta();
      updateFilterButton();
    });
    $("#btnClearSearch").addEventListener("click", () => {
      search.value = "";
      ui.search = "";
      $("#btnClearSearch").classList.add("hidden");
      renderLists();
      renderBoardMeta();
      updateFilterButton();
      search.focus();
    });

    /* Filtros */
    $("#btnFilter").addEventListener("click", (event) => {
      event.stopPropagation();
      if (!currentBoard()) {
        toast("Crea un tablero primero");
        return;
      }
      renderFilters();
      $("#filterPopover").classList.toggle("show");
    });

    $("#btnLabels").addEventListener("click", openLabelsModal);

    /* Crear / ajustar tablero */
    $("#btnSaveBoard").addEventListener("click", saveBoardModal);
    $("#boardNameInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveBoardModal();
      }
    });
    $("#btnDuplicateBoard").addEventListener("click", duplicateCurrentBoard);
    $("#btnDeleteBoard").addEventListener("click", deleteCurrentBoard);

    $("#bgChoices").addEventListener("click", (event) => {
      const choice = event.target.closest("[data-bg-id]");
      if (!choice) return;
      ui.boardDraftBg = choice.dataset.bgId;
      renderBgChoices();
    });

    /* Detalle de tarjeta */
    const detailTitle = $("#detailTitle");
    detailTitle.addEventListener("input", () => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.title = detailTitle.value;
      saveState();
      flashSaved();
      autosize(detailTitle);
    });
    detailTitle.addEventListener("blur", () => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      if (!detailTitle.value.trim()) {
        found.card.title = "Sin título";
        detailTitle.value = "Sin título";
        saveState();
      }
    });
    detailTitle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        detailTitle.blur();
      }
    });

    $("#detailDesc").addEventListener("input", (event) => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.desc = event.target.value;
      saveState();
      flashSaved();
    });

    $("#detailDue").addEventListener("change", (event) => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.dueDate = event.target.value;
      saveState();
      const hint = $("#detailDueHint");
      hint.textContent = found.card.dueDate ? dueHint(found.card.dueDate) : "";
      hint.className = "due-hint" + (isOverdue(found.card) ? " is-overdue" : "");
    });

    $("#btnClearDue").addEventListener("click", () => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.dueDate = "";
      saveState();
      $("#detailDue").value = "";
      $("#detailDueHint").textContent = "";
      $("#detailDueHint").className = "due-hint";
    });

    $("#detailStatus").addEventListener("click", (event) => {
      const button = event.target.closest("[data-set-status]");
      if (!button) return;
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.status = button.dataset.setStatus;
      const target = syncCardToList(found);
      saveState();
      renderDetailStatus(found.card);
      if (target) renderDetailListSelect(found.board, target);
      renderBoardMeta();
    });

    $("#detailLabels").addEventListener("click", (event) => {
      const button = event.target.closest("[data-label-id]");
      if (!button) return;
      const found = findCard(ui.openCardId);
      if (!found) return;
      const id = button.dataset.labelId;
      const index = found.card.labels.indexOf(id);
      if (index >= 0) found.card.labels.splice(index, 1);
      else found.card.labels.push(id);
      saveState();
      renderDetailLabels(found.board, found.card);
    });

    $("#detailList").addEventListener("change", (event) => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      const target = found.board.lists.find((l) => l.id === event.target.value);
      if (!target || target.id === found.list.id) return;
      found.list.cards = found.list.cards.filter((c) => c.id !== found.card.id);
      target.cards.push(found.card);
      const st = statusFromListName(target.name);
      if (st) found.card.status = st;
      saveState();
      fillCardModal();
      renderBoardMeta();
      toast("Tarjeta movida a «" + target.name + "»");
    });

    $("#addCheckForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const found = findCard(ui.openCardId);
      if (!found) return;
      const input = $("#newCheckText");
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      found.card.checklist.push({ id: uid("i"), text: text, done: false });
      saveState();
      input.value = "";
      renderChecklist(found.card);
      input.focus();
    });

    $("#detailChecklist").addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-check-toggle]");
      if (!checkbox) return;
      const found = findCard(ui.openCardId);
      if (!found) return;
      const item = found.card.checklist.find((i) => i.id === checkbox.dataset.checkToggle);
      if (!item) return;
      item.done = checkbox.checked;
      saveState();
      renderChecklist(found.card);
    });

    $("#detailChecklist").addEventListener("click", (event) => {
      const button = event.target.closest("[data-check-delete]");
      if (!button) return;
      const found = findCard(ui.openCardId);
      if (!found) return;
      found.card.checklist = found.card.checklist.filter((i) => i.id !== button.dataset.checkDelete);
      saveState();
      renderChecklist(found.card);
    });

    /* Documentos adjuntos */
    $("#btnAttach").addEventListener("click", () => $("#attachInput").click());
    $("#attachInput").addEventListener("change", (event) => {
      addAttachmentsToCard(event.target.files);
      event.target.value = "";
    });

    const attachDrop = $("#attachDrop");
    attachDrop.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.stopPropagation();
      attachDrop.classList.add("is-over");
    });
    attachDrop.addEventListener("dragleave", () => attachDrop.classList.remove("is-over"));
    attachDrop.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      attachDrop.classList.remove("is-over");
      if (event.dataTransfer && event.dataTransfer.files) addAttachmentsToCard(event.dataTransfer.files);
    });

    $("#attachList").addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-open-attach]");
      if (openButton) {
        openAttachment(openButton.dataset.openAttach);
        return;
      }
      const deleteButton = event.target.closest("[data-delete-attach]");
      if (deleteButton) deleteAttachment(deleteButton.dataset.deleteAttach);
    });

    $("#btnManageLabels").addEventListener("click", openLabelsModal);

    $("#btnDeleteCard").addEventListener("click", () => {
      const found = findCard(ui.openCardId);
      if (!found) return;
      if (!confirm('¿Eliminar la tarjeta "' + found.card.title + '"?')) return;
      found.list.cards = found.list.cards.filter((c) => c.id !== found.card.id);
      saveState();
      closeModal("cardModal");
      toast("Tarjeta eliminada");
    });

    /* Etiquetas */
    $("#btnAddLabel").addEventListener("click", () => {
      const board = currentBoard();
      if (!board) return;
      const used = new Set(board.labels.map((l) => l.color));
      const color = LABEL_COLORS.find((c) => !used.has(c.value)) || LABEL_COLORS[board.labels.length % LABEL_COLORS.length];
      board.labels.push({ id: uid("lb"), name: "Etiqueta " + (board.labels.length + 1), color: color.value });
      saveState();
      renderLabelsEditor();
      render();
      const inputs = $$(".label-name-input");
      const last = inputs[inputs.length - 1];
      if (last) {
        last.focus();
        last.select();
      }
    });

    $("#labelsEditor").addEventListener("input", (event) => {
      if (!event.target.classList.contains("label-name-input")) return;
      const row = event.target.closest(".label-row");
      const board = currentBoard();
      if (!row || !board) return;
      const label = board.labels.find((l) => l.id === row.dataset.labelId);
      if (!label) return;
      label.name = event.target.value;
      saveState();
    });

    $("#labelsEditor").addEventListener("click", (event) => {
      const colorButton = event.target.closest("[data-color]");
      if (colorButton) {
        const row = colorButton.closest(".label-row");
        const board = currentBoard();
        if (!row || !board) return;
        const label = board.labels.find((l) => l.id === row.dataset.labelId);
        if (!label) return;
        label.color = colorButton.dataset.color;
        saveState();
        renderLabelsEditor();
        render();
        if (ui.openCardId) fillCardModal();
        return;
      }

      const deleteButton = event.target.closest("[data-delete-label]");
      if (deleteButton) {
        const board = currentBoard();
        if (!board) return;
        const labelId = deleteButton.dataset.deleteLabel;
        const label = board.labels.find((l) => l.id === labelId);
        if (!label) return;
        if (!confirm('¿Eliminar la etiqueta "' + label.name + '"? Se quitará de todas las tarjetas.')) return;
        board.labels = board.labels.filter((l) => l.id !== labelId);
        board.lists.forEach((list) => {
          list.cards.forEach((card) => {
            card.labels = card.labels.filter((id) => id !== labelId);
          });
        });
        ui.filterLabels.delete(labelId);
        saveState();
        renderLabelsEditor();
        render();
        if (ui.openCardId) fillCardModal();
      }
    });

    /* Exportar / importar / reiniciar */
    $("#btnExport").addEventListener("click", exportData);
    $("#btnImport").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      importData(file);
      event.target.value = "";
    });
    $("#btnReset").addEventListener("click", () => {
      if (!confirm("Se borrarán todos tus tableros y se creará uno nuevo con las secciones en blanco. ¿Continuar?")) return;
      state = seedState();
      ui.boardId = state.boards[0].id;
      clearFilters();
      saveState();
      render();
      toast("Tablero reiniciado en blanco");
    });

    /* Delegación general */
    document.addEventListener("click", (event) => {
      /* Cerrar menú de lista y popover de filtros al hacer clic fuera */
      if (ui.listMenuId && !event.target.closest(".list-menu") && !event.target.closest('[data-action="toggle-list-menu"]')) {
        ui.listMenuId = null;
        renderLists();
      }
      if (!$("#filterPopover").contains(event.target) && !event.target.closest("#btnFilter")) {
        $("#filterPopover").classList.remove("show");
      }

      /* Guardar la edición en línea de una tarjeta si se hace clic fuera de ella */
      if (ui.editingCardId && !event.target.closest(".card-edit")) {
        const editForm = $('.card-edit[data-id="' + ui.editingCardId + '"]');
        if (editForm) saveCardEdit(editForm);
      }

      if (event.target.closest("#btnCopyShare")) {
        copyShareLink();
        return;
      }

      if (event.target.closest("#btnSaveFbConfig")) {
        saveFbConfigFromInput();
        return;
      }

      if (event.target.closest("#btnResetFbConfig")) {
        resetFbConfig();
        return;
      }

      if (event.target.closest("#btnReconnect")) {
        refreshPublicUrl().then(() => renderShareBody(cloud.shareId));
        return;
      }

      /* Cerrar modales */
      const closeEl = event.target.closest("[data-close]");
      if (closeEl) {
        closeModal(closeEl.dataset.close);
        return;
      }

      /* Acciones */
      const actionEl = event.target.closest("[data-action]");
      if (actionEl) {
        const action = actionEl.dataset.action;
        const id = actionEl.dataset.id;

        if (action === "open-board") {
          if (id !== ui.boardId) {
            ui.boardId = id;
            clearFilters();
            ui.composerListId = null;
            ui.listMenuId = null;
            ui.renamingListId = null;
            $("#filterPopover").classList.remove("show");
            $("#addListForm").classList.add("hidden");
            $("#btnAddList").classList.remove("hidden");
            $("#newListName").value = "";
            saveState();
            render();
            if (window.innerWidth <= 900) setSidebar(false);
          }
          return;
        }

        if (action === "toggle-list-menu") {
          ui.listMenuId = ui.listMenuId === id ? null : id;
          renderLists();
          return;
        }

        if (action === "rename-list") {
          ui.listMenuId = null;
          ui.renamingListId = id;
          renderLists();
          return;
        }

        if (action === "delete-list") {
          ui.listMenuId = null;
          deleteList(id);
          return;
        }

        if (action === "open-composer") {
          ui.composerListId = id;
          ui.composerDraft = "";
          renderLists();
          return;
        }

        if (action === "close-composer") {
          ui.composerListId = null;
          ui.composerDraft = "";
          renderLists();
          return;
        }

        if (action === "edit-card") {
          ui.editingCardId = id;
          ui.composerListId = null;
          renderLists();
          return;
        }

        if (action === "cancel-edit-card") {
          ui.editingCardId = null;
          renderLists();
          return;
        }

        if (action === "cycle-status") {
          const found = findCard(id);
          if (found) {
            const index = STATUS_KEYS.indexOf(found.card.status);
            found.card.status = STATUS_KEYS[(index + 1) % STATUS_KEYS.length];
            syncCardToList(found);
            saveState();
            renderBoardMeta();
            renderLists();
            toast("Estado: " + STATUSES[found.card.status].label);
          }
          return;
        }

        if (action === "filter-label") {
          toggleFilter("label", id);
          return;
        }

        if (action === "filter-status") {
          toggleFilter("status", id);
          return;
        }

        if (action === "clear-filters") {
          clearFilters();
          renderFilters();
          renderLists();
          renderBoardMeta();
          updateLegend();
          updateFilterButton();
          return;
        }
      }

      /* Abrir tarjeta (salvo si estamos editando su texto en línea) */
      if (event.target.closest(".card-edit")) return;
      const cardEl = event.target.closest(".card");
      if (cardEl && ui.editingCardId !== cardEl.dataset.id) {
        openCard(cardEl.dataset.id);
      }
    });

    /* Doble clic sobre el texto de una tarjeta para editarlo en el sitio */
    document.addEventListener("dblclick", (event) => {
      const titleEl = event.target.closest(".card-title");
      if (!titleEl) return;
      const cardEl = titleEl.closest(".card");
      if (!cardEl || isFiltering()) return;
      event.preventDefault();
      ui.editingCardId = cardEl.dataset.id;
      ui.composerListId = null;
      renderLists();
    });

    /* Formularios dinámicos (renombrar lista y componer tarjeta) */
    document.addEventListener("submit", (event) => {
      const renameForm = event.target.closest(".list-rename-form");
      if (renameForm) {
        event.preventDefault();
        const board = currentBoard();
        const list = board && board.lists.find((l) => l.id === renameForm.dataset.listId);
        const input = $(".list-rename-input", renameForm);
        const value = input ? input.value.trim() : "";
        if (list && value) list.name = value;
        ui.renamingListId = null;
        saveState();
        render();
        return;
      }

      const composer = event.target.closest(".composer");
      if (composer) {
        event.preventDefault();
        const textarea = $("textarea", composer);
        const title = textarea ? textarea.value.trim() : "";
        if (!title) {
          if (textarea) textarea.focus();
          return;
        }
        ui.composerDraft = "";
        addCard(composer.dataset.listId, title);
        return;
      }

      const editForm = event.target.closest(".card-edit");
      if (editForm) {
        event.preventDefault();
        saveCardEdit(editForm);
        return;
      }
    });

    /* Guardar el borrador del compositor para que no se pierda al re-renderizar */
    document.addEventListener("input", (event) => {
      if (event.target.classList && event.target.classList.contains("card-edit-input")) {
        autosize(event.target);
        return;
      }
      if (!event.target.classList || !event.target.classList.contains("composer-text")) return;
      const composer = event.target.closest(".composer");
      if (composer) ui.composerDraft = event.target.value;
    });

    /* Guardar la edición en línea al salir del campo (clic fuera) */
    document.addEventListener("focusout", (event) => {
      if (event.target.classList && event.target.classList.contains("card-edit-input")) {
        const form = event.target.closest(".card-edit");
        const next = event.relatedTarget;
        if (form && next && form.contains(next)) return; /* Guardar / Cancelar */
        setTimeout(() => {
          if (ui.editingCardId && form && form.isConnected) saveCardEdit(form);
        }, 0);
        return;
      }
    });

    /* Guardar renombrado al perder el foco */
    document.addEventListener("focusout", (event) => {
      if (!event.target.classList.contains("list-rename-input")) return;
      const form = event.target.closest(".list-rename-form");
      if (!form) return;
      const id = form.dataset.listId;
      const value = event.target.value.trim();
      setTimeout(() => {
        if (ui.renamingListId !== id) return;
        const board = currentBoard();
        const list = board && board.lists.find((l) => l.id === id);
        if (list && value) list.name = value;
        ui.renamingListId = null;
        saveState();
        render();
      }, 100);
    });

    /* Teclas */
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!$("#labelsModal").classList.contains("hidden") ||
            !$("#boardModal").classList.contains("hidden") ||
            !$("#cardModal").classList.contains("hidden") ||
            $("#filterPopover").classList.contains("show") ||
            ui.listMenuId) {
          event.preventDefault();
          closeTopModal();
          return;
        }
        if (ui.renamingListId) {
          event.preventDefault();
          ui.renamingListId = null;
          renderLists();
          return;
        }
        if (ui.editingCardId) {
          event.preventDefault();
          ui.editingCardId = null;
          renderLists();
          return;
        }
        if (!$("#addListForm").classList.contains("hidden")) {
          event.preventDefault();
          $("#addListForm").classList.add("hidden");
          $("#btnAddList").classList.remove("hidden");
          $("#newListName").value = "";
          return;
        }
        if (ui.composerListId) {
          event.preventDefault();
          ui.composerListId = null;
          renderLists();
          return;
        }
        if (window.innerWidth <= 900 && ui.sidebarOpen) {
          setSidebar(false);
        }
        return;
      }

      if (event.key === "Enter" && document.activeElement && document.activeElement.classList.contains("card")) {
        event.preventDefault();
        openCard(document.activeElement.dataset.id);
        return;
      }

      /* Enter (sin Shift) guarda la edición en línea; Shift+Enter hace salto de línea */
      if (event.key === "Enter" && !event.shiftKey &&
          event.target.classList && event.target.classList.contains("card-edit-input")) {
        event.preventDefault();
        const form = event.target.closest(".card-edit");
        if (form) {
          if (typeof form.requestSubmit === "function") form.requestSubmit();
          else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
        return;
      }

      /* Enter (sin Shift) añade la tarjeta; Shift+Enter hace salto de línea */
      if (event.key === "Enter" && !event.shiftKey &&
          event.target.classList && event.target.classList.contains("composer-text")) {
        event.preventDefault();
        const form = event.target.closest(".composer");
        if (form) {
          if (typeof form.requestSubmit === "function") form.requestSubmit();
          else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      }
    });

    /* Redimensionado */
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && $("#scrim").classList.contains("show")) {
        setSidebar(true);
      }
    });
  }

  function setSidebar(open) {
    ui.sidebarOpen = open;
    const mobile = window.innerWidth <= 900;
    const app = $("#app");
    if (mobile) {
      app.classList.toggle("mobile-open", open);
      app.classList.remove("sidebar-collapsed");
    } else {
      app.classList.toggle("sidebar-collapsed", !open);
      app.classList.remove("mobile-open");
    }
    $("#scrim").classList.toggle("show", mobile && open);
  }

  /* ---------- Inicio ---------- */

  function init() {
    setupEvents();
    setupDragAndDrop();
    setSidebar(window.innerWidth > 900);
    render();
    if (!storageAvailable()) {
      setTimeout(() => {
        toast("Aviso: el navegador bloquea el almacenamiento; los cambios no se conservarán");
      }, 400);
    }
    if (!state.boards.length) {
      setTimeout(() => openBoardModal("new"), 150);
    }

    /* ¿Se abrió un enlace de tablero compartido? */
    applyCloudFromUrl();
    bootShare();
  }

  async function bootShare() {
    const sharedId = readShareIdFromUrl();
    await ensureBackend();
    if (!sharedId) {
      /* En modo SQL Server el tablero activo se sincroniza solo. */
      syncActiveBoard();
      return;
    }
    if (!cloud.mode) {
      setTimeout(() => {
        toast("Este enlace es de un tablero compartido, pero falta configurar la conexión");
      }, 500);
      return;
    }
    const existing = boardForShare(sharedId);
    if (existing) ui.boardId = existing.id;
    render();
    /* No publicamos nuestro tablero local: solo leemos el compartido. */
    connectSharedBoard(sharedId, { firstConnect: false, silent: true });
    toast("Conectando con el tablero compartido…");
  }

  /* Mantener el enlace compartido al cambiar de pestaña/recargar */
  window.addEventListener("hashchange", async () => {
    applyCloudFromUrl();
    const sharedId = readShareIdFromUrl();
    await ensureBackend();
    if (sharedId && cloud.mode) {
      connectSharedBoard(sharedId, { firstConnect: false, silent: true });
    }
  });

  init();
})();
