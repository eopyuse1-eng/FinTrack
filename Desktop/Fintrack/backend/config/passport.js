/**
 * Passport Google OAuth 2.0 Configuration
 * Setup for production deployment
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models/User');

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value?.toLowerCase();
        
        if (!email) {
          return done(null, false, { message: 'No email from Google profile' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
          // User exists - update with Google ID and mark email as verified
          user.googleId = profile.id;
          user.isEmailVerified = true;
          await user.save();
          return done(null, user);
        }

        // User doesn't exist - create new user (with isEmailVerified = true)
        // Only if email matches company domain or is demo email
        const validDomains = ['company.com', 'fintrack.com', 'example.com'];
        const isValidEmail = validDomains.some(domain => email.endsWith(domain));

        if (!isValidEmail) {
          return done(null, false, { 
            message: 'Email domain not authorized. Please use company email.' 
          });
        }

        // Auto-create new user with verified email
        user = new User({
          firstName: profile.name?.givenName || 'First',
          lastName: profile.name?.familyName || 'Last',
          email,
          googleId: profile.id,
          isEmailVerified: true, // Gmail verification counts as verification
          role: 'employee', // Default role for new Gmail users
          department: 'marketing', // Default department
          password: 'oauth-user', // OAuth users don't use password initially
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
