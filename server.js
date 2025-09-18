const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("."));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload handler
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// === Serve HTML Pages ===
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.get("/admin", (_, res) => res.sendFile(__dirname + "/admin.html"));
app.get("/admin/questions", (_, res) => res.sendFile(__dirname + "/admin-questions.html"));
app.get("/admin/submissions", (_, res) => res.sendFile(__dirname + "/admin-submissions.html"));
app.get("/admin/agreement", (_, res) => res.sendFile(__dirname + "/admin-agreement.html"));
app.get("/success.html", (_, res) => res.sendFile(__dirname + "/success.html"));

// === API: Questions ===
app.get("/questions.json", (req, res) => {
  const file = "questions.json";
  if (fs.existsSync(file)) {
    const data = fs.readFileSync(file, "utf-8");
    res.type("application/json").send(data);
  } else {
    res.json([]);
  }
});

app.post("/api/questions", (req, res) => {
  const { questions } = req.body;
  fs.writeFileSync("questions.json", JSON.stringify(questions, null, 2));
  res.sendStatus(200);
});

// === API: Agreement ===
app.get("/agreement.txt", (_, res) => {
  const text = fs.existsSync("agreement.txt")
    ? fs.readFileSync("agreement.txt", "utf-8")
    : "<p>No agreement found.</p>";
  res.type("html").send(text);
});

app.post("/api/agreement", (req, res) => {
  fs.writeFileSync("agreement.txt", req.body.text || "");
  res.sendStatus(200);
});

// === API: Submissions ===
app.get("/api/submissions", (_, res) => {
  const file = "submissions.json";
  if (!fs.existsSync(file)) return res.json({ submissions: [] });

  const raw = fs.readFileSync(file, "utf-8");
  res.json(JSON.parse(raw));
});

app.post("/submit", upload.any(), (req, res) => {
  const data = { ...req.body, files: {} };

  if (req.files) {
    req.files.forEach(file => {
      data.files[file.fieldname] = file.path;
    });
  }

  const file = "submissions.json";
  const current = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf-8"))
    : { submissions: [] };

  current.submissions.push({ date: new Date(), data });
  fs.writeFileSync(file, JSON.stringify(current, null, 2));

  res.redirect("/success.html");
});

app.get("/api/export-csv", (_, res) => {
  const file = "submissions.json";
  if (!fs.existsSync(file)) return res.send("No data.");

  const { submissions } = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!submissions.length) return res.send("No data.");

  const headers = new Set();
  submissions.forEach(entry => {
    Object.keys(entry.data).forEach(key => headers.add(key));
  });

  const csvRows = [Array.from(headers).join(",")];
  submissions.forEach(entry => {
    const row = Array.from(headers).map(h => {
      let val = entry.data[h];
      if (typeof val === "object") val = JSON.stringify(val);
      return `"${String(val || "").replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(","));
  });

  res.header("Content-Type", "text/csv");
  res.attachment("submissions.csv");
  res.send(csvRows.join("\n"));
});

// === Start Server ===
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
