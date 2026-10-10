// ---------- Data ----------
// ---------- Data ----------
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let currentType = "credit";

function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

// ---------- Elements ----------
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const listEl = document.getElementById("entryList");
const categoriesEl = document.getElementById("categories");

const modal = document.getElementById("modal");
const form = document.getElementById("entryForm");
const modalTitle = document.getElementById("modalTitle");
const saveBtn = document.getElementById("saveBtn");
const amountInput = document.getElementById("amountInput");
const accountInput = document.getElementById("accountInput");
const dateInput = document.getElementById("dateInput");
const noteInput = document.getElementById("noteInput");

// ---------- Helpers ----------
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function money(n) {
  return "₹ " + n.toLocaleString("en-IN");
}

function sum(list) {
  return list.reduce((total, e) => total + e.amount, 0);
}

// ---------- Popup ----------
function openModal(type) {
  currentType = type;
  modalTitle.textContent = type === "credit" ? "Add credit" : "Add debit";
  saveBtn.classList.toggle("is-debit", type === "debit");
  dateInput.value = todayStr();
  modal.hidden = false;
  amountInput.focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
}

document.getElementById("creditBtn").addEventListener("click", () => openModal("credit"));
document.getElementById("debitBtn").addEventListener("click", () => openModal("debit"));
document.getElementById("cancelBtn").addEventListener("click", closeModal);

// click on the dark area closes the popup
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ---------- Save entry ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  entries.push({
    id: Date.now(),
    type: currentType,
    amount: Number(amountInput.value),
    account: accountInput.value,
    date: dateInput.value,
    note: noteInput.value.trim(),
  });

  saveEntries();
  render();
  closeModal();
});

// ---------- Show everything ----------
function render() {
  // Total balance (calculated, never saved)
  const credits = entries.filter((e) => e.type === "credit");
  const debits = entries.filter((e) => e.type === "debit");
  balanceEl.textContent = money(sum(credits) - sum(debits));

  // This month's income and spending
  const month = todayStr().slice(0, 7); // "2026-10"
  const thisMonth = entries.filter((e) => e.date.startsWith(month));
  incomeEl.textContent = money(sum(thisMonth.filter((e) => e.type === "credit")));
  expenseEl.textContent = money(sum(thisMonth.filter((e) => e.type === "debit")));

  // Spending by category (this month's debits, grouped by account)
  const totals = {};
  thisMonth
    .filter((e) => e.type === "debit")
    .forEach((e) => {
      totals[e.account] = (totals[e.account] || 0) + e.amount;
    });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  categoriesEl.innerHTML = "";
  if (rows.length === 0) {
    categoriesEl.innerHTML = '<p class="empty">No spending this month yet.</p>';
  }
  rows.forEach(([name, total]) => {
    const row = document.createElement("div");
    row.className = "cat-row";

    const top = document.createElement("div");
    top.className = "cat-top";
    const label = document.createElement("span");
    label.textContent = name;
    const value = document.createElement("span");
    value.textContent = money(total);
    top.append(label, value);

    const track = document.createElement("div");
    track.className = "cat-track";
    const bar = document.createElement("div");
    bar.className = "cat-bar";
    bar.style.width = (total / max) * 100 + "%";
    track.append(bar);

    row.append(top, track);
    categoriesEl.append(row);
  });

  // Recent entries (latest 5, newest first)
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 5);

  listEl.innerHTML = "";
  if (recent.length === 0) {
    listEl.innerHTML = '<li class="empty">No entries yet. Tap + Credit or − Debit to add your first one.</li>';
  }
  recent.forEach((e) => {
    const li = document.createElement("li");
    li.className = "entry";

    const left = document.createElement("div");
    const title = document.createElement("p");
    title.className = "entry-title";
    title.textContent = e.note;
    const meta = document.createElement("p");
    meta.className = "entry-meta";
    meta.textContent = `${e.account} · ${e.date}`;
    left.append(title, meta);

    const amt = document.createElement("span");
    const isCredit = e.type === "credit";
    amt.className = isCredit ? "green" : "red";
    amt.textContent = (isCredit ? "+ " : "− ") + money(e.amount);

    li.append(left, amt);
    listEl.append(li);
  });
}

render();