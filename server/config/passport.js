// @ts-nocheck
/**
 * Passport.js Configuration for Multiple SSO Providers
 * Supports Azure AD, Google OAuth, SAML, and local authentication
 */
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as AzureAdOAuth2Strategy } from 'passport-azure-ad-oauth2';
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { Logger } from '../services/logger.js';

const logger = new Logger();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export class PassportConfig {
  static initialize() {
    // Serialize/deserialize user for session management
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await db.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    // JWT Strategy for API authentication
    passport.use(new JwtStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
      issuer: 'poleplanpro.com',
      audience: 'poleplanpro-api'
    }, async (payload, done) => {
      try {
        const user = await db.getUserById(payload.sub);
        if (user && user.is_active) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }));

    // Local Strategy for email/password authentication
    passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await db.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.is_active) {
          return done(null, false, { message: 'Account is deactivated' });
        }

        if (!user.password_hash) {
          return done(null, false, { message: 'Please use SSO to sign in' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Update last login
        await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        
        return done(null, user);
      } catch (error) {
        logger.error('Local authentication error:', error);
        return done(error);
      }
    }));

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await db.query(
            'SELECT * FROM users WHERE google_id = $1 OR email = $2',
            [profile.id, profile.emails[0].value]
          );

          if (user.rows.length > 0) {
            user = user.rows[0];
            // Update Google ID if not set
            if (!user.google_id) {
              await db.query(
                'UPDATE users SET google_id = $1, last_login_at = NOW() WHERE id = $2',
                [profile.id, user.id]
              );
            } else {
              await db.query(
                'UPDATE users SET last_login_at = NOW() WHERE id = $1',
                [user.id]
              );
            }
          } else {
            // Create new user
            const userData = {
              email: profile.emails[0].value,
              google_id: profile.id,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              email_verified: true,
              role: 'user'
            };
            
            user = await db.createUser(userData);
          }

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error);
        }
      }));
    }

    // GitHub OAuth Strategy
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: '/auth/github/callback',
            scope: ['user:email'],
          },
          async (accessToken, refreshToken, profile, done) => {
            try {
              // GitHub may not provide email in profile, get from emails array
              const email =
                profile.emails && profile.emails.length > 0
                  ? profile.emails[0].value
                  : null;

              if (!email) {
                return done(
                  new Error('GitHub account must have a verified email address')
                );
              }

              let user = await db.query(
                'SELECT * FROM users WHERE github_id = $1 OR email = $2',
                [profile.id, email]
              );

              if (user.rows.length > 0) {
                user = user.rows[0];
                // Update GitHub ID if not set
                if (!user.github_id) {
                  await db.query(
                    'UPDATE users SET github_id = $1, last_login_at = NOW() WHERE id = $2',
                    [profile.id, user.id]
                  );
                } else {
                  await db.query(
                    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
                    [user.id]
                  );
                }
              } else {
                // Create new user
                const userData = {
                  email: email,
                  github_id: profile.id,
                  first_name: profile.displayName
                    ? profile.displayName.split(' ')[0]
                    : profile.username,
                  last_name: profile.displayName
                    ? profile.displayName.split(' ').slice(1).join(' ')
                    : '',
                  email_verified: true,
                  role: 'user',
                };

                user = await db.createUser(userData);
              }

              return done(null, user);
            } catch (error) {
              logger.error('GitHub OAuth error:', error);
              return done(error);
            }
          }
        )
      );
    }

    // Azure AD OAuth Strategy
    if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
      passport.use(new AzureAdOAuth2Strategy({
        clientID: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        callbackURL: "/auth/azure/callback",
        tenant: process.env.AZURE_TENANT_ID || 'common'
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await db.query(
            'SELECT * FROM users WHERE azure_id = $1 OR email = $2',
            [profile.oid, profile.upn || profile.email]
          );

          if (user.rows.length > 0) {
            user = user.rows[0];
            // Update Azure ID if not set
            if (!user.azure_id) {
              await db.query(
                'UPDATE users SET azure_id = $1, last_login_at = NOW() WHERE id = $2',
                [profile.oid, user.id]
              );
            } else {
              await db.query(
                'UPDATE users SET last_login_at = NOW() WHERE id = $1',
                [user.id]
              );
            }
          } else {
            // Create new user
            const userData = {
              email: profile.upn || profile.email,
              azure_id: profile.oid,
              first_name: profile.given_name,
              last_name: profile.family_name,
              email_verified: true,
              role: 'user'
            };
            
            user = await db.createUser(userData);
          }

          return done(null, user);
        } catch (error) {
          logger.error('Azure AD OAuth error:', error);
          return done(error);
        }
      }));
    }

    // SAML Strategy
    if (process.env.SAML_ENTRY_POINT && process.env.SAML_CERT) {
      passport.use(new SamlStrategy({
        entryPoint: process.env.SAML_ENTRY_POINT,
        issuer: process.env.SAML_ISSUER || 'poleplanpro.com',
        callbackUrl: process.env.SAML_CALLBACK_URL || '/auth/saml/callback',
        cert: process.env.SAML_CERT,
        acceptedClockSkewMs: 60000
      }, async (profile, done) => {
        try {
          const samlId = profile.nameID || profile['urn:oid:0.9.2342.19200300.100.1.1'];
          const email = profile.email || profile['urn:oid:1.2.840.113549.1.9.1'];
          
          let user = await db.query(
            'SELECT * FROM users WHERE saml_id = $1 OR email = $2',
            [samlId, email]
          );

          if (user.rows.length > 0) {
            user = user.rows[0];
            if (!user.saml_id) {
              await db.query(
                'UPDATE users SET saml_id = $1, last_login_at = NOW() WHERE id = $2',
                [samlId, user.id]
              );
            } else {
              await db.query(
                'UPDATE users SET last_login_at = NOW() WHERE id = $1',
                [user.id]
              );
            }
          } else {
            // Create new user
            const userData = {
              email: email,
              saml_id: samlId,
              first_name: profile.firstName || profile['urn:oid:2.5.4.42'] || 'Unknown',
              last_name: profile.lastName || profile['urn:oid:2.5.4.4'] || 'User',
              email_verified: true,
              role: 'user'
            };
            
            user = await db.createUser(userData);
          }

          return done(null, user);
        } catch (error) {
          logger.error('SAML authentication error:', error);
          return done(error);
        }
      }));
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      iss: 'poleplanpro.com',
      aud: 'poleplanpro-api'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken() {
    return jwt.sign(
      { type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' }
    );
  }
}