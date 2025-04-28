const helmet = require('helmet');
const config = require('../config/app');

/**
 * Extended helmet security configuration
 * Provides security headers with customized settings
 */
const securityMiddleware = (app) => {
  // Basic helmet configuration
  app.use(helmet());
  
  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
        imgSrc: ["'self'", 'data:', 'blob:'], // Allow data URIs and blobs for images
        connectSrc: ["'self'"], // Allow API calls to same origin
        fontSrc: ["'self'", 'data:'], // Allow data URIs for fonts
        objectSrc: ["'none'"], // Block <object>, <embed>, and <applet>
        mediaSrc: ["'self'"], // Allow media from same origin
        frameSrc: ["'none'"], // Block <frame> and <iframe>
        upgradeInsecureRequests: [], // Auto-upgrade HTTP to HTTPS
      },
    })
  );
  
  // Strict Transport Security
  // Force HTTPS in production
  if (config.server.env === 'production') {
    app.use(
      helmet.hsts({
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true, // Include subdomains
        preload: true, // Ready for preload list
      })
    );
  }
  
  // X-Frame-Options
  app.use(
    helmet.frameguard({
      action: 'deny', // Prevent all framing
    })
  );
  
  // X-Content-Type-Options
  app.use(helmet.noSniff());
  
  // X-XSS-Protection
  app.use(helmet.xssFilter());
  
  // Referrer Policy
  app.use(
    helmet.referrerPolicy({
      policy: 'same-origin',
    })
  );
  
  // Feature Policy
  app.use(
    helmet.permittedCrossDomainPolicies({
      permittedPolicies: 'none',
    })
  );
  
  // Remove X-Powered-By header
  app.disable('x-powered-by');
  
  return app;
};

module.exports = securityMiddleware;
