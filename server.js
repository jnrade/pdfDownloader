const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const session = require('express-session');
const twilio = require('twilio');
require('dotenv').config()

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio credentials (Use environment variables for security in production)
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';  // Replace with your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';    // Replace with your Twilio Auth Token
const client = new twilio(accountSid, authToken);

// Session setup
app.use(session({
    secret: 'junior', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // Session expires after 1 minute
}));

// Helper function to find the most recent file in a directory
function getMostRecentFile(dir) {
    const files = fs.readdirSync(dir)
        .map(name => ({ name, time: fs.statSync(path.join(dir, name)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time)
        .map(file => file.name);
    return files.length ? files[0] : null;
}

// Endpoint for Twilio to POST WhatsApp messages
app.post('/whatsapp', async (req, res) => {
    const incomingMsg = req.body.Body.trim();
    const from = req.body.From; // Sender's WhatsApp number

    if (incomingMsg === '2') {
        // Access the most recent PDF document
        const sourceDir = 'C:/Users/YourName/Documents'; // Replace with the directory containing your PDFs
        const mostRecentFile = getMostRecentFile(sourceDir);

        if (mostRecentFile) {
            // Copy the most recent file to a session-specific directory
            const sessionDir = path.join(__dirname, 'pdfs', req.sessionID);
            await fs.ensureDir(sessionDir);

            const sourceFilePath = path.join(sourceDir, mostRecentFile);
            const targetFilePath = path.join(sessionDir, mostRecentFile);

            try {
                await fs.copy(sourceFilePath, targetFilePath);
                console.log(`File copied to ${targetFilePath}`);

                // Store the file path in the session
                req.session.pdfFilePath = targetFilePath;

                // Send the user the download link
                const pdfUrl = `https://your-render-app-url/download/${req.sessionID}/${mostRecentFile}`;
                await client.messages.create({
                    body: `Here is your most recent PDF: ${pdfUrl}`,
                    from: 'whatsapp:+14155238886', // Twilio Sandbox number
                    to: from
                });
            } catch (err) {
                console.error('Error copying file:', err);
                await client.messages.create({
                    body: 'An error occurred while processing your request. Please try again later.',
                    from: 'whatsapp:+14155238886',
                    to: from
                });
            }
        } else {
            // No files found in the directory
            await client.messages.create({
                body: 'No PDF documents found.',
                from: 'whatsapp:+14155238886',
                to: from
            });
        }
    } else {
        // Respond with a default message
        await client.messages.create({
            body: 'Please send "2" to receive the most recent PDF.',
            from: 'whatsapp:+14155238886',
            to: from
        });
    }

    // Respond with a 200 status to Twilio
    res.status(200).send();
});

// Endpoint for downloading the PDF
app.get('/download/:sessionId/:filename', (req, res) => {
    const sessionDir = path.join(__dirname, 'pdfs', req.params.sessionId);
    const filePath = path.join(sessionDir, req.params.filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (!err) {
                // Delete the file after download
                fs.remove(sessionDir, (err) => {
                    if (err) console.error('Error deleting session files:', err);
                    else console.log(`Session files deleted for session ID ${req.params.sessionId}`);
                });
            }
        });
    } else {
        res.status(404).send('File not found.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});