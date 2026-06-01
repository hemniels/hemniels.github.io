document.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("tsChart");
  const slider = document.getElementById("forecastSlider");
  const forecastValue = document.getElementById("forecastValue");
  const toggleBtn = document.getElementById("toggleAnomaly");

  if (!svg || !slider || !forecastValue || !toggleBtn) return;

  const NS = "http://www.w3.org/2000/svg";
  const WIDTH = 800;
  const HEIGHT = 320;
  const MARGIN = { top: 24, right: 18, bottom: 28, left: 18 };
  const BASE_LEN = 40;
  const THRESHOLD = 150;

  let showAnomalies = true;

  function generateSignal(len = BASE_LEN) {
    return Array.from({ length: len }, (_, i) => {
      const wave = Math.sin(i * 0.5) * 18 + Math.sin(i * 0.12) * 10;
      const drift = Math.sin(i * 0.03) * 4;
      const noise = Math.sin(i * 1.7) * 1.8 + Math.cos(i * 0.9) * 1.2;
      return 120 + wave + drift + noise;
    });
  }

  function buildForecast(base, horizon) {
    const forecast = base.slice();
    const n = base.length;

    for (let i = 0; i < horizon; i++) {
      const prev = forecast[forecast.length - 1];
      const template = base[(n - 1 + i) % n];
      const trend = (template - base[n - 1]) * 0.15;
      const value = prev + trend * 0.2 + Math.sin((n + i) * 0.4) * 0.8;
      forecast.push(value);
    }

    return forecast;
  }

  const baseSignal = generateSignal(BASE_LEN);

  function xScale(i, total) {
    const w = WIDTH - MARGIN.left - MARGIN.right;
    return MARGIN.left + (i / Math.max(total - 1, 1)) * w;
  }

  function yScale(v, min, max) {
    const h = HEIGHT - MARGIN.top - MARGIN.bottom;
    return MARGIN.top + (1 - (v - min) / Math.max(max - min, 1)) * h;
  }

  function createEl(name, attrs = {}) {
    const el = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function clearSvg() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function pathFromPoints(points) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }

  function render() {
    const horizon = Number(slider.value);
    forecastValue.textContent = horizon;

    const forecast = buildForecast(baseSignal, horizon);
    const allValues = forecast.concat([THRESHOLD]);
    const min = Math.min(...allValues) - 5;
    const max = Math.max(...allValues) + 5;

    const basePoints = baseSignal.map((v, i) => ({
      x: xScale(i, BASE_LEN + horizon),
      y: yScale(v, min, max),
      value: v
    }));

    const forecastPoints = forecast.map((v, i) => ({
      x: xScale(i, forecast.length),
      y: yScale(v, min, max),
      value: v
    }));

    clearSvg();

    svg.appendChild(createEl("rect", {
      x: "0", y: "0", width: WIDTH, height: HEIGHT,
      fill: "#fff"
    }));

    const gridLines = 4;
    for (let i = 1; i <= gridLines; i++) {
      const y = MARGIN.top + ((HEIGHT - MARGIN.top - MARGIN.bottom) * i) / (gridLines + 1);
      svg.appendChild(createEl("line", {
        x1: MARGIN.left,
        y1: y.toString(),
        x2: WIDTH - MARGIN.right,
        y2: y.toString(),
        stroke: "#e9ecef",
        "stroke-width": "1"
      }));
    }

    svg.appendChild(createEl("line", {
      x1: MARGIN.left,
      y1: yScale(THRESHOLD, min, max).toString(),
      x2: WIDTH - MARGIN.right,
      y2: yScale(THRESHOLD, min, max).toString(),
      stroke: "#111",
      "stroke-width": "1.5",
      "stroke-dasharray": "5 4"
    }));

    svg.appendChild(createEl("path", {
      d: pathFromPoints(basePoints),
      fill: "none",
      stroke: "#0d6efd",
      "stroke-width": "3",
      "stroke-linejoin": "round",
      "stroke-linecap": "round"
    }));

    const forecastStart = baseSignal.length - 1;
    const forecastTail = forecastPoints.slice(forecastStart);

    svg.appendChild(createEl("path", {
      d: pathFromPoints(forecastPoints),
      fill: "none",
      stroke: "#dc3545",
      "stroke-width": "2.5",
      "stroke-dasharray": "7 5",
      "stroke-linejoin": "round",
      "stroke-linecap": "round"
    }));

    if (showAnomalies) {
      forecastTail.forEach((p, idx) => {
        if (p.value > THRESHOLD) {
          svg.appendChild(createEl("circle", {
            cx: p.x.toString(),
            cy: p.y.toString(),
            r: "4.5",
            fill: "#111",
            stroke: "#fff",
            "stroke-width": "1.5"
          }));
        }
      });
    }

    const label = createEl("text", {
      x: (WIDTH - MARGIN.right).toString(),
      y: (yScale(THRESHOLD, min, max) - 6).toString(),
      "text-anchor": "end",
      fill: "#111",
      "font-size": "12"
    });
    label.textContent = `Threshold ${THRESHOLD}`;
    svg.appendChild(label);
  }

  slider.addEventListener("input", render);

  toggleBtn.addEventListener("click", () => {
    showAnomalies = !showAnomalies;
    toggleBtn.setAttribute("aria-pressed", String(showAnomalies));
    toggleBtn.textContent = showAnomalies ? "Anomalien ausblenden" : "Anomalien anzeigen";
    render();
  });

  render();
});