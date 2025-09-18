const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 10000;

// Static folder for client pages
app.use(express.static(path.join(__dirname)));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Load questions from file
function loadQuestions() {
  try {
    return JSON.parse(fs.readFileSync("questions.json"));
  } catch {
    return [];
  }
}

// Save questions to file
function saveQuestions(questions) {
  fs.writeFileSync("questions.json", JSON.stringify(questions, null, 2));
}

// Load submissions
function loadSubmissions() {
  try {
    return JSON.parse(fs.readFileSync("submissions.json"));
  } catch {
    return [];
  }
}

// Save submissions
function saveSubmissions(submissions) {
  fs.writeFileSync("submissions.json", JSON.stringify(submissions, null, 2));
}

// Load agreement text
function loadAgreement() {
  try {
    return fs.readFileSync("agreement.txt", "utf-8");
  } catch {
    return "";
  }
}

// Save agreement text
function saveAgreement(text) {
  fs.writeFileSync("agreement.txt", text, "utf-8");
}

// Routes to serve HTML pages
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.get("/admin", (req, res) => res.sendFile(__dirname + "/admin.html"));
app.get("/admin/questions", (req, res) => res.sendFile(__dirname + "/admin-questions.html"));
app.get("/admin/agreement", (req, res) => res.sendFile(__dirname + "/admin-agreement.html"));
app.get("/admin/submissions", (req, res) => res.sendFile(__dirname + "/admin-submissions.html"));
app.get("/success.html", (req, res) => res.sendFile(__dirname + "/success.html"));

// API endpoints
app.get("/api/questions", (req, res) => {
  res.json(loadQuestions());
});

app.post("/api/questions", (req, res) => {
  const questions = req.body.questions;
  saveQuestions(questions);
  res.sendStatus(200);
});

app.get("/api/agreement", (req, res) => {
  res.send(loadAgreement());
});

app.post("/api/agreement", (req, res) => {
  saveAgreement(req.body.text || "");
  res.sendStatus(200);
});

app.get("/api/submissions", (req, res) => {
  res.json(loadSubmissions());
});

// Form submission route
app.post("/submit", upload.any(), (req, res) => {
  const questions = loadQuestions();
  const formData = {};

  questions.forEach((q) => {
    if (q.type === "file") {
      const file = req.files.find((f) => f.fieldname === q.name);
      formData[q.label] = file ? `/uploads/${file.filename}` : "";
    } else {
      formData[q.label] = req.body[q.name] || "";
    }
  });

  const submissions = loadSubmissions();
  submissions.push({ date: new Date().toISOString(), data: formData });
  saveSubmissions(submissions);

  res.redirect("/success.html");
});

// CSV Download
app.get("/download-csv", (req, res) => {
  const submissions = loadSubmissions();
  if (!submissions.length) return res.send("No submissions yet.");

  const headers = Object.keys(submissions[0].data);
  const csv = [
    ["Date", ...headers].join(","),
    ...submissions.map((s) =>
      [s.date, ...headers.map((h) => `"${(s.data[h] || "").replace(/"/g, '""')}"`)].join(",")
    ),
  ].join("\n");

  res.setHeader("Content-disposition", "attachment; filename=submissions.csv");
  res.set("Content-Type", "text/csv");
  res.send(csv);
});

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Catch-all for 404s
app.use((req, res) => res.status(404).send("Not Found"));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
