const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

const submissionsFile = 'submissions.json';
const questionsFile = 'questions.json';
const agreementFile = 'agreement.txt';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Public
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/success', (req, res) => res.sendFile(__dirname + '/success.html'));

// Admin
app.get('/admin', (req, res) => res.sendFile(__dirname + '/admin.html'));
app.get('/admin/questions', (req, res) => res.sendFile(__dirname + '/admin-questions.html'));
app.get('/admin/submissions', (req, res) => res.sendFile(__dirname + '/admin-submissions.html'));
app.get('/admin/agreement', (req, res) => res.sendFile(__dirname + '/admin-agreement.html'));

// Submit
app.post('/submit', upload.any(), (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];

  const submission = { ...req.body };

  // Include uploaded files
  req.files.forEach(file => {
    submission[file.fieldname] = `/uploads/${file.filename}`;
  });

  for (const key in submission) {
    if (Array.isArray(submission[key])) {
      submission[key] = submission[key].join(', ');
    }
  }

  data.push(submission);
  fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));
  res.redirect('/success');
});

// Agreement
app.get('/agreement', (req, res) => {
  const content = fs.existsSync(agreementFile)
    ? fs.readFileSync(agreementFile, 'utf8')
    : '';
  res.send(content);
});

app.post('/agreement', (req, res) => {
  fs.writeFileSync(agreementFile, req.body.text || '');
  res.json({ success: true });
});

// Questions API
app.get('/questions', (req, res) => {
  const questions = fs.existsSync(questionsFile)
    ? JSON.parse(fs.readFileSync(questionsFile))
    : [];
  res.json(questions);
});

app.post('/questions', (req, res) => {
  const newQ = req.body;
  const questions = fs.existsSync(questionsFile)
    ? JSON.parse(fs.readFileSync(questionsFile))
    : [];
  questions.push(newQ);
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
  res.json({ success: true });
});

app.post('/questions/reorder', (req, res) => {
  fs.writeFileSync(questionsFile, JSON.stringify(req.body, null, 2));
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

// Submissions
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
