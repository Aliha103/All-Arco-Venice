import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import type { Express } from 'express';

export function setupGoogleAuth(app: Express) {
  console.log('🔧 Setting up Google OAuth strategy...');
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not provided');
  }
  
  // Configure Google OAuth strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile);
      
      // Extract user information from Google profile
      const googleUser = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        profileImageUrl: profile.photos?.[0]?.value || '',
        provider: 'google',
        providerId: profile.id,
        displayName: profile.displayName || ''
      };

      // Check if user already exists
      let user = await storage.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          profileImageUrl: googleUser.profileImageUrl,
          provider: 'google',
          providerId: googleUser.id,
          password: '', // No password needed for OAuth users
          role: 'guest' // Default role
        });
        console.log('Created new Google user:', user);
      } else {
        // Update existing user with Google profile info
        await storage.updateUser(user.id, {
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          profileImageUrl: googleUser.profileImageUrl,
          authProvider: 'google',
          providerId: googleUser.id,
          updatedAt: new Date()
        });
        console.log('Updated existing user with Google profile:', user);
      }

      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('🚀 Initiating Google OAuth...');
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })(req, res, next);
  });

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login?error=google_auth_failed' 
    }),
    async (req, res) => {
      try {
        // User successfully authenticated with Google
        const user = req.user as any;
        console.log('Google OAuth success for user:', user);
        
        // Set up session
        const session = req.session as any;
        session.userId = user.id;
        session.user = user;
        session.isAuthenticated = true;
        
        // Redirect to dashboard or home page
        res.redirect('/?google_auth=success');
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/login?error=callback_error');
      }
    }
  );

  // Google OAuth logout
  app.get('/api/auth/google/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Google logout error:', err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/login?logged_out=true');
      });
    });
  });
}
