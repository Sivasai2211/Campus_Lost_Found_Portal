// Frontend: get, display, add and update items
const form = document.getElementById("itemForm");
const list = document.getElementById("items");
const search = document.getElementById("search");
let allItems = [];
let filter = "All";

async function loadItems() {
  const res = await fetch("/api/items");
  allItems = await res.json();
  showItems();
}

function showItems() {
  const word = search.value.toLowerCase();
  const items = allItems.filter(item =>
    (filter === "All" || item.type === filter) &&
    (item.title + item.description + item.location).toLowerCase().includes(word)
  );
  document.getElementById("total").textContent = allItems.length;
  document.getElementById("open").textContent = allItems.filter(x => x.status === "Open").length;
  document.getElementById("returned").textContent = allItems.filter(x => x.status === "Returned").length;

  list.innerHTML = items.length ? items.map(item => `
    <article class="item-card">
      <div class="item-top"><span class="tag ${item.type.toLowerCase()}">${item.type}</span>
      <span class="status">${item.status}</span></div>
      <h3>${escapeText(item.title)}</h3>
      <p>${escapeText(item.description)}</p>
      <div class="details">📍 ${escapeText(item.location)} &nbsp; · &nbsp; ${escapeText(item.date)}</div>
      <div class="details">Contact: ${escapeText(item.contact)}</div>
      ${item.status === "Open" ? `<button class="return-btn" onclick="markReturned(${item.id})">Mark as returned</button>` : ""}
    </article>`).join("") : '<p class="empty">No reports found. Try another search or add an item.</p>';
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = {
    title: document.getElementById("title").value,
    type: document.getElementById("type").value,
    description: document.getElementById("description").value,
    location: document.getElementById("location").value,
    contact: document.getElementById("contact").value
  };
  const res = await fetch("/api/items", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  document.getElementById("message").textContent = res.ok ? "Report submitted successfully!" : result.message;
  if (res.ok) { form.reset(); loadItems(); }
});

async function markReturned(id) {
  await fetch("/api/items/" + id, { method: "PATCH" });
  loadItems();
}
search.addEventListener("input", showItems);
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
    button.classList.add("active");
    showItems();
  });
});
loadItems();
