const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const submissionsFile = 'submissions.json';
const questionsFile = 'questions.json';
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/admin.html'));
app.get('/success', (req, res) => res.sendFile(__dirname + '/success.html'));

// 🔥 DYNAMIC QUESTION HANDLERS
app.get('/questions', (req, res) => {
  const questions = fs.existsSync(questionsFile)
    ? JSON.parse(fs.readFileSync(questionsFile))
    : [];
  res.json(questions);
});

app.post('/questions', (req, res) => {
  const newQ = req.body;
  const existing = fs.existsSync(questionsFile)
    ? JSON.parse(fs.readFileSync(questionsFile))
    : [];
  existing.push(newQ);
  fs.writeFileSync(questionsFile, JSON.stringify(existing, null, 2));
  res.json({ success: true });
});

app.delete('/questions/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const questions = fs.existsSync(questionsFile)
    ? JSON.parse(fs.readFileSync(questionsFile))
    : [];
  questions.splice(index, 1);
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
  res.json({ success: true });
});

// 📨 SUBMIT FORM
app.post('/submit', upload.single('image'), (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];

  const submission = {
    ...req.body,
    image: req.file ? `/uploads/${req.file.filename}` : null
  };

  // Join checkbox array to string
  for (const key in submission) {
    if (Array.isArray(submission[key])) {
      submission[key] = submission[key].join(', ');
    }
  }

  data.push(submission);
  fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));
  res.redirect('/success');
});

app.get('/submissions', (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];
  res.json(data);
});

app.get('/download', (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];

  const headers = Object.keys(data[0] || {}).map(key => ({
    id: key,
    title: key.charAt(0).toUpperCase() + key.slice(1)
  }));

  const csvWriter = createObjectCsvWriter({
    path: 'submissions.csv',
    header: headers
  });

  csvWriter.writeRecords(data).then(() => {
    res.download('submissions.csv');
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
