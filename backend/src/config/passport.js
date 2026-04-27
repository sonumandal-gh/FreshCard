const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  async function(accessToken, refreshToken, profile, cb) {
      try {
          // 1. Pehle googleId se search karein
          let user = await User.findOne({ googleId: profile.id });
          
          if (!user) {
              // 2. Agar googleId nahi mila, toh email se search karein
              const email = profile.emails[0].value;
              user = await User.findOne({ email: email });

              if (user) {
                  // 3. Agar email mil gayi, toh googleId update kar dein (Account Linking)
                  user.googleId = profile.id;
                  await user.save({ validateBeforeSave: false });
              } else {
                  // 4. Agar kuch bhi nahi mila, toh naya user banayein
                  user = await User.create({
                      name: profile.displayName,
                      email: email,
                      googleId: profile.id,
                      role: 'user'
                  });
              }
          }
          return cb(null, user);
      } catch (error) {
          return cb(error, null);
      }
  }
));

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(async function(id, done){
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
