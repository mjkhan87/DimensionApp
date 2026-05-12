const STORAGE_KEY = "pn-dimensioning-calculator-v2";

const palette = ["#116a7b", "#d88c18", "#6a5acd", "#177245", "#b42318", "#4b6475", "#8a5a00"];
const chartHitAreas = new Map();

const defaults = {
  devices: [
    { device: "Camera", resolution: "720p @ 15 fps", codec: "H.264", avgUl: 2, avgDl: 0, peakUl: 2, peakDl: 0 },
    { device: "Camera", resolution: "720p @ 15 fps", codec: "H.265", avgUl: 1, avgDl: 0, peakUl: 1, peakDl: 0 },
    { device: "Camera", resolution: "720p @ 12.5 fps", codec: "TVI", avgUl: 0.3, avgDl: 0, peakUl: 0.3, peakDl: 0 },
    { device: "Camera", resolution: "720p @ 30 fps", codec: "H.264", avgUl: 6, avgDl: 0, peakUl: 6, peakDl: 0 },
    { device: "Camera", resolution: "720p @ 30 fps", codec: "H.265", avgUl: 4, avgDl: 0, peakUl: 4, peakDl: 0 },
    { device: "Camera", resolution: "720p @ 25 fps", codec: "TVI", avgUl: 1, avgDl: 0, peakUl: 1, peakDl: 0 },
    { device: "Camera", resolution: "1080p @ 30 fps", codec: "H.264", avgUl: 9, avgDl: 0, peakUl: 9, peakDl: 0 },
    { device: "Camera", resolution: "1080p @ 30 fps", codec: "H.265", avgUl: 5, avgDl: 0, peakUl: 5, peakDl: 0 },
    { device: "Camera", resolution: "1080p @ 25 fps", codec: "TVI", avgUl: 1.5, avgDl: 0, peakUl: 3, peakDl: 0 },
    { device: "Vehicle terminal", resolution: "N/A", codec: "N/A", avgUl: 1, avgDl: 3, peakUl: 1.5, peakDl: 10 },
    { device: "Vehicle dashcam", resolution: "N/A", codec: "N/A", avgUl: 4, avgDl: 0.5, peakUl: 0, peakDl: 0 },
    { device: "Tablets", resolution: "N/A", codec: "N/A", avgUl: 0.5, avgDl: 5, peakUl: 1.5, peakDl: 5 },
    { device: "Smartphone", resolution: "N/A", codec: "N/A", avgUl: 3, avgDl: 5, peakUl: 0, peakDl: 0 },
    { device: "Laptop", resolution: "N/A", codec: "N/A", avgUl: 3, avgDl: 5, peakUl: 0, peakDl: 0 }
  ],
  scenario: {
    sectors: 30,
    ulPerSector: 23,
    dlPerSector: 300,
    deviceTypes: [
      { label: "Cameras", deviceType: "Camera", config: "720p @ 15 fps | H.265" },
      { label: "Vehicles", deviceType: "Vehicle terminal", config: "Vehicle terminal" },
      { label: "Tablets", deviceType: "Tablets", config: "Tablets" }
    ],
    rows: [
      { quantities: [30, 10, 20] },
      { quantities: [40, 20, 40] },
      { quantities: [50, 30, 60] },
      { quantities: [60, 40, 80] },
      { quantities: [70, 50, 100] }
    ]
  },
  required: {
    ulPerSector: 23,
    dlPerSector: 330,
    sectorsPerSite: 3,
    rows: [
      { deviceType: "Camera", quantity: 35, config: "1080p @ 30 fps | H.265" },
      { deviceType: "Tablets", quantity: 20, config: "Tablets" },
      { deviceType: "Vehicle terminal", quantity: 25, config: "Vehicle terminal" },
      { deviceType: "Vehicle dashcam", quantity: 25, config: "Vehicle dashcam" },
      { deviceType: "Laptop", quantity: 25, config: "Laptop" },
      { deviceType: "Smartphone", quantity: 50, config: "Smartphone" }
    ]
  }
};

let state = loadState();

const $ = (id) => document.getElementById(id);
const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.devices)) return normalizeState({ ...clone(defaults), ...saved });
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return clone(defaults);
}

function normalizeState(nextState) {
  if (!Array.isArray(nextState.scenario.deviceTypes)) nextState.scenario = clone(defaults.scenario);
  nextState.scenario.rows = nextState.scenario.rows.map((row) => ({
    quantities: nextState.scenario.deviceTypes.map((_, index) => num(row.quantities?.[index]))
  }));
  return nextState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function configName(device) {
  const resolution = (device.resolution || "").trim();
  const codec = (device.codec || "").trim();
  if (resolution && codec && resolution !== "N/A" && codec !== "N/A") return `${resolution} | ${codec}`;
  return (device.device || "New device").trim();
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ceilDiv(value, divisor) {
  if (divisor <= 0 || value <= 0) return 0;
  return Math.ceil(value / divisor);
}

function formatMbps(value) {
  return `${numberFmt.format(value)} Mbps`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getDeviceByConfig(config) {
  return state.devices.find((device) => configName(device) === config) || state.devices[0] || { avgUl: 0, avgDl: 0, device: "" };
}

function firstDeviceForType(deviceType) {
  return state.devices.find((device) => device.device === deviceType) || state.devices[0];
}

function optionHtml(selected, filterDevice) {
  return state.devices
    .filter((device) => !filterDevice || device.device === filterDevice)
    .map((device) => {
      const name = configName(device);
      return `<option value="${escapeHtml(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`;
    })
    .join("");
}

function deviceTypeOptions(selected) {
  const types = [...new Set(state.devices.map((device) => device.device).filter(Boolean))];
  return types.map((type) => `<option value="${escapeHtml(type)}" ${type === selected ? "selected" : ""}>${escapeHtml(type)}</option>`).join("");
}

function renderAll() {
  renderInputs();
  renderScenarioDevices();
  renderScenarioTable();
  renderRequiredTable();
  renderDeviceTable();
  recalc();
}

function renderInputs() {
  $("scenario-sectors").value = state.scenario.sectors;
  $("scenario-ul").value = state.scenario.ulPerSector;
  $("scenario-dl").value = state.scenario.dlPerSector;
  $("required-ul").value = state.required.ulPerSector;
  $("required-dl").value = state.required.dlPerSector;
  $("sectors-per-site").value = state.required.sectorsPerSite;
}

function renderScenarioDevices() {
  $("scenario-device-body").innerHTML = state.scenario.deviceTypes
    .map((item, index) => `
      <tr>
        <td><input data-scenario-device-field="label" data-index="${index}" value="${escapeHtml(item.label)}"></td>
        <td><select data-scenario-device-field="deviceType" data-index="${index}">${deviceTypeOptions(item.deviceType)}</select></td>
        <td><select data-scenario-device-field="config" data-index="${index}">${optionHtml(item.config, item.deviceType)}</select></td>
        <td><button class="icon-button" title="Remove device type" data-remove-scenario-device="${index}" type="button">x</button></td>
      </tr>
    `)
    .join("");
}

function renderScenarioTable() {
  $("scenario-table-head").innerHTML = `
    <tr>
      <th>Scenario</th>
      ${state.scenario.deviceTypes.map((item) => `<th>${escapeHtml(item.label)}</th>`).join("")}
      <th>UL Used</th>
      <th>UL Spare</th>
      <th>DL Used</th>
      <th>DL Spare</th>
    </tr>
  `;
  $("scenario-table-body").innerHTML = state.scenario.rows
    .map((row, rowIndex) => `
      <tr>
        <td class="scenario-name">Scenario ${rowIndex + 1}</td>
        ${state.scenario.deviceTypes
          .map((_, deviceIndex) => `<td><input data-scenario-quantity="${deviceIndex}" data-index="${rowIndex}" type="number" min="0" step="1" value="${num(row.quantities[deviceIndex])}"></td>`)
          .join("")}
        <td class="number output" id="scenario-ul-used-${rowIndex}">0</td>
        <td class="number output" id="scenario-ul-spare-${rowIndex}">0</td>
        <td class="number output" id="scenario-dl-used-${rowIndex}">0</td>
        <td class="number output" id="scenario-dl-spare-${rowIndex}">0</td>
      </tr>
    `)
    .join("");
}

function renderRequiredTable() {
  $("sector-table-body").innerHTML = state.required.rows
    .map((row, index) => `
      <tr>
        <td><select data-sector-field="deviceType" data-index="${index}">${deviceTypeOptions(row.deviceType)}</select></td>
        <td><input data-sector-field="quantity" data-index="${index}" type="number" min="0" step="1" value="${row.quantity}"></td>
        <td><select data-sector-field="config" data-index="${index}">${optionHtml(row.config, row.deviceType)}</select></td>
        <td class="number" id="sector-ul-${index}">0</td>
        <td class="number" id="sector-dl-${index}">0</td>
        <td class="number output" id="sector-total-ul-${index}">0</td>
        <td class="number output" id="sector-total-dl-${index}">0</td>
        <td><button class="icon-button" title="Remove row" data-remove-sector="${index}" type="button">x</button></td>
      </tr>
    `)
    .join("");
}

function renderDeviceTable() {
  $("device-table-body").innerHTML = state.devices
    .map((device, index) => `
      <tr>
        <td><input data-device-field="device" data-index="${index}" value="${escapeHtml(device.device)}"></td>
        <td><input data-device-field="resolution" data-index="${index}" value="${escapeHtml(device.resolution)}"></td>
        <td><input data-device-field="codec" data-index="${index}" value="${escapeHtml(device.codec)}"></td>
        <td class="muted">${escapeHtml(configName(device))}</td>
        <td><input data-device-field="avgUl" data-index="${index}" type="number" min="0" step="0.1" value="${device.avgUl}"></td>
        <td><input data-device-field="avgDl" data-index="${index}" type="number" min="0" step="0.1" value="${device.avgDl}"></td>
        <td><input data-device-field="peakUl" data-index="${index}" type="number" min="0" step="0.1" value="${device.peakUl || 0}"></td>
        <td><input data-device-field="peakDl" data-index="${index}" type="number" min="0" step="0.1" value="${device.peakDl || 0}"></td>
        <td><button class="icon-button" title="Remove device" data-remove-device="${index}" type="button">x</button></td>
      </tr>
    `)
    .join("");
}

function calculateScenarios() {
  const availableUl = num(state.scenario.sectors) * num(state.scenario.ulPerSector);
  const availableDl = num(state.scenario.sectors) * num(state.scenario.dlPerSector);
  const devices = state.scenario.deviceTypes.map((item) => ({ ...item, device: getDeviceByConfig(item.config) }));

  return state.scenario.rows.map((row, index) => {
    const segments = devices.map((item, deviceIndex) => {
      const quantity = num(row.quantities[deviceIndex]);
      return {
        label: item.label || item.deviceType || `Device ${deviceIndex + 1}`,
        quantity,
        ul: quantity * num(item.device.avgUl),
        dl: quantity * num(item.device.avgDl),
        color: palette[deviceIndex % palette.length]
      };
    });
    const ulUsed = segments.reduce((sum, segment) => sum + segment.ul, 0);
    const dlUsed = segments.reduce((sum, segment) => sum + segment.dl, 0);
    return {
      label: `Scenario ${index + 1}`,
      availableUl,
      availableDl,
      segments,
      spareUl: Math.max(availableUl - ulUsed, 0),
      spareDl: Math.max(availableDl - dlUsed, 0),
      ulUsed,
      dlUsed
    };
  });
}

function calculateRequired() {
  const rows = state.required.rows.map((row) => {
    const device = getDeviceByConfig(row.config);
    const quantity = num(row.quantity);
    const totalUl = quantity * num(device.avgUl);
    const totalDl = quantity * num(device.avgDl);
    return { ...row, device, quantity, totalUl, totalDl };
  });
  const totalUl = rows.reduce((sum, row) => sum + row.totalUl, 0);
  const totalDl = rows.reduce((sum, row) => sum + row.totalDl, 0);
  const sectors = Math.max(ceilDiv(totalUl, num(state.required.ulPerSector)), ceilDiv(totalDl, num(state.required.dlPerSector)));
  const sites = ceilDiv(sectors, num(state.required.sectorsPerSite));
  return { rows, totalUl, totalDl, sectors, sites };
}

function recalc() {
  const scenarios = calculateScenarios();
  const availableUl = num(state.scenario.sectors) * num(state.scenario.ulPerSector);
  const availableDl = num(state.scenario.sectors) * num(state.scenario.dlPerSector);

  $("scenario-total-ul").textContent = formatMbps(availableUl);
  $("scenario-total-dl").textContent = formatMbps(availableDl);

  scenarios.forEach((row, index) => {
    $(`scenario-ul-used-${index}`).textContent = numberFmt.format(row.ulUsed);
    $(`scenario-ul-spare-${index}`).textContent = numberFmt.format(row.spareUl);
    $(`scenario-dl-used-${index}`).textContent = numberFmt.format(row.dlUsed);
    $(`scenario-dl-spare-${index}`).textContent = numberFmt.format(row.spareDl);
  });

  drawCapacityChart($("ul-chart"), scenarios, "ul");
  drawCapacityChart($("dl-chart"), scenarios, "dl");

  const required = calculateRequired();
  $("required-total-ul").textContent = formatMbps(required.totalUl);
  $("required-total-dl").textContent = formatMbps(required.totalDl);
  $("required-sectors").textContent = numberFmt.format(required.sectors);
  $("required-sites").textContent = numberFmt.format(required.sites);

  required.rows.forEach((row, index) => {
    $(`sector-ul-${index}`).textContent = numberFmt.format(row.device.avgUl);
    $(`sector-dl-${index}`).textContent = numberFmt.format(row.device.avgDl);
    $(`sector-total-ul-${index}`).textContent = numberFmt.format(row.totalUl);
    $(`sector-total-dl-${index}`).textContent = numberFmt.format(row.totalDl);
  });

  saveState();
}

function drawCapacityChart(canvas, scenarios, direction) {
  const ctx = canvas.getContext("2d");
  const scale = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth || 980;
  const displayHeight = canvas.clientHeight || 320;
  canvas.width = Math.floor(displayWidth * scale);
  canvas.height = Math.floor(displayHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const isUl = direction === "ul";
  const capacityKey = isUl ? "availableUl" : "availableDl";
  const spareKey = isUl ? "spareUl" : "spareDl";
  const valueKey = isUl ? "ul" : "dl";
  const maxValue = Math.max(...scenarios.map((row) => row[capacityKey]), 1);
  const chart = { left: 64, right: 18, top: 22, bottom: 72 };
  const width = displayWidth - chart.left - chart.right;
  const height = displayHeight - chart.top - chart.bottom;
  const gap = 18;
  const barWidth = Math.max(28, (width - gap * (scenarios.length - 1)) / scenarios.length);
  const hitAreas = [];

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.strokeStyle = "#dbe2ea";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chart.left, chart.top);
  ctx.lineTo(chart.left, chart.top + height);
  ctx.lineTo(chart.left + width, chart.top + height);
  ctx.stroke();

  ctx.fillStyle = "#637083";
  ctx.font = "12px Inter, sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const value = (maxValue / 4) * i;
    const y = chart.top + height - (value / maxValue) * height;
    ctx.strokeStyle = "#eef2f6";
    ctx.beginPath();
    ctx.moveTo(chart.left, y);
    ctx.lineTo(chart.left + width, y);
    ctx.stroke();
    ctx.fillText(numberFmt.format(value), chart.left - 8, y + 4);
  }

  scenarios.forEach((row, index) => {
    const x = chart.left + index * (barWidth + gap);
    let y = chart.top + height;
    const segments = [
      ...row.segments.map((segment) => ({ label: segment.label, value: segment[valueKey], color: segment.color })),
      { label: "Spare", value: row[spareKey], color: "#dbe2ea" }
    ];
    segments.forEach((item) => {
      const segmentHeight = (item.value / maxValue) * height;
      y -= segmentHeight;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, segmentHeight);
      hitAreas.push({ x, y, width: barWidth, height: segmentHeight, scenario: row.label, label: item.label, value: item.value, direction: isUl ? "UL" : "DL" });
    });
    ctx.fillStyle = "#17202a";
    ctx.textAlign = "center";
    ctx.font = "700 12px Inter, sans-serif";
    ctx.fillText(row.label.replace("Scenario ", "S"), x + barWidth / 2, chart.top + height + 22);
  });

  let legendX = chart.left;
  const legendY = displayHeight - 26;
  const legendItems = [
    ...state.scenario.deviceTypes.map((item, index) => ({ label: item.label, color: palette[index % palette.length] })),
    { label: "Spare", color: "#dbe2ea" }
  ];
  legendItems.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, legendY - 10, 12, 12);
    ctx.fillStyle = "#637083";
    ctx.textAlign = "left";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(item.label, legendX + 17, legendY);
    legendX += ctx.measureText(item.label).width + 48;
  });
  chartHitAreas.set(canvas.id, hitAreas);
}

function addScenarioDevice() {
  const first = state.devices[0];
  state.scenario.deviceTypes.push({
    label: first.device,
    deviceType: first.device,
    config: configName(first)
  });
  state.scenario.rows.forEach((row) => row.quantities.push(0));
  renderAll();
}

function removeScenarioDevice(index) {
  if (state.scenario.deviceTypes.length <= 1) return;
  state.scenario.deviceTypes.splice(index, 1);
  state.scenario.rows.forEach((row) => row.quantities.splice(index, 1));
  renderAll();
}

function showChartTooltip(event) {
  const canvas = event.target;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const hit = (chartHitAreas.get(canvas.id) || []).find((area) => x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height);
  const tooltip = $("chart-tooltip");
  if (!hit) {
    tooltip.hidden = true;
    return;
  }
  tooltip.innerHTML = `<strong>${escapeHtml(hit.scenario)} - ${escapeHtml(hit.direction)}</strong><div><span>${escapeHtml(hit.label)}</span><b>${numberFmt.format(hit.value)} Mbps</b></div>`;
  tooltip.style.left = `${event.clientX + 14}px`;
  tooltip.style.top = `${event.clientY + 14}px`;
  tooltip.hidden = false;
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (tab) {
    document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("is-active", button === tab));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-active"));
    $(`${tab.dataset.tab}-view`).classList.add("is-active");
    recalc();
  }

  if (event.target.id === "reset-scenarios") {
    state.scenario = clone(defaults.scenario);
    renderAll();
  }
  if (event.target.id === "add-scenario-device") addScenarioDevice();
  if (event.target.id === "reset-sector-mix") {
    state.required = clone(defaults.required);
    renderAll();
  }
  if (event.target.id === "reset-devices") {
    state.devices = clone(defaults.devices);
    renderAll();
  }
  if (event.target.id === "add-sector-row") {
    const first = state.devices[0];
    state.required.rows.push({ deviceType: first.device, quantity: 0, config: configName(first) });
    renderRequiredTable();
    recalc();
  }
  if (event.target.id === "add-device") {
    state.devices.push({ device: "New device", resolution: "N/A", codec: "N/A", avgUl: 0, avgDl: 0, peakUl: 0, peakDl: 0 });
    renderAll();
  }
  if (event.target.dataset.removeScenarioDevice !== undefined) removeScenarioDevice(Number(event.target.dataset.removeScenarioDevice));
  if (event.target.dataset.removeSector !== undefined) {
    state.required.rows.splice(Number(event.target.dataset.removeSector), 1);
    renderRequiredTable();
    recalc();
  }
  if (event.target.dataset.removeDevice !== undefined) {
    if (state.devices.length > 1) state.devices.splice(Number(event.target.dataset.removeDevice), 1);
    renderAll();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "scenario-sectors") state.scenario.sectors = num(target.value);
  if (target.id === "scenario-ul") state.scenario.ulPerSector = num(target.value);
  if (target.id === "scenario-dl") state.scenario.dlPerSector = num(target.value);
  if (target.id === "required-ul") state.required.ulPerSector = num(target.value);
  if (target.id === "required-dl") state.required.dlPerSector = num(target.value);
  if (target.id === "sectors-per-site") state.required.sectorsPerSite = num(target.value);

  if (target.dataset.scenarioQuantity !== undefined) {
    state.scenario.rows[Number(target.dataset.index)].quantities[Number(target.dataset.scenarioQuantity)] = num(target.value);
  }
  if (target.dataset.scenarioDeviceField === "label") {
    state.scenario.deviceTypes[Number(target.dataset.index)].label = target.value;
    renderScenarioTable();
  }
  if (target.dataset.sectorField === "quantity") {
    state.required.rows[Number(target.dataset.index)].quantity = num(target.value);
  }
  if (target.dataset.deviceField) {
    const field = target.dataset.deviceField;
    state.devices[Number(target.dataset.index)][field] = target.type === "number" ? num(target.value) : target.value;
    saveState();
    recalc();
    return;
  }
  recalc();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.scenarioDeviceField === "deviceType") {
    const row = state.scenario.deviceTypes[Number(target.dataset.index)];
    row.deviceType = target.value;
    const first = firstDeviceForType(target.value);
    row.config = first ? configName(first) : "";
    renderScenarioDevices();
    renderScenarioTable();
  }
  if (target.dataset.scenarioDeviceField === "config") {
    state.scenario.deviceTypes[Number(target.dataset.index)].config = target.value;
  }
  if (target.dataset.sectorField === "deviceType") {
    const row = state.required.rows[Number(target.dataset.index)];
    row.deviceType = target.value;
    const first = firstDeviceForType(target.value);
    row.config = first ? configName(first) : "";
    renderRequiredTable();
  }
  if (target.dataset.sectorField === "config") {
    state.required.rows[Number(target.dataset.index)].config = target.value;
  }
  if (target.dataset.deviceField) {
    renderAll();
    return;
  }
  recalc();
});

["ul-chart", "dl-chart"].forEach((id) => {
  $(id).addEventListener("mousemove", showChartTooltip);
  $(id).addEventListener("mouseleave", () => {
    $("chart-tooltip").hidden = true;
  });
});

window.addEventListener("resize", () => recalc());

renderAll();
