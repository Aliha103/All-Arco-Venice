import express, { type Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

// Load environment variables
dotenv.config();

// Debug environment variables











const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://code-glimpse-3.preview.emergentagent.com',
    /\.preview\.emergentagent\.com$/,
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🚀 Starting server setup...');
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    // Log WebSocket connection attempts
    server.on('upgrade', (req, socket, head) => {
      console.log('🔌 WebSocket upgrade request received');
    });

    app.use((req: Request, res: Response, next: NextFunction) => {

      next();
    });
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      // Don't throw the error - just log it
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    console.log('🔧 Setting up Vite for development...');
    if (app.get("env") === "development") {
      await setupVite(app, server);
      console.log('✅ Vite setup completed');
    } else {
      serveStatic(app);
      console.log('✅ Static files setup completed');
    }

    // Serve the app on port 3000 for local development
    // this serves both the API and the client.
    const port = process.env.PORT || 3000;
    console.log(`🚀 About to start server on port ${port}`);
    
    server.on('error', (err: Error) => {
      console.error('Server error:', err);
      if (err.message.includes('EADDRINUSE')) {
        console.error('Port already in use');
      }
      process.exit(1);
    });

    server.on('listening', () => {
      console.log(`✅ Server successfully bound to port ${port}`);
      console.log(`🌐 Visit http://localhost:${port} to access the application`);
    });

    console.log(`🔌 Calling server.listen(${port})...`);
    server.listen(port);
    console.log(`🔌 server.listen() called`);
    
    // Add a small delay to see if the server actually starts
    setTimeout(() => {
      console.log(`🔍 Checking if server is listening...`);
    }, 1000);
  } catch (error) {

    console.error('Server start error:', error);
    process.exit(1);
  }
})();
