require('dotenv').config(); // Must be at the very top
const express = require('express');
const path = require('path');
const db = require('./database.js');
const sgMail = require('@sendgrid/mail');

// Set the SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- NEW ---
// API endpoint to get all saved waveforms
app.get('/api/waveforms', async (req, res) => {
  const { data, error } = await db
    .from('waveforms')
    .select('id, email, imageData, createdAt')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching from Supabase', error.message);
    return res.status(500).json({ message: 'Error fetching from Supabase' });
  }
  res.json({
    message: 'success',
    data: data,
  });
});
// --- END NEW ---

app.post('/api/save-waveform', async (req, res) => {
  const { email, imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ message: 'Missing image data' });
  }

  const { data, error } = await db
    .from('waveforms')
    .insert([{ email: email || null, imageData: imageData }]);

  if (error) {
    console.error('Error saving to Supabase', error.message);
    return res.status(500).json({ message: 'Error saving to Supabase' });
  }
  console.log(`A new waveform has been saved.`); // Supabase insert does not return lastID easily
  res.status(200).json({ message: 'Waveform saved successfully!' });
});

app.post('/api/send-waveform', async (req, res) => {
  const { email, imageData } = req.body;

  if (!email || !imageData) {
    return res.status(400).json({ message: 'Missing email or image data' });
  }

  // First, save to database
  const { data: dbData, error: dbError } = await db
    .from('waveforms')
    .insert([{ email: email, imageData: imageData }]);

  if (dbError) {
    console.error('Error saving to Supabase', dbError.message);
    return res.status(500).json({ message: 'Error saving to Supabase' });
  }
  console.log(`A new waveform has been saved.`);

  // --- Now, send the real email via SendGrid ---
  const msg = {
    to: email, // Recipient from the form
    from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender
    subject: 'Your Saved Circular Waveform',
    text: 'Thank you for using the Circular Waveform Visualizer! Your generated waveform is attached.',
    html: '<strong>Thank you for using the Circular Waveform Visualizer!</strong><p>Your generated waveform is attached.</p>',
    attachments: [
      {
        content: imageData.split('base64,')[1], // Remove the data URI prefix
        filename: 'waveform.png',
        type: 'image/png',
        disposition: 'attachment',
      },
    ],
  };

  sgMail
    .send(msg)
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

// Export the app for Vercel
module.exports = app;