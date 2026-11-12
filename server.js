// CAMPUS LOST & FOUND PORTAL - Simple Node.js backend
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA = path.join(__dirname, "data", "items.json");
const PUBLIC = path.join(__dirname, "public");

function readItems() {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch { return []; }
}
function saveItems(items) {
  fs.writeFileSync(DATA, JSON.stringify(items, null, 2));
}
function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

const server = http.createServer((req, res) => {
  // Get all lost/found items
  if (req.method === "GET" && req.url.startsWith("/api/items")) {
    return send(res, 200, readItems());
  }

  // Add a new item
  if (req.method === "POST" && req.url === "/api/items") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (!data.title || !data.description || !data.location)
          return send(res, 400, { message: "Please fill all fields" });
        const items = readItems();
        const item = {
          id: Date.now(),
          title: data.title,
          type: data.type || "Lost",
          description: data.description,
          location: data.location,
          contact: data.contact || "Not provided",
          date: new Date().toLocaleDateString(),
          status: "Open"
        };
        items.unshift(item);
        saveItems(items);
        return send(res, 201, item);
      } catch {
        return send(res, 400, { message: "Invalid data" });
      }
    });
    return;
  }

  // Mark an item as returned
  if (req.method === "PATCH" && req.url.startsWith("/api/items/")) {
    const id = Number(req.url.split("/").pop());
    const items = readItems();
    const item = items.find(x => x.id === id);
    if (!item) return send(res, 404, { message: "Item not found" });
    item.status = "Returned";
    saveItems(items);
    return send(res, 200, item);
  }

  // Serve frontend files
  const requested = req.url === "/" ? "index.html" : req.url.slice(1);
  const file = path.join(PUBLIC, path.normalize(requested));
  if (!file.startsWith(PUBLIC)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(file, (err, content) => {
    if (err) return send(res, 404, "Page not found", "text/plain");
    const ext = path.extname(file);
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };
    send(res, 200, content, types[ext] || "text/plain");
  });
});

server.listen(PORT, () => console.log(`Portal running at http://localhost:${PORT}`));
