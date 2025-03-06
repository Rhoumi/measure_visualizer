const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const OSC = require('osc');
const yargs = require('yargs');

// Parse CLI arguments
const argv = yargs
  .option('port', {
    alias: 'p',
    description: 'OSC listening port',
    default: 9123,
    type: 'number'
  })
  .option('host', {
    alias: 'h',
    description: 'OSC listening host',
    default: '127.0.0.1',
    type: 'string'
  })
  .option('webport', {
    alias: 'w',
    description: 'Webpage Port',
    default: 3000,
    type: 'number'
  })
  .help()
  .alias('help', 'help')
  .argv;

// Display startup banner
const banner = `
Measure Visualizer


`;

console.log(banner);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Create OSC UDP Port listener
const udpPort = new OSC.UDPPort({
  localAddress: argv.host,
  localPort: argv.port
});

// Error handling for UDP port
udpPort.on("error", (error) => {
  console.error(`OSC UDP Port Error: ${error.message}`);
});

// Listen for OSC messages specifically on /metronome
udpPort.on("message", (oscMsg) => {
  try {
    // Validate OSC message
    if (!oscMsg.address || oscMsg.address !== '/measure') {
      console.warn(`Ignored message with address: ${oscMsg.address}`);
      return;
    }

    // Validate arguments
    if (!Array.isArray(oscMsg.args)) {
      console.warn('Invalid OSC message: no arguments');
      return;
    }

    // Ensure exactly 3 integer arguments
    const validArgs = oscMsg.args.every(arg => Number.isInteger(arg));
    if (!validArgs || oscMsg.args.length !== 3) {
      console.warn(`Invalid arguments: ${JSON.stringify(oscMsg.args)}`);
      return;
    }

    console.log(`Received valid OSC message: ${JSON.stringify(oscMsg.args)}`);

    // Emit validated message
    io.emit('metronomeMessage', {
      beat: oscMsg.args[1],
      measure: oscMsg.args[0],
      frac: oscMsg.args[2]
    });
  } catch (err) {
    console.error(`Error processing OSC message: ${err.message}`);
  }
});

// Open the port
try {
  udpPort.open();
  console.log(`Listening for OSC messages on ${argv.host}:${argv.port}`);
} catch (err) {
  console.error(`Failed to open OSC port: ${err.message}`);
  process.exit(1);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Web client connected');
});

// Start the server
server.listen(argv.webport, () => {
  console.log(`Web server running: http://localhost:${argv.webport}`);
});

// Graceful shutdown (hopefully...)
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  udpPort.close();
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
