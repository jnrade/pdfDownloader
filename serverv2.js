const express = require('express');
const localtunnel = require('localtunnel');

const app = express();

// Your server logic here
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Serve your PDF file
app.get('/download', (req, res) => {
  const filePath = 'C:/Users/Junior%20De%20Jonge/Desktop/samplePdfPath/samplePdf.pdf'; // Update to your file path
  res.download(filePath, (err) => {
    if (err) {
      console.error('File download error:', err);
      res.status(500).send('Error downloading file.');
    }
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  // Start localtunnel
  (async () => {
    const tunnel = await localtunnel({ port: port });

    // the assigned public URL for your tunnel
    console.log(`Tunnel URL: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  })();
});
