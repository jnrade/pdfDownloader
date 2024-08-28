const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require ('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/whatsapp', async (req, res) => {
    const messageBody = req.body.Body || '';
    const sender = req.body.From;

    if (messageBody.trim() === '2') {
        try {
            // Request the PDF from the local server
            const response = await axios.get('http://localhost:5001/api/get_pdf', {
                responseType: 'stream'
            });

            // Save the PDF to a temporary location
            const pdfPath = path.join(__dirname, 'Desktop', 'samplePdfPath','samplePDF.pdf');
            const writer = fs.createWriteStream(pdfPath);

            response.data.pipe(writer);

            writer.on('finish', async () => {
                // Send the PDF via WhatsApp (Twilio example)
                await sendPdfViaWhatsApp(sender, pdfPath);
                res.send('PDF sent!');
            });

            writer.on('error', () => {
                res.status(500).send('Error retrieving PDF');
            });

        } catch (error) {
            console.error('Error retrieving PDF:', error);
            res.status(500).send('Error retrieving PDF');
        }
    } else {
        res.send('No action taken');
    }
});

async function sendPdfViaWhatsApp(recipient, pdfPath) {
    // Example using Twilio's API to send a WhatsApp message with media
    const accountSid = process.env.accountSid;
    const authToken = process.env.authToken;
    const client = require('twilio')(accountSid, authToken);

    await client.messages
        .create({
            from: 'whatsapp:+14155238886',  // Twilio WhatsApp sandbox number
            to: recipient,
            body: 'Here is your document!',
            mediaUrl: `https://pdfdownloader-21zh.onrender.com/${path.basename(pdfPath)}`
        });

    console.log(`PDF sent to ${recipient}`);
}

app.listen(5000, () => {
    console.log('Public server running on port 5000');
});
