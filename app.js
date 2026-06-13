const STORAGE_KEY = "okodukai-cyo-state-v1";

const children = ["SOSUKE", "EMMA"];
const categories = ["おやつ", "文房具", "本", "ゲーム", "おでかけ", "プレゼント", "貯金", "雑貨", "その他"];
const themes = [
  { id: "cute", name: "Cute", file: "okodukai-backpic-cute.png" },
  { id: "cool", name: "Cool", file: "okodukai-backpic-cool.png" },
];

const els = {
  childSelect: document.querySelector("#childSelect"),
  monthSelect: document.querySelector("#monthSelect"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  ledgerEntryForm: document.querySelector("#ledgerEntryForm"),
  walletBalance: document.querySelector("#walletBalance"),
  confirmClosingBtn: document.querySelector("#confirmClosingBtn"),
  closingMessage: document.querySelector("#closingMessage"),
  themeChoices: document.querySelector("#themeChoices"),
  wishForm: document.querySelector("#wishForm"),
  wishName: document.querySelector("#wishName"),
  wishPrice: document.querySelector("#wishPrice"),
  wishNeedTotal: document.querySelector("#wishNeedTotal"),
  wishList: document.querySelector("#wishList"),
  categoryChart: document.querySelector("#categoryChart"),
  entryRows: document.querySelector("#entryRows"),
  templateList: document.querySelector("#templateList"),
  exportBtn: document.querySelector("#exportBtn"),
};

let activeChild = children[0];
let activePeriod = "month";
let state = loadState();

function defaultChild() {
  return {
    theme: "cute",
    entries: [],
    templates: [],
    wishes: [],
    closings: {},
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : {};
  const data = { children: {} };
  children.forEach((child) => {
    data.children[child] = { ...defaultChild(), ...(parsed.children?.[child] || {}) };
  });
  return data;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function childState() {
  return state.children[activeChild];
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return todayIso().slice(0, 7);
}

function getMonthKey(date) {
  return date.slice(0, 7);
}

function inferCategory(title, type) {
  if (type === "income") return "貯金";
  const text = title.toLowerCase();
  const rules = [
    ["おやつ", ["おかし", "お菓子", "ジュース", "アイス", "チョコ", "ガム"]],
    ["文房具", ["えんぴつ", "ノート", "消しゴム", "ペン", "文房具"]],
    ["本", ["本", "漫画", "まんが", "図鑑"]],
    ["ゲーム", ["ゲーム", "カード", "アプリ"]],
    ["おでかけ", ["電車", "バス", "映画", "公園", "おでかけ"]],
    ["プレゼント", ["プレゼント", "誕生日", "ギフト"]],
    ["雑貨", ["雑貨", "シール", "キーホルダー", "アクセサリー", "小物"]],
  ];
  return rules.find(([, words]) => words.some((word) => text.includes(word)))?.[0] || "その他";
}

function entriesForMonth(month) {
  return childState().entries.filter((entry) => getMonthKey(entry.date) === month);
}

function entriesForPeriod() {
  const selected = new Date(`${els.monthSelect.value}-01T00:00:00`);
  const months = activePeriod === "year" ? 12 : activePeriod === "half" ? 6 : 1;
  const start = new Date(selected);
  start.setMonth(start.getMonth() - months + 1);
  return childState().entries.filter((entry) => {
    const entryDate = new Date(`${entry.date}T00:00:00`);
    return entryDate >= start && entryDate <= new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
  });
}

function monthBalance(month) {
  return entriesForMonth(month).reduce((sum, entry) => {
    return sum + (entry.type === "income" ? entry.amount : -entry.amount);
  }, 0);
}

function renderSelectors() {
  els.childSelect.innerHTML = children.map((child) => `<option value="${child}">${child}</option>`).join("");
  els.childSelect.value = activeChild;

  if (!els.monthSelect.value) els.monthSelect.value = currentMonth();
  const date = els.ledgerEntryForm.querySelector('[data-field="date"]');
  const category = els.ledgerEntryForm.querySelector('[data-field="category"]');
  if (date && !date.value) date.value = todayIso();
  if (category) {
    category.innerHTML = `<option value="">用途</option>${categories.map((item) => `<option value="${item}">${item}</option>`).join("")}`;
  }
}

function renderTemplates() {
  const templateSelect = els.ledgerEntryForm.querySelector('[data-field="template"]');
  const seen = new Set();
  const templates = childState().templates
    .map((template, index) => ({ template, index }))
    .filter(({ template }) => {
      const title = template.title?.trim();
      if (!title || seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  const options = templates
    .map(({ template, index }) => `<option value="${index}">${escapeHtml(template.title)}</option>`)
    .join("");
  templateSelect.innerHTML = `<option value="">登録済み</option>${options}`;
  els.templateList.innerHTML =
    templates
      .map(
        ({ template, index }) => `
          <span class="template-chip">
            <span>${escapeHtml(template.title)}</span>
            <button type="button" data-delete-template="${index}" aria-label="${escapeHtml(template.title)}を削除">×</button>
          </span>
        `,
      )
      .join("") || `<p class="message">登録済みの内容はまだありません。</p>`;
}

function renderThemes() {
  const selectedTheme = childState().theme;
  const theme = themes.find((item) => item.id === selectedTheme) || themes[0];
  document.body.style.setProperty("--app-bg", `url("${theme.file}")`);
  document.body.style.setProperty("--app-bg-size", theme.id === "cool" ? "760px auto" : "700px auto");
  document.body.classList.toggle("theme-cool", theme.id === "cool");
  els.themeChoices.innerHTML = themes
    .map(
      (item) => `
        <button class="theme-choice ${item.id === selectedTheme ? "active" : ""}" type="button" data-theme="${item.id}" style="background-image: url('${item.file}')">
          <span>${item.name}</span>
        </button>
      `,
    )
    .join("");
}

function renderSummary() {
  const entries = entriesForMonth(els.monthSelect.value);
  const income = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const balance = income - expense;
  const closing = childState().closings[els.monthSelect.value];

  els.incomeTotal.textContent = yen(income);
  els.expenseTotal.textContent = yen(expense);
  els.balanceTotal.textContent = yen(balance);
  els.walletBalance.value = closing?.walletBalance ?? "";
  if (closing?.confirmed) {
    els.closingMessage.textContent = "翌月のお小遣いをもらえる状態です。";
    els.closingMessage.className = "message ok";
  } else if (closing) {
    els.closingMessage.textContent = `一致していません。差額は ${yen(closing.walletBalance - closing.systemBalance)} です。`;
    els.closingMessage.className = "message bad";
  } else {
    els.closingMessage.textContent = "";
    els.closingMessage.className = "message";
  }
}

function renderEntries() {
  const entries = entriesForMonth(els.monthSelect.value).sort((a, b) => b.date.localeCompare(a.date));
  const rows = entries
    .map(
      (entry) => `
        <tr class="${entry.type === "income" ? "entry-income" : "entry-expense"}">
          <td>${entry.date}</td>
          <td><span class="type-pill ${entry.type}">${entry.type === "income" ? "収入" : "支出"}</span></td>
          <td>${escapeHtml(entry.title)}</td>
          <td>${entry.type === "expense" ? escapeHtml(entry.category || "その他") : ""}</td>
          <td class="amount ${entry.type}">${entry.type === "income" ? "+" : "-"}${yen(entry.amount)}</td>
          <td><button class="delete-btn" type="button" data-delete-entry="${entry.id}" aria-label="削除">×</button></td>
        </tr>
      `,
    )
    .join("");
  els.entryRows.innerHTML = rows || `<tr><td colspan="6">この月の記録はまだありません。</td></tr>`;
}

function renderWishes() {
  const balance = monthBalance(els.monthSelect.value);
  const wishes = childState().wishes;
  const need = wishes.reduce((sum, wish) => sum + Math.max(wish.price - balance, 0), 0);
  els.wishNeedTotal.textContent = `あと ${yen(need)}`;
  els.wishList.innerHTML =
    wishes
      .map((wish) => {
        return `
          <div class="wish-item">
            <strong>${escapeHtml(wish.name)}</strong>
            <span>${yen(wish.price)}</span>
            <button class="delete-btn" type="button" data-delete-wish="${wish.id}" aria-label="削除">×</button>
          </div>
        `;
      })
      .join("") || `<p class="message">ほしいものを追加できます。</p>`;
}

function renderChart() {
  const canvas = els.categoryChart;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const totals = categories.reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
  entriesForPeriod()
    .filter((entry) => entry.type === "expense")
    .forEach((entry) => {
      totals[entry.category] = (totals[entry.category] || 0) + entry.amount;
    });

  const data = Object.entries(totals).filter(([, value]) => value > 0);
  if (!data.length) {
    ctx.fillStyle = "#64748b";
    ctx.font = "18px Segoe UI";
    ctx.fillText("支出データがありません。", 24, 52);
    return;
  }

  const max = Math.max(...data.map(([, value]) => value));
  const barHeight = Math.min(28, (height - 46) / data.length - 8);
  const colors = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#be123c", "#047857", "#a16207", "#475569"];

  ctx.font = "14px Segoe UI";
  data.forEach(([category, value], index) => {
    const y = 30 + index * (barHeight + 12);
    const barWidth = Math.max(10, (value / max) * (width - 220));
    ctx.fillStyle = "#334155";
    ctx.fillText(category, 18, y + barHeight - 7);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(110, y, barWidth, barHeight);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(yen(value), 122 + barWidth, y + barHeight - 7);
  });
}

function renderAll() {
  renderSelectors();
  renderTemplates();
  renderThemes();
  renderSummary();
  renderEntries();
  renderWishes();
  renderChart();
}

function formValue(form, field) {
  return form.querySelector(`[data-field="${field}"]`)?.value || "";
}

function setFormValue(form, field, value) {
  const input = form.querySelector(`[data-field="${field}"]`);
  if (input) input.value = value;
}

function addEntry(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const type = formValue(form, "type");
  const title = formValue(form, "title").trim();
  const amount = Number(formValue(form, "amount").replace(/[^\d]/g, ""));
  if (!title || amount <= 0) return;

  childState().entries.push({
    id: crypto.randomUUID(),
    date: formValue(form, "date"),
    type,
    title,
    amount,
    category: formValue(form, "category") || inferCategory(title, type),
  });
  saveState();
  setFormValue(form, "title", "");
  setFormValue(form, "amount", "");
  setFormValue(form, "template", "");
  setFormValue(form, "category", "");
  setFormValue(form, "date", todayIso());
  renderAll();
}

function saveTemplate(form) {
  const title = formValue(form, "title").trim();
  if (!title) return;
  const exists = childState().templates.some((template) => template.title === title);
  if (!exists) childState().templates.push({ title });
  saveState();
  renderTemplates();
}

function confirmClosing() {
  const walletBalance = Number(els.walletBalance.value);
  const systemBalance = monthBalance(els.monthSelect.value);
  const confirmed = walletBalance === systemBalance;
  childState().closings[els.monthSelect.value] = {
    walletBalance,
    systemBalance,
    confirmed,
    checkedAt: new Date().toISOString(),
  };
  saveState();
  els.closingMessage.textContent = confirmed
    ? "一致しました。翌月のお小遣いをもらえる状態です。"
    : `一致していません。差額は ${yen(walletBalance - systemBalance)} です。`;
  els.closingMessage.className = `message ${confirmed ? "ok" : "bad"}`;
  renderSummary();
}

function addWish(event) {
  event.preventDefault();
  const name = els.wishName.value.trim();
  const price = Number(els.wishPrice.value);
  if (!name || price <= 0) return;
  childState().wishes.push({ id: crypto.randomUUID(), name, price });
  saveState();
  els.wishForm.reset();
  renderWishes();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `okodukai-cyo-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

els.childSelect.addEventListener("change", () => {
  activeChild = els.childSelect.value;
  renderAll();
});

els.monthSelect.addEventListener("change", renderAll);
els.ledgerEntryForm.addEventListener("submit", addEntry);
els.ledgerEntryForm.querySelector('[data-field="title"]').addEventListener("input", () => {
  const type = formValue(els.ledgerEntryForm, "type");
  if (type === "expense") setFormValue(els.ledgerEntryForm, "category", inferCategory(formValue(els.ledgerEntryForm, "title"), type));
});
els.ledgerEntryForm.querySelector('[data-field="type"]').addEventListener("change", () => {
  const type = formValue(els.ledgerEntryForm, "type");
  const title = formValue(els.ledgerEntryForm, "title");
  setFormValue(els.ledgerEntryForm, "category", type === "expense" && title ? inferCategory(title, type) : "");
});
els.ledgerEntryForm.querySelector('[data-field="template"]').addEventListener("change", () => {
  const selectedTemplate = formValue(els.ledgerEntryForm, "template");
  if (!selectedTemplate) return;
  const template = childState().templates[Number(selectedTemplate)];
  if (!template) return;
  setFormValue(els.ledgerEntryForm, "title", template.title);
  const type = formValue(els.ledgerEntryForm, "type");
  setFormValue(els.ledgerEntryForm, "category", type === "expense" ? inferCategory(template.title, type) : "");
});
els.ledgerEntryForm.querySelector(".save-row-template").addEventListener("click", () => saveTemplate(els.ledgerEntryForm));
els.confirmClosingBtn.addEventListener("click", confirmClosing);
els.wishForm.addEventListener("submit", addWish);
els.exportBtn.addEventListener("click", exportData);

document.addEventListener("click", (event) => {
  const themeId = event.target.closest("[data-theme]")?.dataset.theme;
  if (themeId) {
    childState().theme = themeId;
    saveState();
    renderThemes();
  }

  const entryId = event.target.closest("[data-delete-entry]")?.dataset.deleteEntry;
  if (entryId) {
    state.children[activeChild].entries = childState().entries.filter((entry) => entry.id !== entryId);
    saveState();
    renderAll();
  }

  const wishId = event.target.closest("[data-delete-wish]")?.dataset.deleteWish;
  if (wishId) {
    state.children[activeChild].wishes = childState().wishes.filter((wish) => wish.id !== wishId);
    saveState();
    renderWishes();
  }

  const templateIndex = event.target.closest("[data-delete-template]")?.dataset.deleteTemplate;
  if (templateIndex) {
    childState().templates.splice(Number(templateIndex), 1);
    saveState();
    renderTemplates();
    setFormValue(els.ledgerEntryForm, "template", "");
  }

  const period = event.target.closest("[data-period]")?.dataset.period;
  if (period) {
    activePeriod = period;
    document.querySelectorAll(".period-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.period === period);
    });
    renderChart();
  }
});

renderAll();
