const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Path to the PDF file on your desktop
const fileName = 'samplePdf.pdf';
const filePath = path.join('C:', 'Users', 'Junior De Jonge', 'Desktop', 'samplePdfPath', fileName); // Adjust this to your actual path
const destinationDir = path.join(__dirname, 'pdfs'); // Destination directory for storing a copy of the PDF

// Ensure the destination directory exists
if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir);
}

app.get('/'), (req, res) => {
    res.status(200).send('Not Authorized')
}

// Route to download the PDF file
app.get('/download', (req, res) => {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Copy the file to the "pdfs" directory first
        const destinationPath = path.join(destinationDir, fileName);
        fs.copyFile(filePath, destinationPath, (err) => {
            if (err) {
                console.error("Error copying file:", err);
                return res.status(500).send('File copy failed.');
            }

            // If file copy is successful, proceed with download
            res.download(filePath, (err) => {
                if (err) {
                    console.error("Error during file download:", err);
                    res.status(500).send('File download failed.');
                } else {
                    console.log('File download successful.');
                }
            });
        }); 
    } else {
        // File does not exist, return an error
        console.error('File not found.');
        res.status(404).send('File not found.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
