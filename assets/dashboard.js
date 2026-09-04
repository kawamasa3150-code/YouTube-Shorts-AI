const stateKey = "shorts-research-decisions-v1";
let candidates = [];
let currentFilter = "all";

const icons = { animal: "◉", body: "✦", science: "⌁", what_if: "?", other: "◆" };
const colors = { animal: "#c8ded2", body: "#efc4af", science: "#cad7e8", what_if: "#e5dcaf", other: "#d8d0df" };

function savedDecisions() {
  try { return JSON.parse(localStorage.getItem(stateKey)) || {}; }
  catch { return {}; }
}

function setDecision(id, value) {
  const decisions = savedDecisions();
  decisions[id] = value;
  localStorage.setItem(stateKey, JSON.stringify(decisions));
  render();
}

function cardTemplate(item, index, decision) {
  const ideas = item.japanese_ideas.map(idea => `<li>${escapeHtml(idea)}</li>`).join("");
  return `
    <article class="card" style="--card-color:${colors[item.category] || colors.other}; animation-delay:${index * 55}ms">
      <div class="visual">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="category-mark" aria-hidden="true">${icons[item.category] || icons.other}</span>
      </div>
      <div class="card-body">
        <div class="meta"><span>${escapeHtml(item.category_label)} · ${formatViews(item.views)}回</span>${item.demo ? '<span class="demo-label">DEMO</span>' : ""}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="channel">${escapeHtml(item.channel)} · ${escapeHtml(item.published_label)}</p>
        <div class="score-line"><span>おすすめ</span><span class="meter"><i style="width:${item.score}%"></i></span><strong>${item.score}</strong></div>
        <p class="reason">${escapeHtml(item.reason)}</p>
        <div class="ideas"><b>日本向け派生案</b><ul>${ideas}</ul></div>
        <a class="watch" href="${item.url}" target="_blank" rel="noopener noreferrer">YouTubeで確認する ↗</a>
      </div>
      <div class="decisions" aria-label="候補の判定">
        <button class="decision ${decision === "selected" ? "selected" : ""}" data-id="${item.video_id}" data-decision="selected">採用候補</button>
        <button class="decision ${decision === "hold" ? "hold" : ""}" data-id="${item.video_id}" data-decision="hold">保留</button>
        <button class="decision ${decision === "rejected" ? "rejected" : ""}" data-id="${item.video_id}" data-decision="rejected">見送り</button>
      </div>
    </article>`;
}

function render() {
  const decisions = savedDecisions();
  const visible = candidates.filter(item => {
    const value = decisions[item.video_id] || "unreviewed";
    return currentFilter === "all" || value === currentFilter;
  });
  document.querySelector("#cards").innerHTML = visible.map((item, i) => cardTemplate(item, i, decisions[item.video_id] || "unreviewed")).join("");
  document.querySelector("#empty").hidden = visible.length > 0;
  document.querySelector("#new-count").textContent = candidates.length;
  document.querySelector("#top-score").textContent = candidates.length ? Math.max(...candidates.map(item => item.score)) : "—";
  document.querySelector("#selected-count").textContent = candidates.filter(item => decisions[item.video_id] === "selected").length;
  document.querySelectorAll(".decision").forEach(button => button.addEventListener("click", () => setDecision(button.dataset.id, button.dataset.decision)));
}

function formatViews(value) {
  if (value >= 10000) return `${Math.round(value / 10000)}万`;
  return new Intl.NumberFormat("ja-JP").format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

async function init() {
  try {
    const response = await fetch("data/dashboard.json", { cache: "no-store" });
    if (!response.ok) throw new Error("候補データを読み込めませんでした");
    const data = await response.json();
    candidates = data.candidates;
    document.querySelector("#updated-at").textContent = data.updated_at_label;
    document.querySelector("#issue-number").textContent = data.issue;
    render();
  } catch (error) {
    document.querySelector("#cards").innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  currentFilter = button.dataset.filter;
  render();
}));

init();
