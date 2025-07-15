import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Add event listeners to debug session store
  sessionStore.on('connect', () => {
    console.log('Session store connected');
  });
  
  sessionStore.on('disconnect', () => {
    console.log('Session store disconnected');
  });
  
  sessionStore.on('error', (err) => {
    console.error('Session store error:', err);
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Simple logout route for local development
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  
  // Check for admin session authentication
  if (session.adminAuthenticated && session.userId) {
    // Admin is authenticated via session
    const { storage } = await import('./storage');
    try {
      const adminUser = await storage.getUser(session.userId);
      if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'team_member')) {
        // Create a user object compatible with existing code
        req.user = {
          ...adminUser,
          claims: { sub: adminUser.id },
          access_token: 'admin_session',
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };
        return next();
      }
    } catch (error) {
      console.error('Error verifying admin user:', error);
    }
  }
  
  // Check for regular passport authentication
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle local auth users (they have access_token === 'local_session')
  if (user.access_token === 'local_session') {
    return next();
  }

  // For other authentication methods, just pass through
  next();
};
