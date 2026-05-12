// ================================
// LOAD DATA FROM LOCAL STORAGE
// ================================
let users = JSON.parse(localStorage.getItem("users")) || [];
let phases = JSON.parse(localStorage.getItem("phases")) || [];
let records = JSON.parse(localStorage.getItem("records")) || [];

// ================================
// GET ELEMENTS
// ================================
const owner = document.getElementById("owner");
const processPhase = document.getElementById("processPhase");
const description = document.getElementById("description");

const userList = document.getElementById("userList");
const phaseList = document.getElementById("phaseList");
const recordsTable = document.getElementById("recordsTable");

// ================================
// UPDATE DATALISTS
// ================================
function updateDataLists() {
  userList.innerHTML = users
    .map(u => `<option value="${u}"></option>`)
    .join("");

  phaseList.innerHTML = phases
    .map(p => `<option value="${p}"></option>`)
    .join("");
}

// ================================
// RENDER RECORDS TABLE
// ================================
function renderRecords() {
  recordsTable.innerHTML = "";

  records.forEach((r, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${r.owner}</td>
      <td>${r.phase}</td>
      <td>${r.description}</td>
      <td>${r.date}</td>
    `;

    recordsTable.appendChild(row);
  });
}

// ================================
// SAVE RECORD FUNCTION
// ================================
function saveRecord() {
  if (!owner.value || !processPhase.value) {
    alert("Owner and Phase are required");
    return;
  }

  // ✅ save unique users
  if (!users.includes(owner.value)) {
    users.push(owner.value);
    localStorage.setItem("users", JSON.stringify(users));
  }

  // ✅ save unique phases
  if (!phases.includes(processPhase.value)) {
    phases.push(processPhase.value);
    localStorage.setItem("phases", JSON.stringify(phases));
  }

  // ✅ save record
  const record = {
    owner: owner.value,
    phase: processPhase.value,
    description: description.value,
    date: new Date().toLocaleDateString()
  };

  records.push(record);
  localStorage.setItem("records", JSON.stringify(records));

  // ✅ refresh UI
  updateDataLists();
  renderRecords();

  // ✅ clear inputs
  owner.value = "";
  processPhase.value = "";
  description.value = "";
}

// ================================
// EXPORT TO CSV
// ================================
function exportCSV() {
  let csv = "Owner,Phase,Description,Date\n";

  records.forEach(r => {
    csv += `"${r.owner}","${r.phase}","${r.description}","${r.date}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "assurance_records.csv";
  a.click();

  URL.revokeObjectURL(url);
}

// ================================
// INITIAL LOAD
// ================================
updateDataLists();
renderRecords();
