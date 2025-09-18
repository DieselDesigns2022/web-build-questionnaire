const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 10000;

// Setup Multer with extension preservation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// === ROUTES ===

app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));
app.get("/success", (_, res) => res.sendFile(__dirname + "/success.html"));

// ADMIN PAGES
app.get("/admin", (_, res) => res.sendFile(__dirname + "/admin.html"));
app.get("/admin/questions", (_, res) => res.sendFile(__dirname + "/admin-questions.html"));
app.get("/admin/submissions", (_, res) => res.sendFile(__dirname + "/admin-submissions.html"));
app.get("/admin/agreement", (_, res) => res.sendFile(__dirname + "/admin-agreement.html"));

// === AGREEMENT ===
const agreementFile = "agreement.txt";

app.get("/api/agreement", (req, res) => {
  if (!fs.existsSync(agreementFile)) return res.send("");
  const text = fs.readFileSync(agreementFile, "utf-8");
  res.send(text);
});

app.post("/api/agreement", (req, res) => {
  fs.writeFileSync(agreementFile, req.body.text || "");
  res.sendStatus(200);
});

// === QUESTIONS ===
const questionsFile = "questions.json";

app.get("/api/questions", (req, res) => {
  if (!fs.existsSync(questionsFile)) return res.json([]);
  const questions = JSON.parse(fs.readFileSync(questionsFile));
  res.json(questions);
});

app.post("/api/questions", (req, res) => {
  fs.writeFileSync(questionsFile, JSON.stringify(req.body || [], null, 2));
  res.sendStatus(200);
});

// === SUBMISSIONS ===
const submissionsFile = "submissions.json";

app.post("/submit", upload.any(), (req, res) => {
  const data = req.body;
  const files = req.files;

  files.forEach((file) => {
    data[file.fieldname] = `/uploads/${file.filename}`;
  });

  let submissions = [];
  if (fs.existsSync(submissionsFile)) {
    submissions = JSON.parse(fs.readFileSync(submissionsFile));
  }

  submissions.push({ ...data, timestamp: new Date().toISOString() });

  fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
  res.redirect("/success");
});

app.get("/api/submissions", (_, res) => {
  if (!fs.existsSync(submissionsFile)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(submissionsFile));
  res.json(data);
});

// === CSV DOWNLOAD ===
app.get("/api/download-csv", (_, res) => {
  if (!fs.existsSync(submissionsFile)) return res.send("No submissions found.");

  const data = JSON.parse(fs.readFileSync(submissionsFile));
  if (!data.length) return res.send("No submissions found.");

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  res.setHeader("Content-disposition", "attachment; filename=submissions.csv");
  res.set("Content-Type", "text/csv");
  res.status(200).send(csv);
});

// === START ===
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
