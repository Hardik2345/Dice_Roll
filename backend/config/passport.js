const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Admin = require('../models/Admin');

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const admin = await Admin.findOne({ username });
      if (!admin) return done(null, false, { message: 'Invalid username' });
      const match = await admin.comparePassword(password);
      if (!match) return done(null, false, { message: 'Invalid password' });
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      return done(null, admin);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((admin, done) => {
  done(null, admin._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id);
    done(null, admin);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
