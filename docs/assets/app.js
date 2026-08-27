/* CrowdDeck concept dashboard renderer - vanilla JS, no dependencies. */
(function () {
  "use strict";

  var DATA_FILES = {
    competitors: "data/competitors.json",
    oss: "data/oss-inventory.json",
    capabilities: "data/capabilities.json",
    sources: "data/sources.json"
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function chip(text, cls) {
    var c = el("span", "chip " + cls, text);
    return c;
  }

  function boot() {
    if (window.__CROWDDECK_DATA__) {
      render(window.__CROWDDECK_DATA__);
      return;
    }
    var keys = Object.keys(DATA_FILES);
    Promise.all(keys.map(function (k) {
      return fetch(DATA_FILES[k]).then(function (r) {
        if (!r.ok) throw new Error(DATA_FILES[k] + " -> HTTP " + r.status);
        return r.json();
      });
    })).then(function (results) {
      var data = {};
      keys.forEach(function (k, i) { data[k] = results[i]; });
      render(data);
    }).catch(function (err) {
      showLoadError(err);
    });
  }

  function showLoadError(err) {
    var hosts = document.querySelectorAll("[data-render]");
    for (var i = 0; i < hosts.length; i++) {
      var box = el("div", "loaderr");
      box.innerHTML =
        "<strong>Data could not be loaded.</strong><br>" +
        "This dashboard reads JSON from <code>docs/data/</code>. Browsers block that over " +
        "<code>file://</code>. Serve the folder instead: <code>npx serve docs</code> or " +
        "<code>python -m http.server -d docs 8080</code>, or view the published GitHub Pages site." +
        "<br><span class=\"mono\">" + String(err && err.message ? err.message : err) + "</span>";
      hosts[i].appendChild(box);
      break;
    }
  }

  /* ------------------------------------------------------------------ */
  function render(data) {
    renderStats(data);
    renderMatrix(data.competitors);
    renderProductCards(data.competitors);
    renderCapabilities(data.capabilities);
    renderOss(data.oss);
    renderContentSources(data.sources);
    renderInterconnect(data.sources);
    document.querySelectorAll("[data-generated]").forEach(function (n) {
      n.textContent = data.competitors.generated || "";
    });
  }

  /* ---------------------------- stats ------------------------------- */
  function renderStats(data) {
    var host = document.querySelector('[data-render="stats"]');
    if (!host) return;
    var caps = 0;
    data.capabilities.domains.forEach(function (d) { caps += d.capabilities.length; });
    var byVerdict = {};
    data.oss.items.forEach(function (i) { byVerdict[i.verdict] = (byVerdict[i.verdict] || 0) + 1; });

    var stats = [
      [String(data.competitors.products.length - 1), "products analysed"],
      [String(data.oss.items.length), "open-source projects triaged"],
      [String(caps), "capabilities in the merged set"],
      [String(byVerdict.FORK || 0) + " / " + String(byVerdict.ADOPT || 0), "to fork / to adopt"],
      [String(byVerdict.AVOID || 0), "flagged do-not-use"]
    ];
    stats.forEach(function (s) {
      var d = el("div", "stat");
      d.appendChild(el("b", null, s[0]));
      d.appendChild(el("span", null, s[1]));
      host.appendChild(d);
    });
  }

  /* --------------------------- matrix ------------------------------- */
  function renderMatrix(comp) {
    var host = document.querySelector('[data-render="matrix"]');
    if (!host) return;

    var wrap = el("div", "tablewrap");
    var table = el("table");
    var thead = el("thead");
    var hr = el("tr");
    hr.appendChild(el("th", null, "Product"));
    hr.appendChild(el("th", null, "Class"));
    comp.axes.forEach(function (a) {
      var th = el("th", null, a.label);
      th.title = a.desc;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el("tbody");
    comp.products.forEach(function (p) {
      var tr = el("tr", p.tier === "target" ? "target-row" : "");
      var td = el("td", "name", p.name);
      td.title = p.signature;
      tr.appendChild(td);
      tr.appendChild(el("td", "small", p.tier === "dj" ? "DJ software"
        : p.tier === "jukebox" ? "Jukebox"
        : p.tier === "oss" ? "Open source"
        : "Target"));
      comp.axes.forEach(function (a) {
        var v = p.scores[a.id];
        var c = el("td", "heat heat-" + v, String(v));
        c.title = p.name + " - " + a.label + ": " + v + "/5";
        tr.appendChild(c);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    host.appendChild(wrap);

    var legend = el("p", "small");
    legend.innerHTML = "Depth of published capability, 0 (absent) to 5 (best in class). " +
      "Hover any product name for its signature feature set. " +
      "The highlighted row is the proposed target, not a shipped product.";
    host.appendChild(legend);
  }

  function renderProductCards(comp) {
    var host = document.querySelector('[data-render="products"]');
    if (!host) return;
    var grid = el("div", "grid g2");
    comp.products.forEach(function (p) {
      var card = el("div", "card" + (p.tier === "target" ? " accent" : ""));
      var h = el("h4");
      h.appendChild(document.createTextNode(p.name));
      h.appendChild(chip(p.tier === "dj" ? "DJ" : p.tier === "jukebox" ? "Jukebox" : p.tier === "oss" ? "OSS" : "Target", "chip-tier"));
      card.appendChild(h);
      card.appendChild(el("p", null, p.signature));
      var m = el("div", "meta");
      m.textContent = p.vendor + "  ·  " + p.model;
      card.appendChild(m);
      var s = el("div", "meta");
      s.textContent = "Sources: " + p.sources;
      card.appendChild(s);
      grid.appendChild(card);
    });
    host.appendChild(grid);
  }

  /* ------------------------- capabilities --------------------------- */
  function renderCapabilities(caps) {
    var host = document.querySelector('[data-render="capabilities"]');
    if (!host) return;

    var state = { pri: "ALL" };
    var controls = el("div", "controls");
    ["ALL", "P0", "P1", "P2"].forEach(function (p) {
      var b = el("button", "chipbtn", p === "ALL" ? "All priorities" : p);
      b.setAttribute("aria-pressed", p === "ALL" ? "true" : "false");
      b.addEventListener("click", function () {
        state.pri = p;
        controls.querySelectorAll(".chipbtn").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        draw();
      });
      controls.appendChild(b);
    });
    var count = el("span", "countnote");
    controls.appendChild(count);
    host.appendChild(controls);

    var body = el("div");
    host.appendChild(body);

    function draw() {
      body.innerHTML = "";
      var shown = 0;
      caps.domains.forEach(function (dom) {
        var items = dom.capabilities.filter(function (c) {
          return state.pri === "ALL" || c.priority === state.pri;
        });
        if (!items.length) return;
        shown += items.length;

        var d = el("details", "dom");
        if (state.pri !== "ALL" || dom.id === "fusion") d.open = true;
        var sm = el("summary");
        sm.appendChild(document.createTextNode(dom.name));
        var cnt = el("span", "cnt", items.length + " capabilities");
        sm.appendChild(cnt);
        d.appendChild(sm);

        var db = el("div", "dombody");
        db.appendChild(el("div", "domsum", dom.summary));
        items.forEach(function (c) {
          var row = el("div", "cap");
          var head = el("div", "caphead");
          head.appendChild(el("span", "capid", c.id));
          head.appendChild(el("span", "capname", c.name));
          head.appendChild(chip(c.priority, "chip-" + c.priority));
          row.appendChild(head);
          if (c.note) row.appendChild(el("div", "capnote", c.note));
          row.appendChild(el("div", "capfrom", "established by: " + c.from.join(" · ")));
          db.appendChild(row);
        });
        d.appendChild(db);
        body.appendChild(d);
      });
      count.textContent = shown + " shown";
    }
    draw();
  }

  /* ---------------------------- OSS --------------------------------- */
  function renderOss(oss) {
    var host = document.querySelector('[data-render="oss"]');
    if (!host) return;

    var state = { verdict: "ALL", q: "" };

    var controls = el("div", "controls");
    ["ALL", "FORK", "ADOPT", "REFERENCE", "AVOID"].forEach(function (v) {
      var b = el("button", "chipbtn", v === "ALL" ? "All verdicts" : v);
      b.setAttribute("aria-pressed", v === "ALL" ? "true" : "false");
      b.addEventListener("click", function () {
        state.verdict = v;
        controls.querySelectorAll(".chipbtn").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        draw();
      });
      controls.appendChild(b);
    });
    var search = el("input", "searchbox");
    search.type = "search";
    search.placeholder = "Filter by name, licence, layer…";
    search.addEventListener("input", function () { state.q = search.value.toLowerCase(); draw(); });
    controls.appendChild(search);
    var count = el("span", "countnote");
    controls.appendChild(count);
    host.appendChild(controls);

    var legend = el("div", "grid g2");
    Object.keys(oss.verdicts).forEach(function (k) {
      var c = el("div", "card");
      var h = el("h4");
      h.appendChild(chip(k, "chip-" + k));
      c.appendChild(h);
      c.appendChild(el("p", null, oss.verdicts[k]));
      legend.appendChild(c);
    });
    host.appendChild(legend);

    var wrap = el("div", "tablewrap");
    var table = el("table");
    var thead = el("thead");
    var hr = el("tr");
    ["Project", "Verdict", "Layer", "Licence", "Stars", "Lang", "Last push", "Why it matters / the catch"].forEach(function (h) {
      hr.appendChild(el("th", null, h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    table.appendChild(tbody);
    wrap.appendChild(table);
    host.appendChild(wrap);

    function draw() {
      tbody.innerHTML = "";
      var n = 0;
      oss.items.forEach(function (it) {
        if (state.verdict !== "ALL" && it.verdict !== state.verdict) return;
        var hay = (it.name + " " + it.repo + " " + it.license + " " + it.layer + " " + it.why + " " + it.catch).toLowerCase();
        if (state.q && hay.indexOf(state.q) === -1) return;
        n++;

        var tr = el("tr");
        var tdn = el("td", "name");
        var a = el("a", null, it.name);
        a.href = "https://github.com/" + it.repo;
        a.target = "_blank";
        a.rel = "noopener";
        tdn.appendChild(a);
        var repo = el("div", "mono");
        repo.style.color = "var(--txt-3)";
        repo.style.fontWeight = "400";
        repo.textContent = it.repo;
        tdn.appendChild(repo);
        tr.appendChild(tdn);

        var tdv = el("td");
        tdv.appendChild(chip(it.verdict, "chip-" + it.verdict));
        tr.appendChild(tdv);

        tr.appendChild(el("td", "small", it.layer));
        tr.appendChild(el("td", "mono", it.license));
        tr.appendChild(el("td", "mono", it.stars ? it.stars.toLocaleString() : "—"));
        tr.appendChild(el("td", "mono", it.lang || "—"));
        tr.appendChild(el("td", "mono", it.updated));

        var tdw = el("td", "small");
        tdw.style.minWidth = "340px";
        tdw.appendChild(el("div", null, it.why));
        var c = el("div");
        c.style.marginTop = "7px";
        c.style.color = "var(--warn)";
        c.textContent = "Catch: " + it.catch;
        tdw.appendChild(c);
        tr.appendChild(tdw);

        tbody.appendChild(tr);
      });
      count.textContent = n + " of " + oss.items.length + " projects";
    }
    draw();
  }

  /* ------------------------- content sources ------------------------ */
  function renderContentSources(src) {
    var host = document.querySelector('[data-render="content"]');
    if (!host) return;
    var wrap = el("div", "tablewrap");
    var table = el("table");
    var thead = el("thead");
    var hr = el("tr");
    ["Source", "Class", "Access", "Public-performance rights", "Fit", "Notes"].forEach(function (h) {
      hr.appendChild(el("th", null, h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    src.contentSources.forEach(function (s) {
      var tr = el("tr");
      if (s.fit === "EXCLUDED") tr.style.background = "rgba(255,92,122,0.07)";
      tr.appendChild(el("td", "name", s.name));
      tr.appendChild(el("td", "small", s.class));
      tr.appendChild(el("td", "small", s.access));
      tr.appendChild(el("td", "small", s.performanceRights));
      var tdf = el("td");
      var cls = s.fit === "EXCLUDED" ? "chip-AVOID"
        : s.fit.indexOf("P0") === 0 ? "chip-P0"
        : s.fit.indexOf("P1") === 0 ? "chip-P1" : "chip-P2";
      tdf.appendChild(chip(s.fit, cls));
      tr.appendChild(tdf);
      var tdn = el("td", "small", s.notes);
      tdn.style.minWidth = "300px";
      tr.appendChild(tdn);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    host.appendChild(wrap);
  }

  function renderInterconnect(src) {
    var host = document.querySelector('[data-render="interconnect"]');
    if (!host) return;
    var wrap = el("div", "tablewrap");
    var table = el("table");
    var thead = el("thead");
    var hr = el("tr");
    ["Protocol", "Role", "Resolution", "Platform support", "Verdict"].forEach(function (h) {
      hr.appendChild(el("th", null, h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    src.interconnect.forEach(function (p) {
      var tr = el("tr");
      tr.appendChild(el("td", "name", p.name));
      tr.appendChild(el("td", "small", p.role));
      tr.appendChild(el("td", "small", p.resolution));
      tr.appendChild(el("td", "small", p.support));
      var td = el("td", "small", p.verdict);
      td.style.minWidth = "300px";
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    host.appendChild(wrap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
