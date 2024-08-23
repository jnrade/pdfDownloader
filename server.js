const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { MessagingResponse } = require('twilio').twiml;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Endpoint for Twilio to POST WhatsApp messages
app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();

  const incomingMsg = req.body.Body.trim();

  if (incomingMsg === '2') {
    // Provide the download link for the PDF
    const pdfUrl = 'https://pdfdownloader-21zh.onrender.com/download/samplePdf.pdf';
    twiml.message(`Here is your PDF: ${pdfUrl}`);
  } else {
    // Respond with a default message
    twiml.message('Please send "2" to receive the PDF.');
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
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
