require('dotenv').config(); // Must be at the very top
const express = require('express');
const path = require('path');
const db = require('./database.js');
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const port = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- NEW ---
// API endpoint to get all saved waveforms
app.get('/api/waveforms', (req, res) => {
  const sql = "SELECT id, email, imageData, createdAt FROM waveforms ORDER BY createdAt DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching from database', err.message);
      return res.status(500).json({ message: 'Error fetching from database' });
    }
    res.json({
      message: 'success',
      data: rows
    });
  });
});
// --- END NEW ---

app.post('/api/save-waveform', (req, res) => {
  const { email, imageData } = req.body;

  if (!email || !imageData) {
    return res.status(400).json({ message: 'Missing email or image data' });
  }

  const sql = `INSERT INTO waveforms (email, imageData) VALUES (?, ?)`;
  db.run(sql, [email, imageData], function(err) {
    if (err) {
      console.error('Error saving to database', err.message);
      return res.status(500).json({ message: 'Error saving to database' });
    }
    console.log(`A new waveform has been saved with ID: ${this.lastID}`);
    res.status(200).json({ message: 'Waveform saved successfully!' });
  });
});

app.post('/api/send-waveform', (req, res) => {
  const { email, imageData } = req.body;

  if (!email || !imageData) {
    return res.status(400).json({ message: 'Missing email or image data' });
  }

  // First, save to database
  const sql = `INSERT INTO waveforms (email, imageData) VALUES (?, ?)`;
  db.run(sql, [email, imageData], function(err) {
    if (err) {
      console.error('Error saving to database', err.message);
      return res.status(500).json({ message: 'Error saving to database' });
    }
    console.log(`A new waveform has been saved with ID: ${this.lastID}`);
    
    // --- Now, send the real email via SendGrid ---
    const msg = {
      to: email, // Recipient from the form
      from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender
      subject: 'Your Saved Circular Waveform',
      text: 'Thank you for using the Circular Waveform Visualizer! Your generated waveform is attached.',
      html: '<strong>Thank you for using the Circular Waveform Visualizer!</strong><p>Your generated waveform is attached.</p>',
      attachments: [
        {
          content: imageData.split("base64,")[1], // Remove the data URI prefix
          filename: 'waveform.png',
          type: 'image/png',
          disposition: 'attachment',
        },
      ],
    };

    sgMail.send(msg)
      .then(() => {
        console.log(`Email successfully sent to: ${email}`);
        res.status(200).json({ message: 'Waveform saved and email sent successfully!' });
      })
      .catch((error) => {
        console.error('Error sending email via SendGrid:', error);
        if (error.response) {
          console.error(error.response.body);
        }
        // Still send a success response to the client, as the main action (saving) worked.
        res.status(200).json({ message: 'Waveform saved, but there was an error sending the email.' });
      });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running. Open your browser and go to http://localhost:${port}`);
});
