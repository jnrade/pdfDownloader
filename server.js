const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const twilio = require('twilio');
require('dotenv').config();

// tokens
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio credentials (You can use environment variables for security)
const client = new twilio(accountSid, authToken);

// Endpoint for Twilio to POST WhatsApp messages
app.post('/whatsapp', (req, res) => {
  const incomingMsg = req.body.Body.trim();
  const from = req.body.From; // Sender's WhatsApp number

  if (incomingMsg === '2') {
    // Provide the download link for the PDF
    const pdfUrl = 'https://pdfdownloader-21zh.onrender.com/download/samplePdf.pdf';

    // Send a WhatsApp message using Twilio API
    client.messages.create({
      body: `Here is your PDF: ${pdfUrl}`,
      from: 'whatsapp:+14155238886', // Twilio Sandbox number
      to: from
    })
    .then(message => console.log(`Message sent: ${message.sid}`))
    .catch(error => console.error('Error sending message:', error));
  } else {
    // Respond with a default message
    client.messages.create({
      body: 'Please send "2" to receive the PDF.',
      from: 'whatsapp:+14155238886', // Twilio Sandbox number
      to: from
    })
    .then(message => console.log(`Message sent: ${message.sid}`))
    .catch(error => console.error('Error sending message:', error));
  }

  // Respond with a 200 status to Twilio
  res.status(200).send();
});

// Endpoint for downloading the PDF
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'pdfs', req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
