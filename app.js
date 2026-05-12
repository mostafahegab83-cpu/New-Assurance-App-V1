/* Compliance & Risk Tracker
   Vanilla JS · LocalStorage · Chart.js · CSV import/export */
(function () {
  "use strict";

  const STORAGE_KEY = "compliance_tracker_v2";
  const NA = "N/A";

  // Field schema: id (DOM/storage key), label (CSV header), type
  const FIELDS = [
    { id: "userName",       label: "User Name",            kind: "text" },
    { id: "processName",    label: "Process Name",         kind: "text" },
    { id: "processPhase",   label: "Process Phase",        kind: "text" },
    { id: "dayWeek",        label: "Day/Week",             kind: "raw"  },
    { id: "controlItem",    label: "Control / Checklist",  kind: "raw"  },
    { id: "department",     label: "Department",           kind: "text" },
    { id: "subDepartment",  label: "Sub-Department",       kind: "text" },
    { id: "owner",          label: "Owner",                kind: "text" },
    { id: "evidence",       label: "Required Evidence",    kind: "raw"  },
    { id: "targetSla",      label: "Target SLA",           kind: "raw"  },
    { id: "actualSla",      label: "Actual SLA",           kind: "raw"  },
    { id: "compliance",     label: "Compliance Status",    kind: "raw"  },
    { id: "ncDescription",  label: "NC Description",       kind: "raw"  },
    { id: "riskExist",      label: "Risk Exist",           kind: "raw"  },
    { id: "riskType",       label: "Risk Type",            kind: "raw"  },
    { id: "riskLevel",      label: "Risk Level",           kind: "raw"  },
    { id: "mitigation",     label: "Mitigation Status",    kind: "raw"  },
    { id: "findings",       label: "Findings / Gaps",      kind: "raw"  },
    { id: "capaNeeded",     label: "CAPA Needed",          kind: "raw"  },
    { id: "capaType",       label: "CAPA Type",            kind: "raw"  },
    { id: "capaDue",        label: "CAPA Due Date",        kind: "raw"  },
    { id: "effectiveness",  label: "Effectiveness",        kind: "raw"  },
    { id: "comments",       label: "Comments",             kind: "raw"  },
  ];

  let records = load();
  const charts = {};

  /* ---------- Storage ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

  /* ---------- Helpers ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const titleCase = s => s.toLowerCase().replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, c => c.toUpperCase());

  function normalize(value, kind) {
    if (value == null) return NA;
    const v = String(value).trim();
    if (!v) return NA;
    if (kind === "text") return titleCase(v);
    return v.replace(/\s+/g, " ");
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  function badgeClass(field, value) {
    const v = String(value);
    if (field === "compliance") {
      if (v === "Compliant") return "green";
      if (v === "Non-Compliant") return "red";
      if (v === "Partially Compliant") return "amber";
    }
    if (field === "riskLevel") {
      if (v === "Low") return "green";
      if (v === "Medium") return "amber";
      if (v === "High") return "red";
    }
    if (field === "riskExist" || field === "capaNeeded") {
      if (v === "Yes") return "red";
      if (v === "No")  return "green";
    }
    if (field === "mitigation") {
      if (v === "Closed" || v === "Mitigated") return "green";
      if (v === "Open") return "red";
      if (v === "Accepted") return "amber";
    }
    if (field === "effectiveness") {
      if (v === "Effective") return "green";
      if (v === "Partially Effective") return "amber";
      if (v === "Ineffective") return "red";
    }
    return "gray";
  }

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "dashboard") renderDashboard();
      if (tab.dataset.tab === "records") renderRecords();
    });
  });

  /* ---------- Datalists ---------- */
  function fillDataList(id, values) {
    const dl = document.getElementById(id);
    dl.innerHTML = [...new Set(values.filter(v => v && v !== NA))]
      .sort().map(v => `<option value="${v.replace(/"/g,'&quot;')}">`).join("");
  }
  function updateDataLists() {
    fillDataList("dlUser",          records.map(r => r.userName));
    fillDataList("dlProcess",       records.map(r => r.processName));
    fillDataList("dlPhase",         records.map(r => r.processPhase));
    fillDataList("dlDepartment",    records.map(r => r.department));
    fillDataList("dlSubDepartment", records.map(r => r.subDepartment));
    fillDataList("dlOwner",         records.map(r => r.owner));

    const sel = document.getElementById("filterDepartment");
    const cur = sel.value;
    const deps = [...new Set(records.map(r => r.department).filter(v => v && v !== NA))].sort();
    sel.innerHTML = `<option value="">All Departments</option>` +
      deps.map(v => `<option>${v}</option>`).join("");
    sel.value = cur;
  }

  /* ---------- Form ---------- */
  const form = document.getElementById("recordForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("recordId").value || uid();
    const rec = { id };
    FIELDS.forEach(f => {
      const el = document.getElementById(f.id);
      rec[f.id] = normalize(el ? el.value : "", f.kind);
    });
    const idx = records.findIndex(r => r.id === id);
    if (idx >= 0) records[idx] = rec; else records.push(rec);
    save();
    updateDataLists();
    form.reset();
    document.getElementById("recordId").value = "";
    toast(idx >= 0 ? "Record updated" : "Record saved");
    document.querySelector('[data-tab="records"]').click();
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    form.reset();
    document.getElementById("recordId").value = "";
  });

  function editRecord(id) {
    const r = records.find(x => x.id === id);
    if (!r) return;
    document.getElementById("recordId").value = r.id;
    FIELDS.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      el.value = r[f.id] === NA ? "" : (r[f.id] ?? "");
    });
    document.querySelector('[data-tab="form"]').click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecord(id) {
    if (!confirm("Delete this record?")) return;
    records = records.filter(r => r.id !== id);
    save();
    renderRecords();
    updateDataLists();
    toast("Record deleted");
  }

  /* ---------- Records table ---------- */
  const escHtml = s => String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  function renderRecords() {
    const tbody = document.querySelector("#recordsTable tbody");
    document.getElementById("recordsCount").textContent = `${records.length} record(s)`;
    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="24" style="text-align:center;color:var(--muted);padding:24px">No records yet. Use the “Add / Edit” tab to create one.</td></tr>`;
      return;
    }
    const badge = (f, v) => `<span class="badge ${badgeClass(f, v)}">${escHtml(v)}</span>`;
    const evidenceCell = v => (v && v !== NA && /^https?:\/\//i.test(v))
      ? `<a href="${escHtml(v)}" target="_blank" rel="noopener">link</a>` : escHtml(v);

    tbody.innerHTML = records.map(r => `
      <tr>
        <td>${escHtml(r.userName)}</td>
        <td>${escHtml(r.processName)}</td>
        <td>${escHtml(r.processPhase)}</td>
        <td>${escHtml(r.dayWeek)}</td>
        <td class="wrap">${escHtml(r.controlItem)}</td>
        <td>${escHtml(r.department)}</td>
        <td>${escHtml(r.subDepartment)}</td>
        <td>${escHtml(r.owner)}</td>
        <td>${evidenceCell(r.evidence)}</td>
        <td>${escHtml(r.targetSla)}</td>
        <td>${escHtml(r.actualSla)}</td>
        <td>${badge("compliance", r.compliance)}</td>
        <td class="wrap">${escHtml(r.ncDescription)}</td>
        <td>${badge("riskExist", r.riskExist)}</td>
        <td>${escHtml(r.riskType)}</td>
        <td>${badge("riskLevel", r.riskLevel)}</td>
        <td>${badge("mitigation", r.mitigation)}</td>
        <td class="wrap">${escHtml(r.findings)}</td>
        <td>${badge("capaNeeded", r.capaNeeded)}</td>
        <td>${escHtml(r.capaType)}</td>
        <td>${escHtml(r.capaDue)}</td>
        <td>${badge("effectiveness", r.effectiveness)}</td>
        <td class="wrap">${escHtml(r.comments)}</td>
        <td>
          <button class="btn sm" data-edit="${r.id}">Edit</button>
          <button class="btn sm danger" data-del="${r.id}">Del</button>
        </td>
      </tr>`).join("");

    tbody.querySelectorAll("[data-edit]").forEach(b =>
      b.addEventListener("click", () => editRecord(b.dataset.edit)));
    tbody.querySelectorAll("[data-del]").forEach(b =>
      b.addEventListener("click", () => deleteRecord(b.dataset.del)));
  }

  /* ---------- Filters & Dashboard ---------- */
  function getFiltered() {
    const q   = document.getElementById("filterSearch").value.toLowerCase().trim();
    const dep = document.getElementById("filterDepartment").value;
    const com = document.getElementById("filterCompliance").value;
    const rl  = document.getElementById("filterRiskLevel").value;
    const mit = document.getElementById("filterMitigation").value;
    return records.filter(r => {
      if (dep && r.department !== dep) return false;
      if (com && r.compliance !== com) return false;
      if (rl  && r.riskLevel  !== rl)  return false;
      if (mit && r.mitigation !== mit) return false;
      if (q && !Object.values(r).some(v => String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }

  ["filterSearch","filterDepartment","filterCompliance","filterRiskLevel","filterMitigation"]
    .forEach(id => document.getElementById(id).addEventListener("input", renderDashboard));

  document.getElementById("clearFilters").addEventListener("click", () => {
    ["filterSearch","filterDepartment","filterCompliance","filterRiskLevel","filterMitigation"]
      .forEach(id => document.getElementById(id).value = "");
    renderDashboard();
  });

  function counts(arr, field) {
    return arr.reduce((acc, r) => {
      const k = r[field] || NA;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  function renderDashboard() {
    const data = getFiltered();
    document.getElementById("kpiTotal").textContent        = data.length;
    document.getElementById("kpiCapaNeeded").textContent   = data.filter(r => r.capaNeeded === "Yes").length;
    document.getElementById("kpiRiskExists").textContent   = data.filter(r => r.riskExist === "Yes").length;
    document.getElementById("kpiNonCompliant").textContent = data.filter(r => r.compliance === "Non-Compliant").length;

    drawBar("chartRiskType", counts(data, "riskType"));
    drawDoughnut("chartMitigation", counts(data, "mitigation"));
    drawCapaGauge("chartCapa", data);
    drawDoughnut("chartEffectiveness", counts(data, "effectiveness"));
  }

  const palette = ["#2563eb","#f97316","#16a34a","#06b6d4","#7c3aed","#db2777","#d97706","#6b7280"];

  function drawBar(id, obj) {
    const ctx = document.getElementById(id);
    const labels = Object.keys(obj);
    const values = Object.values(obj);
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data: values, backgroundColor: palette }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  function drawDoughnut(id, obj) {
    const ctx = document.getElementById(id);
    const labels = Object.keys(obj);
    const values = Object.values(obj);
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: "doughnut",
      data: { labels, datasets: [{ data: values, backgroundColor: palette }] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } } }
    });
  }

  function drawCapaGauge(id, data) {
    // Completion = (Mitigated + Closed) / records where CAPA Needed = Yes
    const needed = data.filter(r => r.capaNeeded === "Yes");
    const done   = needed.filter(r => r.mitigation === "Closed" || r.mitigation === "Mitigated").length;
    const pct    = needed.length ? Math.round((done / needed.length) * 100) : 0;
    document.getElementById("capaPctLabel").textContent = `${pct}%`;
    const ctx = document.getElementById(id);
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: "doughnut",
      data: { labels: ["Completed", "Remaining"],
        datasets: [{ data: [pct, 100 - pct],
          backgroundColor: ["#16a34a","#e5e7eb"], borderWidth: 0 }] },
      options: { circumference: 180, rotation: 270, cutout: "70%",
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } } }
    });
  }

  /* ---------- CSV ---------- */
  function csvEscape(v) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function exportCSV() {
    const data = getFiltered().length && (
      document.getElementById("filterSearch").value ||
      document.getElementById("filterDepartment").value ||
      document.getElementById("filterCompliance").value ||
      document.getElementById("filterRiskLevel").value ||
      document.getElementById("filterMitigation").value)
      ? getFiltered() : records;

    if (!data.length) return toast("No records to export");
    const header = ["id", ...FIELDS.map(f => f.label)];
    const lines = [header.join(",")];
    data.forEach(r => {
      lines.push([csvEscape(r.id), ...FIELDS.map(f => csvEscape(r[f.id]))].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-records-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${data.length} record(s)`);
  }
  function parseCSV(text) {
    const rows = []; let cur = [], val = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i+1] === '"') { val += '"'; i++; }
        else if (c === '"') inQ = false;
        else val += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { cur.push(val); val = ""; }
        else if (c === "\n" || c === "\r") {
          if (val !== "" || cur.length) { cur.push(val); rows.push(cur); cur = []; val = ""; }
          if (c === "\r" && text[i+1] === "\n") i++;
        } else val += c;
      }
    }
    if (val !== "" || cur.length) { cur.push(val); rows.push(cur); }
    return rows;
  }
  function importCSV(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) return toast("CSV is empty");
      const header = rows[0].map(h => h.trim());
      const labelToField = Object.fromEntries(FIELDS.map(f => [f.label.toLowerCase(), f]));
      let added = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.length || row.every(v => !v)) continue;
        const obj = {};
        header.forEach((h, idx) => obj[h] = row[idx] ?? "");
        const rec = { id: obj.id || obj.ID || uid() };
        FIELDS.forEach(f => {
          // Try by label first, fall back to id
          const matchKey = Object.keys(obj).find(k => k.toLowerCase() === f.label.toLowerCase()) || f.id;
          rec[f.id] = normalize(obj[matchKey], f.kind);
        });
        const idx = records.findIndex(r => r.id === rec.id);
        if (idx >= 0) records[idx] = rec; else records.push(rec);
        added++;
      }
      save();
      updateDataLists();
      renderRecords();
      renderDashboard();
      toast(`Imported ${added} record(s)`);
    };
    reader.readAsText(file);
  }

  document.getElementById("btnExport").addEventListener("click", exportCSV);
  document.getElementById("fileImport").addEventListener("change", e => {
    if (e.target.files[0]) importCSV(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btnClearAll").addEventListener("click", () => {
    if (!records.length) return;
    if (!confirm("Delete ALL records? This cannot be undone.")) return;
    records = [];
    save();
    updateDataLists();
    renderRecords();
    renderDashboard();
    toast("All records cleared");
  });

  /* ---------- Init ---------- */
  updateDataLists();
  renderDashboard();
  renderRecords();
})();