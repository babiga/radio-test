const express = require('express');
const rtlSdr = require('rtl-sdr');

const app = express();
const PORT = process.env.PORT || 5000;

// Index of the RTL-SDR device
const DEVICE_INDEX = 0;

// FM radio frequency to tune to (e.g., 100.5 MHz)
const FREQUENCY = 102.5e6;

// Sample rate in Hz (2.4 MHz is common for RTL-SDR)
const SAMPLE_RATE = 2.4e6;

// Length of the buffer for reading samples
const BUFFER_LENGTH = 16384;

// Open RTL-SDR device
const dev = rtlSdr.open(DEVICE_INDEX);

// Set sample rate
rtlSdr.setSampleRate(dev, SAMPLE_RATE);

// Set center frequency
rtlSdr.setCenterFrequency(dev, FREQUENCY);

// Handle errors
rtlSdr.setAgcMode(dev, 0); // Disable automatic gain control

// Define route to stream captured data
app.get('/stream', (req, res) => {
    // Set content type to audio/mpeg
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Read samples from RTL-SDR device and pipe to response
    const buffer = Buffer.alloc(BUFFER_LENGTH);
    const readSamples = () => {
        rtlSdr.readSync(dev, buffer, BUFFER_LENGTH);
        res.write(buffer);
        setImmediate(readSamples); // Continue reading samples
    };

    // Start reading samples
    readSamples();

    // Handle client disconnect
    req.on('close', () => {
        res.end(); // End response when client disconnects
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Gracefully close RTL-SDR device when the process exits
process.on('exit', () => {
    rtlSdr.close(dev);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});
