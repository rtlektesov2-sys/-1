const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

function sendJSON(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

function sendFile(res, fileName, contentType) {
    fs.readFile(path.join(__dirname, fileName), function (err, content) {
        if (err) {
            sendJSON(res, 500, { error: "Не удалось прочитать файл страницы" });
            return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
}

function readItems(callback) {
    fs.readFile(DATA_FILE, "utf8", function (err, text) {
        if (err) { callback(err, null); return; }
        try { callback(null, JSON.parse(text)); }
        catch (parseError) { callback(parseError, null); }
    });
}

function writeItems(items, callback) {
    fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8", callback);
}

function readBody(req, callback) {
    let body = "";
    req.on("data", function (chunk) { body += chunk; });
    req.on("end", function () {
        try { callback(null, JSON.parse(body)); }
        catch (err) { callback(err, null); }
    });
}

function validate(item) {
    if (!item || typeof item.title !== "string" || item.title.trim() === "") {
        return ["Требуется непустое поле title"];
    }
    return [];
}

const server = http.createServer(function (req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/" && req.method === "GET") {
        if (req.headers.accept && req.headers.accept.includes("text/html")) {
            sendFile(res, "index.html", "text/html; charset=utf-8");
            return;
        }
        sendJSON(res, 200, {
            name: "API домашних рецептов",
            routes: ["GET /items", "GET /items?category=...", "GET /items/:id", "POST /items"]
        });
        return;
    }

    const staticFiles = {
        "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
        "/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
        "/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" }
    };
    if (req.method === "GET" && staticFiles[url.pathname]) {
        const staticFile = staticFiles[url.pathname];
        sendFile(res, staticFile.file, staticFile.type);
        return;
    }

    // 2. добавление записи
    if (url.pathname === "/items" && req.method === "POST") {
        readBody(req, function (err, newItem) {
            if (err || !newItem) {
                sendJSON(res, 400, { error: "Тело запроса не является корректным JSON" });
                return;
            }

            const problems = validate(newItem);
            if (problems.length > 0) {
                sendJSON(res, 400, { error: "Данные заполнены неверно", problems: problems });
                return;
            }
            readItems(function (err2, items) {
                if (err2) { sendJSON(res, 500, { error: "Не удалось прочитать данные" }); return; }
                let maxId = 0;
                for (const item of items) {
                    if (item.id > maxId) { maxId = item.id; }
                }
                newItem.id = maxId + 1;
                items.push(newItem);
                writeItems(items, function (err3) {
                    if (err3) { sendJSON(res, 500, { error: "Не удалось сохранить" }); return; }
                    sendJSON(res, 201, newItem);
                });
            });
        });
        return;
    }

    if (url.pathname.startsWith("/items/") && req.method === "GET") {
        const id = Number(url.pathname.split("/")[2]);
        readItems(function (err, items) {
            if (err) {
                sendJSON(res, 500, { error: "Не удалось прочитать данные" });
                return;
            }
            const item = items.find(function (entry) { return entry.id === id; });
            if (!item) {
                sendJSON(res, 404, { error: "Запись не найдена" });
                return;
            }
            sendJSON(res, 200, item);
        });
        return;
    }

    if (url.pathname === "/items") {
        if (req.method !== "GET") {
            sendJSON(res, 404, { error: "Маршрут не найден" });
            return;
        }
        readItems(function (err, items) {
            if (err) { sendJSON(res, 500, { error: "Не удалось прочитать данные" }); return; }
            const category = url.searchParams.get("category");
            if (category) {
                items = items.filter(function (item) { return item.category === category; });
            }
            sendJSON(res, 200, items);
        });
        return;
    }

    sendJSON(res, 404, { error: "Маршрут не найден" });
});

server.listen(PORT, function () {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});


