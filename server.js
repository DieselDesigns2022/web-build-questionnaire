const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Load Questionnaire Data ===
app.get('/get-questions', (req, res) => {
  fs.readFile('questions.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions:', err);
      res.status(500).send('Error reading questions');
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// === Save Questionnaire Responses ===
app.post('/submit', (req, res) => {
  const submission = req.body;

  fs.readFile('submissions.json', 'utf8', (err, data) => {
    const submissions = err ? [] : JSON.parse(data);
    submissions.push(submission);

    fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2), err => {
      if (err) {
        console.error('Error saving submission:', err);
        res.status(500).send('Failed to save submission.');
      } else {
        res.send('Submission saved successfully.');
      }
    });
  });
});

// === Admin: Load All Submissions ===
app.get('/get-submissions', (req, res) => {
  fs.readFile('submissions.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading submissions.');
    } else {
      res.send(data);
    }
  });
});

// === Admin: Load Agreement Text ===
app.get('/get-agreement', (req, res) => {
  fs.readFile('agreement.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading agreement:', err);
      res.send('');
    } else {
      res.send(data);
    }
  });
});

// === Admin: Save Agreement Text ===
app.post('/save-agreement', (req, res) => {
  const agreement = req.body.agreement;

  fs.writeFile('agreement.txt', agreement, err => {
    if (err) {
      console.error('Error saving agreement:', err);
      res.status(500).send('Failed to save agreement.');
    } else {
      res.send('Agreement saved!');
    }
  });
});

// === Fallback: Serve index.html if route not matched ===
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Start Server ===
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
