const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Save agreement text
app.post('/save-agreement', (req, res) => {
  const { agreement } = req.body;

  fs.writeFile('agreement.txt', agreement, (err) => {
    if (err) {
      console.error('Error saving agreement:', err);
      return res.status(500).send('Error saving agreement');
    }
    res.send('Agreement saved!');
  });
});

// ✅ Serve agreement text (client-side use)
app.get('/agreement.txt', (req, res) => {
  const filePath = path.join(__dirname, 'agreement.txt');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading agreement file:', err);
      return res.status(404).send('');
    }
    res.type('text/plain').send(data);
  });
});

// ✅ Save questions
app.post('/save-questions', (req, res) => {
  fs.writeFile('questions.json', JSON.stringify(req.body, null, 2), err => {
    if (err) {
      console.error('Error saving questions:', err);
      return res.status(500).send('Error saving questions');
    }
    res.send('Questions saved!');
  });
});

// ✅ Get questions
app.get('/questions', (req, res) => {
  fs.readFile('questions.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading questions:', err);
      return res.status(500).send('Error reading questions');
    }
    res.json(JSON.parse(data));
  });
});

// ✅ Save submissions
app.post('/submit', (req, res) => {
  const submission = req.body;
  const submissionsPath = path.join(__dirname, 'submissions.json');

  fs.readFile(submissionsPath, 'utf8', (err, data) => {
    const submissions = err ? [] : JSON.parse(data || '[]');
    submissions.push(submission);

    fs.writeFile(submissionsPath, JSON.stringify(submissions, null, 2), err => {
      if (err) {
        console.error('Error saving submission:', err);
        return res.status(500).send('Error saving submission');
      }
      res.redirect('/success.html');
    });
  });
});

// ✅ Admin view submissions
app.get('/admin/submissions', (req, res) => {
  fs.readFile('submissions.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading submissions:', err);
      return res.status(500).send('Error reading submissions');
    }
    res.type('application/json').send(data);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
