const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {

            try {

                const email = profile.emails[0].value;

                const username =
                    req.session.customUsername ||
                    email.split("@")[0];

                const bio =
                    req.session.customBio ||
                    "Neural link established.";

                const user = await prisma.user.upsert({
                    where: { googleId: profile.id },
                    update: {
                        name: profile.displayName,
                        avatar: profile.photos[0].value,
                        bio,
                        username
                    },
                    create: {
                        googleId: profile.id,
                        email,
                        username,
                        name: profile.displayName,
                        avatar: profile.photos[0].value,
                        bio
                    }
                });

                done(null, user);

            } catch (err) {
                done(err, null);
            }

        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;