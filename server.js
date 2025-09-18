const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const submissionsFile = 'submissions.json';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname)); // ✅ Allows access to static files like admin.html

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

app.post('/submit', upload.single('image'), (req, res) => {
  const { fullname, email, options, interests, message } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const newEntry = { fullname, email, options, interests, message, image: imagePath };
  const data = fs.existsSync(submissionsFile) ? JSON.parse(fs.readFileSync(submissionsFile)) : [];
  data.push(newEntry);
  fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2));
  res.send('<h2>Thank you for your submission!</h2><p><a href=\"/\">Go back</a></p>');
});

app.post('/admin', (req, res) => {
  const { password } = req.body;
  if (password !== adminPassword) {
    return res.status(403).send('Forbidden');
  }

  // ✅ Instead of redirecting to /admin.html, just serve the file directly
  res.sendFile(__dirname + '/admin.html');
});

app.get('/submissions', (req, res) => {
  const data = fs.existsSync(submissionsFile) ? JSON.parse(fs.readFileSync(submissionsFile)) : [];
  res.json(data);
});

app.get('/download', (req, res) => {
  const data = fs.existsSync(submissionsFile) ? JSON.parse(fs.readFileSync(submissionsFile)) : [];
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
