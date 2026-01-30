/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Custom server for Next.js - Optimized for cPanel/Node.js deployment
 * 
 * Usage:
 * - Development: npm run dev (uses Next.js built-in server)
 * - Production: NODE_ENV=production node server.js
 * 
 * For cPanel:
 * 1. Build the app: npm run build
 * 2. Set up Node.js application in cPanel
 * 3. Point application root to this server.js
 * 4. Set NODE_ENV=production in environment variables
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");

// Configuration
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

// Initialize Next.js app
const app = next({ 
  dev,
  hostname,
  port,
  // For standalone builds, set the directory
  dir: process.cwd(),
});

const handle = app.getRequestHandler();

// Graceful shutdown handling
let server;
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
    });
  }
  
  // Give existing requests time to complete (30 seconds)
  const forceShutdownTimeout = setTimeout(() => {
    console.log('Forcing shutdown...');
    process.exit(1);
  }, 30000);
  
  // Close the Next.js app
  try {
    await app.close();
    console.log('Next.js app closed.');
  } catch (err) {
    console.error('Error closing Next.js app:', err);
  }
  
  clearTimeout(forceShutdownTimeout);
  console.log('Graceful shutdown completed.');
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.prepare().then(() => {
  server = createServer((req, res) => {
    // Don't process requests during shutdown
    if (shuttingDown) {
      res.statusCode = 503;
      res.setHeader('Connection', 'close');
      res.end('Server is shutting down');
      return;
    }
    
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);
      
      // Handle health check endpoint
      if (parsedUrl.pathname === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          env: process.env.NODE_ENV || 'development'
        }));
        return;
      }
      
      // Let Next.js handle all other requests
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please choose a different port.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
  
  // Start listening
  server.listen(port, hostname, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ArthaVidhi Server                          ║
╠════════════════════════════════════════════════════════════════╣
║  Status:      Running                                          ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(47)}║
║  URL:         http://${hostname}:${port}${' '.repeat(Math.max(0, 37 - hostname.length - String(port).length))}║
║  Health:      http://${hostname}:${port}/api/health${' '.repeat(Math.max(0, 26 - hostname.length - String(port).length))}║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});