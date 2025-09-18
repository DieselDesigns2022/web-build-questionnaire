const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(express.static('.'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ----------- QUESTIONS ROUTES ------------
const QUESTIONS_FILE = 'questions.json';

app.get('/questions.json', (req, res) => {
  fs.readFile(QUESTIONS_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

app.post('/api/questions', (req, res) => {
  const newQuestion = req.body;
  fs.readFile(QUESTIONS_FILE, 'utf8', (err, data) => {
    const questions = err ? [] : JSON.parse(data);
    questions.push(newQuestion);
    fs.writeFile(QUESTIONS_FILE, JSON.stringify(questions, null, 2), () => {
      res.json({ success: true });
    });
  });
});

app.post('/api/questions/reorder', (req, res) => {
  const order = req.body.order;
  fs.readFile(QUESTIONS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to load questions' });
    const questions = JSON.parse(data);
    const reordered = order.map(i => questions[i]);
    fs.writeFile(QUESTIONS_FILE, JSON.stringify(reordered, null, 2), () => {
      res.json({ success: true });
    });
  });
});

// ----------- SUBMISSION ROUTES ------------
const SUBMISSIONS_FILE = 'submissions.json';

app.post('/submit', upload.any(), (req, res) => {
  const submission = req.body;
  (req.files || []).forEach(file => {
    submission[file.fieldname] = `/uploads/${file.filename}`;
  });

  fs.readFile(SUBMISSIONS_FILE, 'utf8', (err, data) => {
    const submissions = err ? [] : JSON.parse(data);
    submissions.push(submission);
    fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), () => {
      res.redirect('/success.html');
    });
  });
});

app.get('/submissions.json', (req, res) => {
  fs.readFile(SUBMISSIONS_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

app.get('/download-csv', (req, res) => {
  fs.readFile(SUBMISSIONS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Failed to read submissions');

    const submissions = JSON.parse(data);
    if (!submissions.length) return res.send('No submissions');

    const fields = Object.keys(submissions[0]);
    const csv = [
      fields.join(','),
      ...submissions.map(s => fields.map(f => JSON.stringify(s[f] || '')).join(','))
    ].join('\n');

    res.setHeader('Content-disposition', 'attachment; filename=submissions.csv');
    res.set('Content-Type', 'text/csv');
    res.send(csv);
  });
});

// ----------- AGREEMENT ROUTES ------------

const AGREEMENT_FILE = 'agreement.txt';

app.get('/agreement.txt', (req, res) => {
  fs.readFile(AGREEMENT_FILE, 'utf8', (err, data) => {
    if (err) return res.send('');
    res.send(data);
  });
});

app.post('/api/agreement', (req, res) => {
  const text = req.body.text || '';
  fs.writeFile(AGREEMENT_FILE, text, () => {
    res.json({ success: true });
  });
});

// ----------- START SERVER ------------
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
