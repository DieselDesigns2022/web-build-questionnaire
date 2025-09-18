const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("."));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + ext);
  },
});
const upload = multer({ storage });

// Routes - Pages
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.get("/admin", (_, res) => res.sendFile(__dirname + "/admin.html"));
app.get("/admin/questions", (_, res) => res.sendFile(__dirname + "/admin-questions.html"));
app.get("/admin/submissions", (_, res) => res.sendFile(__dirname + "/admin-submissions.html"));
app.get("/admin/agreement", (_, res) => res.sendFile(__dirname + "/admin-agreement.html"));
app.get("/success", (_, res) => res.sendFile(__dirname + "/success.html"));

// API: Questions
app.get("/api/questions", (req, res) => {
  if (fs.existsSync("questions.json")) {
    const data = fs.readFileSync("questions.json", "utf-8");
    res.json(JSON.parse(data));
  } else {
    res.json({ questions: [] });
  }
});

app.post("/api/questions", (req, res) => {
  const { questions } = req.body;
  fs.writeFileSync("questions.json", JSON.stringify({ questions }, null, 2));
  res.sendStatus(200);
});

// API: Agreement
app.get("/api/agreement", (req, res) => {
  const text = fs.existsSync("agreement.txt")
    ? fs.readFileSync("agreement.txt", "utf-8")
    : "";
  res.send(text);
});

app.post("/api/agreement", (req, res) => {
  fs.writeFileSync("agreement.txt", req.body.text || "");
  res.sendStatus(200);
});

// API: Submissions
app.get("/api/submissions", (req, res) => {
  if (fs.existsSync("submissions.json")) {
    const data = fs.readFileSync("submissions.json", "utf-8");
    res.json(JSON.parse(data));
  } else {
    res.json({ submissions: [] });
  }
});

app.post("/submit", upload.any(), (req, res) => {
  const formData = { ...req.body, files: {} };

  req.files.forEach(file => {
    formData.files[file.fieldname] = file.path;
  });

  const existing = fs.existsSync("submissions.json")
    ? JSON.parse(fs.readFileSync("submissions.json", "utf-8"))
    : { submissions: [] };

  existing.submissions.push({ submitted: new Date(), data: formData });

  fs.writeFileSync("submissions.json", JSON.stringify(existing, null, 2));

  res.redirect("/success");
});

// CSV Export
app.get("/api/export-csv", (req, res) => {
  if (!fs.existsSync("submissions.json")) return res.send("No submissions");

  const { submissions } = JSON.parse(fs.readFileSync("submissions.json", "utf-8"));
  if (!submissions.length) return res.send("No data");

  const headers = new Set();
  submissions.forEach(sub => {
    Object.keys(sub.data).forEach(k => headers.add(k));
  });

  const allHeaders = Array.from(headers);
  const rows = [allHeaders.join(",")];

  submissions.forEach(sub => {
    const row = allHeaders.map(h => {
      let val = sub.data[h] || "";
      if (typeof val === "object") val = JSON.stringify(val);
      if (typeof val === "string") val = `"${val.replace(/"/g, '""')}"`;
      return val;
    });
    rows.push(row.join(","));
  });

  const csv = rows.join("\n");
  res.header("Content-Type", "text/csv");
  res.attachment("submissions.csv");
  res.send(csv);
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
