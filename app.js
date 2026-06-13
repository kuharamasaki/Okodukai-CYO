const STORAGE_KEY = "okodukai-cyo-state-v1";

const children = ["SOSUKE", "EMMA"];
const categories = ["おやつ", "文房具", "本", "ゲーム", "おでかけ", "プレゼント", "貯金", "その他"];
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
  closingStatus: document.querySelector("#closingStatus"),
  templateSelect: document.querySelector("#templateSelect"),
  entryDate: document.querySelector("#entryDate"),
  entryType: document.querySelector("#entryType"),
  entryTitle: document.querySelector("#entryTitle"),
  entryAmount: document.querySelector("#entryAmount"),
  entryCategory: document.querySelector("#entryCategory"),
  entryForm: document.querySelector("#entryForm"),
  saveTemplateBtn: document.querySelector("#saveTemplateBtn"),
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

  els.entryCategory.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");

  if (!els.monthSelect.value) els.monthSelect.value = currentMonth();
  if (!els.entryDate.value) els.entryDate.value = todayIso();
}

function renderTemplates() {
  const options = childState().templates
    .map((template, index) => `<option value="${index}">${template.title} / ${yen(template.amount)}</option>`)
    .join("");
  els.templateSelect.innerHTML = `<option value="">選択しない</option>${options}`;
}

function renderThemes() {
  const selectedTheme = childState().theme;
  const theme = themes.find((item) => item.id === selectedTheme) || themes[0];
  document.body.style.setProperty("--app-bg", `url("${theme.file}")`);
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
  els.closingStatus.textContent = closing?.confirmed ? "一致済み" : "未確認";
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
  const rows = entriesForMonth(els.monthSelect.value)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (entry) => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.type === "income" ? "収入" : "支出"}</td>
          <td>${escapeHtml(entry.title)}</td>
          <td>${escapeHtml(entry.category)}</td>
          <td class="amount">${yen(entry.amount)}</td>
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
        const remaining = Math.max(wish.price - balance, 0);
        return `
          <div class="wish-item">
            <strong>${escapeHtml(wish.name)}</strong>
            <span>${yen(wish.price)} / あと ${yen(remaining)}</span>
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

function addEntry(event) {
  event.preventDefault();
  const title = els.entryTitle.value.trim();
  const type = els.entryType.value;
  const amount = Number(els.entryAmount.value);
  if (!title || amount <= 0) return;

  childState().entries.push({
    id: crypto.randomUUID(),
    date: els.entryDate.value,
    type,
    title,
    amount,
    category: els.entryCategory.value || inferCategory(title, type),
  });
  saveState();
  els.entryForm.reset();
  els.entryDate.value = todayIso();
  renderAll();
}

function saveTemplate() {
  const title = els.entryTitle.value.trim();
  const amount = Number(els.entryAmount.value);
  if (!title || amount <= 0) return;
  childState().templates.push({
    title,
    amount,
    type: els.entryType.value,
    category: els.entryCategory.value || inferCategory(title, els.entryType.value),
  });
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
els.entryType.addEventListener("change", () => {
  els.entryCategory.value = inferCategory(els.entryTitle.value, els.entryType.value);
});
els.entryTitle.addEventListener("input", () => {
  els.entryCategory.value = inferCategory(els.entryTitle.value, els.entryType.value);
});
els.templateSelect.addEventListener("change", () => {
  const template = childState().templates[Number(els.templateSelect.value)];
  if (!template) return;
  els.entryType.value = template.type;
  els.entryTitle.value = template.title;
  els.entryAmount.value = template.amount;
  els.entryCategory.value = template.category;
});
els.entryForm.addEventListener("submit", addEntry);
els.saveTemplateBtn.addEventListener("click", saveTemplate);
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
