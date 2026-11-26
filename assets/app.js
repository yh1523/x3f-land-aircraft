/* 交互：进度条 / 目录高亮 / 计数 / 计算方法器 / 打印 */
(function () {
  "use strict";
  var doc = document;
  var progress = doc.getElementById("progress");
  var nav = doc.querySelector(".nav");
  var burger = doc.getElementById("btnMenu");
  var links = Array.prototype.slice.call(doc.querySelectorAll(".nav a"));
  var sections = links.map(function (a) {
    return doc.querySelector(a.getAttribute("href"));
  });

  function onScroll() {
    var h = doc.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct.toFixed(2) + "%";

    var current = 0;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s && s.getBoundingClientRect().top <= 140) current = i;
    }
    links.forEach(function (a, i) {
      a.classList.toggle("active", i === current);
    });
  }

  if (doc.addEventListener) doc.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* 数字滚动 */
  var counters = doc.querySelectorAll("[data-count]");
  function animate(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var start = performance.now();
    var dur = 1100;
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = Math.round(target * eased);
      el.textContent = val + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(counters, function (c) { io.observe(c); });
    /* 兜底：动画未触发时也保证终值可见 */
    setTimeout(function () {
      Array.prototype.forEach.call(counters, function (c) {
        var t = parseFloat(c.getAttribute("data-count"));
        var s = c.getAttribute("data-suffix") || "";
        if (c.textContent === "0" || c.textContent === "0" + s) c.textContent = t + s;
      });
    }, 2000);
  } else {
    Array.prototype.forEach.call(counters, animate);
  }

  /* 拥有成本计算器 */
  var els = {
    price: doc.getElementById("inPrice"),
    hours: doc.getElementById("inHours"),
    years: doc.getElementById("inYears"),
    maint: doc.getElementById("inMaint"),
    kwh: doc.getElementById("inKwh"),
    energy: doc.getElementById("inEnergy"),
    outHour: doc.getElementById("outHour"),
    outTrip: doc.getElementById("outTrip"),
    outKm: doc.getElementById("outKm"),
    outTotal: doc.getElementById("outTotal")
  };

  function num(el, fallback) {
    var v = el ? parseFloat(el.value) : NaN;
    return isFinite(v) && v > 0 ? v : fallback;
  }

  function money(v) {
    if (v >= 10000) return (v / 10000).toFixed(1) + "<small>万元</small>";
    return Math.round(v).toLocaleString("zh-CN") + "<small>元</small>";
  }

  function recalc() {
    if (!els.price) return;
    var price = num(els.price, 200) * 10000;
    var hours = num(els.hours, 60);
    var years = num(els.years, 5);
    var maintRate = num(els.maint, 8) / 100;
    var kwhPrice = num(els.kwh, 1.2);
    var energy = num(els.energy, 54);

    var depreciation = price / years;
    var maintenance = price * maintRate;
    var insurance = price * 0.015;
    var site = 20000;
    var annualFixed = depreciation + maintenance + insurance + site;
    var annualEnergy = energy * kwhPrice * hours * (60 / 18);

    var perHour = (annualFixed + annualEnergy) / hours;
    var perTrip = perHour * (18 / 60);
    var perKm = perTrip / 30 / 2; /* 2 座，按座公里折算 */
    var total5 = (annualFixed + annualEnergy) * years;

    if (els.outHour) els.outHour.innerHTML = money(perHour);
    if (els.outTrip) els.outTrip.innerHTML = money(perTrip);
    if (els.outKm) els.outKm.innerHTML = perKm.toFixed(1) + "<small>元/人·km</small>";
    if (els.outTotal) els.outTotal.innerHTML = money(total5);
  }

  ["price", "hours", "years", "maint", "kwh", "energy"].forEach(function (k) {
    if (els[k]) els[k].addEventListener("input", recalc);
  });
  recalc();

  /* 打印 */
  var printBtn = doc.getElementById("btnPrint");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
})();
