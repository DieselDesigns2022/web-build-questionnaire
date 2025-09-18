const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const submissionsFile = 'submissions.json';
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Public homepage
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// Admin page
app.get('/admin', (req, res) => res.sendFile(__dirname + '/admin.html'));

// Success page
app.get('/success', (req, res) => res.sendFile(__dirname + '/success.html'));

// Handle form submission
app.post('/submit', upload.single('image'), (req, res) => {
  const { fullname, email, options, interests, message } = req.body;

  // Ensure interests is a string for CSV compatibility
  const formattedInterests = Array.isArray(interests) ? interests.join(', ') : interests;

  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const newEntry = {
    fullname,
    email,
    options,
    interests: formattedInterests,
    message,
    image: imagePath
  };

  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];

  data.push(newEntry);
  fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));

  res.redirect('/success');
});

// View submissions (used by admin panel)
app.get('/submissions', (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];
  res.json(data);
});

// Download CSV of all submissions
app.get('/download', (req, res) => {
  const data = fs.existsSync(submissionsFile)
    ? JSON.parse(fs.readFileSync(submissionsFile))
    : [];

  const csvWriter = createObjectCsvWriter({
    path: 'submissions.csv',
    header: [
      { id: 'fullname', title: 'Full Name' },
      { id: 'email', title: 'Email' },
      { id: 'options', title: 'Option' },
      { id: 'interests', title: 'Interests' },
      { id: 'message', title: 'Message' },
      { id: 'image', title: 'Image URL' }
    ]
  });

  csvWriter.writeRecords(data).then(() => {
    res.download('submissions.csv');
  });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
