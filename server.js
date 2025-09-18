const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

let submissions = [];
let questions = [];
let agreement = "";

const submissionsPath = path.join(__dirname, "submissions.json");
const questionsPath = path.join(__dirname, "questions.json");
const agreementPath = path.join(__dirname, "agreement.txt");

if (fs.existsSync(submissionsPath)) {
  submissions = JSON.parse(fs.readFileSync(submissionsPath));
}
if (fs.existsSync(questionsPath)) {
  questions = JSON.parse(fs.readFileSync(questionsPath));
}
if (fs.existsSync(agreementPath)) {
  agreement = fs.readFileSync(agreementPath, "utf-8");
}

// Static pages
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/admin", (req, res) => res.sendFile(__dirname + "/public/admin.html"));
app.get("/admin/questions", (req, res) => res.sendFile(__dirname + "/public/admin-questions.html"));
app.get("/admin/submissions", (req, res) => res.sendFile(__dirname + "/public/admin-submissions.html"));
app.get("/admin/agreement", (req, res) => res.sendFile(__dirname + "/public/admin-agreement.html"));
app.get("/success.html", (req, res) => res.sendFile(__dirname + "/public/success.html"));

// Static data
app.get("/questions.json", (req, res) => res.json(questions));
app.get("/submissions.json", (req, res) => res.json(submissions));
app.get("/agreement.txt", (req, res) => res.send(agreement));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Submit form
app.post("/submit", upload.any(), (req, res) => {
  const data = {};
  for (let key in req.body) {
    data[key] = req.body[key];
  }

  req.files.forEach((file) => {
    if (!data[file.fieldname]) {
      data[file.fieldname] = [];
    }
    if (!Array.isArray(data[file.fieldname])) {
      data[file.fieldname] = [data[file.fieldname]];
    }
    data[file.fieldname].push(file.filename);
  });

  data._submitted = new Date().toISOString();
  submissions.push(data);
  fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
  res.redirect("/success.html");
});

// API: Save questions
app.post("/api/questions", (req, res) => {
  questions = req.body.questions;
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
  res.json({ status: "ok" });
});

// API: Save agreement
app.post("/api/agreement", (req, res) => {
  agreement = req.body.agreement || "";
  fs.writeFileSync(agreementPath, agreement);
  res.json({ status: "saved" });
});

// CSV download
app.get("/api/submissions/csv", (req, res) => {
  const fields = Object.keys(submissions[0] || {}).filter(k => !k.startsWith("_"));
  const csv = [fields.join(",")];
  submissions.forEach(s => {
    const row = fields.map(f => {
      const val = s[f];
      if (Array.isArray(val)) return `"${val.join(" | ")}"`;
      return `"${val || ""}"`;
    });
    csv.push(row.join(","));
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=submissions.csv");
  res.send(csv.join("\n"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
