const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio credentials
const accountSid = process.env.accountSid || 'your_account_sid';
const authToken = process.env.authToken || 'your_auth_token';
const client = new twilio(accountSid, authToken);

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

// Serve the pdfs directory publicly
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const sessionDir = path.join(__dirname, 'pdfs', req.sessionID);
        fs.ensureDirSync(sessionDir);
        cb(null, sessionDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'latest.pdf');
    }
});
const upload = multer({ storage: storage });

// Endpoint for Twilio to POST WhatsApp messages
app.post('/whatsapp', async (req, res) => {
    const incomingMsg = req.body.Body.trim();
    const from = req.body.From;

    if (incomingMsg === '2') {
        // Notify the local machine to upload the PDF
        req.session.pendingRequest = true;

        await client.messages.create({
            body: 'Please wait while we retrieve your PDF.',
            from: 'whatsapp:+14155238886',
            to: from
        });
    } else {
        await client.messages.create({
            body: 'Please send "2" to receive the most recent PDF.',
            from: 'whatsapp:+14155238886',
            to: from
        });
    }

    res.status(200).send();
});

// Endpoint for local machine to upload the latest PDF
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    if (req.session.pendingRequest) {
        const sessionId = req.sessionID;
        const pdfUrl = `https://pdfdownloader-21zh.onrender.com/pdfs/${sessionId}/latest.pdf`;

        await client.messages.create({
            body: `Here is your PDF: ${pdfUrl}`,
            from: 'whatsapp:+14155238886',
            to: req.session.whatsappNumber
        });

        req.session.pendingRequest = false;
    }

    res.status(200).send('PDF uploaded successfully');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Render app server is running on port ${PORT}`);
});
