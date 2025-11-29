require('dotenv').config();
const express = require('express');
const db = require('./database.js');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// API Routes
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
      data: data
   });
});

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
   console.log(`A new waveform has been saved.`);
   res.status(200).json({ message: 'Waveform saved successfully!' });
});

app.post('/api/send-waveform', async (req, res) => {
   const { email, imageData } = req.body;

   if (!email || !imageData) {
      return res.status(400).json({ message: 'Missing email or image data' });
   }

   const { data: dbData, error: dbError } = await db
      .from('waveforms')
      .insert([{ email: email, imageData: imageData }]);

   if (dbError) {
      console.error('Error saving to Supabase', dbError.message);
      return res.status(500).json({ message: 'Error saving to Supabase' });
   }
   console.log(`A new waveform has been saved.`);
  
   const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Your Saved Circular Waveform',
      text: 'Thank you for using the Circular Waveform Visualizer! Your generated waveform is attached.',
      html: '<strong>Thank you for using the Circular Waveform Visualizer!</strong><p>Your generated waveform is attached.</p>',
      attachments: [
         {
            content: imageData.split("base64,")[1],
            filename: 'waveform.png',
            type: 'image/png',
            disposition: 'attachment',
         },
      ],
   };

   try {
      await sgMail.send(msg);
      console.log(`Email successfully sent to: ${email}`);
      res.status(200).json({ message: 'Waveform saved and email sent successfully!' });
   } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      if (error.response) {
         console.error(error.response.body);
      }
      res.status(500).json({ message: 'Waveform saved, but there was an error sending the email.' });
   }
});

// Export the app for Vercel
module.exports = app;