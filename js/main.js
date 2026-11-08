/* Language + theme switching, site config fill-in. Works as a browser script and as a CommonJS module for tests. */
(function () {
  "use strict";

  var LANG_KEY = "site-lang";
  var THEME_KEY = "site-theme";

  /* English is the default on every new visit; a Thai choice lasts for this tab's session only. */
  function resolveLang(stored) {
    return stored === "th" ? "th" : "en";
  }

  function resolveTheme(stored) {
    return stored === "light" || stored === "dark" ? stored : null;
  }

  function safeGet(storage, key) {
    try {
      if (!storage) return null;
      var v = storage.getItem(key);
      return v === undefined ? null : v;
    } catch (e) {
      return null;
    }
  }

  function safeSet(storage, key, value) {
    try {
      if (storage) storage.setItem(key, value);
    } catch (e) {
      /* storage blocked: choice lasts for this page only */
    }
  }

  function contactLinks(cfg) {
    cfg = cfg || {};
    var out = [];
    if (cfg.email) out.push({ key: "email", href: "mailto:" + cfg.email });
    if (cfg.github) out.push({ key: "github", href: cfg.github });
    if (cfg.linkedin) out.push({ key: "linkedin", href: cfg.linkedin });
    return out;
  }

  /* ---------- browser only ---------- */

  function storage() {
    try { return window.localStorage; } catch (e) { return undefined; }
  }

  function sessionStore() {
    try { return window.sessionStorage; } catch (e) { return undefined; }
  }

  function currentTheme(root) {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "dark" : "light";
  }

  function applyLang(lang) {
    var root = document.documentElement;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);

    var title = document.querySelector("title[data-title-th]");
    if (title) document.title = title.getAttribute("data-title-" + lang) || document.title;

    var imgs = document.querySelectorAll("img[data-alt-th][data-alt-en]");
    for (var i = 0; i < imgs.length; i++) imgs[i].setAttribute("alt", imgs[i].getAttribute("data-alt-" + lang));

    var labelled = document.querySelectorAll("[data-label-th][data-label-en]");
    for (var j = 0; j < labelled.length; j++) labelled[j].setAttribute("aria-label", labelled[j].getAttribute("data-label-" + lang));

    var toggles = document.querySelectorAll(".lang-toggle");
    for (var k = 0; k < toggles.length; k++) {
      var t = toggles[k];
      var th = t.querySelector("[data-l='th']");
      var en = t.querySelector("[data-l='en']");
      if (th && en) {
        th.className = lang === "th" ? "on" : "off";
        en.className = lang === "en" ? "on" : "off";
      }
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    var btns = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", currentTheme(root) === "dark" ? "true" : "false");
  }

  function fillSite(cfg) {
    cfg = cfg || {};
    var nodes = document.querySelectorAll("[data-site]");
    var links = {};
    contactLinks(cfg).forEach(function (l) { links[l.key] = l.href; });
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute("data-site");
      if (key === "nameTh" || key === "nameEn") {
        if (cfg[key]) el.textContent = cfg[key];
        continue;
      }
      if (links[key]) {
        if (el.tagName === "A") el.setAttribute("href", links[key]);
        if (key === "email" && !el.hasAttribute("data-keep-text")) el.textContent = cfg.email;
        el.hidden = false;
        var li = el.closest ? el.closest("li") : null;
        if (li) li.hidden = false;
      } else {
        el.hidden = true;
        el.removeAttribute("href");
        var li2 = el.closest ? el.closest("li") : null;
        if (li2) li2.hidden = true;
      }
    }
  }

  function init() {
    var store = storage();
    var langStore = sessionStore();
    var root = document.documentElement;
    applyLang(resolveLang(safeGet(langStore, LANG_KEY)));
    applyTheme(resolveTheme(safeGet(store, THEME_KEY)));
    fillSite(window.SITE);

    var langBtns = document.querySelectorAll(".lang-toggle");
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener("click", function () {
        var next = root.getAttribute("data-lang") === "th" ? "en" : "th";
        safeSet(langStore, LANG_KEY, next);
        applyLang(next);
      });
    }

    var themeBtns = document.querySelectorAll(".theme-toggle");
    for (var j = 0; j < themeBtns.length; j++) {
      themeBtns[j].addEventListener("click", function () {
        var next = currentTheme(root) === "dark" ? "light" : "dark";
        safeSet(store, THEME_KEY, next);
        applyTheme(next);
      });
    }
  }

  var api = {
    resolveLang: resolveLang,
    resolveTheme: resolveTheme,
    safeGet: safeGet,
    safeSet: safeSet,
    contactLinks: contactLinks
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
