# Security Features Documentation

This document outlines the comprehensive security features implemented in the Sports Companion Backend API.

## Overview

The Sports Companion API implements enterprise-grade security features including multiple authentication methods, comprehensive audit logging, and advanced security monitoring.

## Authentication Methods

### 1. JWT Authentication

- **Access Tokens**: Short-lived tokens for API access (7 days default)
- **Refresh Tokens**: Long-lived tokens for token renewal (30 days default)
- **Token Rotation**: Automatic token refresh with blacklisting
- **Session Management**: Concurrent session control with device tracking

### 2. OAuth 2.0 / SSO Integration

Supported providers:

- **Google OAuth 2.0**
- **GitHub OAuth 2.0**
- **Facebook OAuth 2.0**

Features:

- Automatic user creation and account linking
- Email verification from trusted providers
- Social account management

### 3. API Key Authentication

- **Service-to-Service Authentication**: Secure API keys for automated systems
- **Rate Limiting**: Configurable per-key limits
- **IP Restrictions**: Whitelist allowed IP addresses
- **Permission System**: Granular access control
- **Usage Monitoring**: Track API key usage and statistics

### 4. Multi-Factor Authentication (MFA)

- **TOTP Support**: Time-based One-Time Passwords using authenticator apps
- **Backup Codes**: 8 single-use recovery codes
- **QR Code Generation**: Easy setup with authenticator apps
- **Flexible Verification**: Support for both TOTP and backup codes

## Security Features

### Account Security

- **Password Strength Validation**: Comprehensive password policy
- **Account Lockout**: Protection against brute force attacks (5 attempts, 30min lockout)
- **Device Fingerprinting**: Track login devices and browsers
- **IP Whitelisting**: Restrict access by IP address
- **Email Verification**: Secure email verification workflow

### Audit Logging

Comprehensive security event logging for:

- Authentication events (login, logout, failures)
- MFA events (setup, usage, failures)
- OAuth events (social login, account linking)
- API key events (creation, usage, rate limiting)
- Security events (settings changes, violations)
- Admin events (user management, permissions)

### Security Monitoring

- **Real-time Dashboard**: Security metrics and alerts

- **Event Analytics**: Trends and patterns analysis
- **Alert System**: Configurable security notifications
- **Threat Detection**: Suspicious activity monitoring

## API Endpoints

### Authentication

```http
POST /auth/register          # User registration
POST /auth/login             # User login
POST /auth/logout            # User logout
POST /auth/refresh           # Token refresh
POST /auth/change-password   # Change password
POST /auth/forgot-password   # Request password reset
POST /auth/reset-password    # Reset password with token
```

### OAuth/SSO

```http
GET  /auth/google            # Google OAuth initiation
GET  /auth/google/callback   # Google OAuth callback
GET  /auth/github           # GitHub OAuth initiation
GET  /auth/github/callback  # GitHub OAuth callback
GET  /auth/facebook         # Facebook OAuth initiation
GET  /auth/facebook/callback # Facebook OAuth callback
```

### Multi-Factor Authentication

```http
POST /auth/mfa/setup         # Setup MFA
POST /auth/mfa/verify        # Verify and enable MFA
POST /auth/mfa/disable       # Disable MFA
POST /auth/verify-mfa        # Verify MFA during login
```

### Email Verification

```http
POST /auth/send-verification    # Send verification email
POST /auth/verify-email         # Verify email with token
POST /auth/resend-verification  # Resend verification email
```

### Security Management

```http
GET  /auth/security          # Get security settings
PATCH /auth/security         # Update security settings
POST /auth/social/link       # Link social account
POST /auth/social/unlink     # Unlink social account
```

### API Key Management

```http
POST   /api-keys             # Create API key
GET    /api-keys             # List API keys
GET    /api-keys/:id         # Get API key details
PATCH  /api-keys/:id         # Update API key
DELETE /api-keys/:id         # Delete API key
POST   /api-keys/:id/regenerate # Regenerate API key
GET    /api-keys/stats       # Get usage statistics
```

### Security Dashboard

```http
GET /security/dashboard      # Security dashboard data
GET /security/audit-logs     # Audit logs with filtering
GET /security/metrics        # Security metrics and analytics
GET /security/alerts         # Recent security alerts
POST /security/alerts/:id/acknowledge # Acknowledge alert
```

## Configuration

### Environment Variables

#### JWT Configuration

```bash
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

#### OAuth Configuration

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

#### MFA Configuration

```bash
MFA_ISSUER=SportsCaster
```

#### Security Configuration

```bash
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Best Practices

### For Developers

1. **Never log sensitive data** (passwords, tokens, personal info)
2. **Use parameterized queries** to prevent SQL injection
3. **Validate all inputs** on both client and server
4. **Implement proper error handling** without exposing internals
5. **Keep dependencies updated** and monitor for vulnerabilities
6. **Use HTTPS everywhere** in production
7. **Implement proper session management**
8. **Follow the principle of least privilege**

### For Deployment

1. **Use environment variables** for sensitive configuration
2. **Enable audit logging** in production
3. **Monitor security metrics** regularly
4. **Set up security alerts** for critical events
5. **Implement proper backup strategies**
6. **Use secure communication** between services
7. **Regular security updates** and patches
8. **Implement proper firewall rules**

### For Users

1. **Enable MFA** on all accounts
2. **Use strong, unique passwords**
3. **Regularly review security settings**
4. **Monitor account activity**
5. **Report suspicious activity**
6. **Keep recovery codes secure**
7. **Use trusted devices and networks**
8. **Regularly update credentials**

## Monitoring and Alerting

### Security Metrics Tracked

- Failed login attempts and patterns
- MFA usage and bypass attempts  
- API key usage and rate limiting
- Suspicious IP activity
- Account lockouts and security violations
- OAuth authentication patterns
- Password reset requests
- Session anomalies

### Alert Conditions

- **Critical**: Multiple failed logins from same IP
- **High**: Account lockout triggered
- **High**: MFA disabled without proper verification
- **Medium**: New device/location login
- **Medium**: API key rate limit exceeded
- **Low**: Successful login from new IP

### Dashboard Features

- Real-time security event stream
- Geographic login distribution
- Authentication method breakdown
- Failed login attempt analytics
- API key usage statistics
- Security trend analysis

## Compliance and Auditing

### Audit Trail

Every security-related action is logged with:

- User identification
- Action performed
- Timestamp and duration
- IP address and user agent
- Success/failure status
- Relevant metadata

### Data Retention

- Audit logs: 2 years (configurable)
- Security events: Indefinite for critical events
- Session data: 30 days after expiration
- Failed login attempts: 90 days

### Compliance Features

- **GDPR Support**: User data export and deletion
- **Audit Requirements**: Comprehensive logging
- **Access Controls**: Role-based permissions
- **Data Protection**: Encryption at rest and in transit
- **Privacy Controls**: User consent management

## Troubleshooting

### Common Issues

#### Authentication Failures

```bash
# Check user account status
GET /auth/security

# Review recent audit logs
GET /security/audit-logs?action=login_failed&startDate=2024-01-01

# Check account lockout status
GET /security/audit-logs?action=account_locked
```

#### MFA Issues

```bash
# Verify MFA configuration
GET /auth/security

# Check MFA event history
GET /security/audit-logs?resource=mfa

# Generate new backup codes (requires admin)
POST /auth/mfa/setup
```

#### API Key Problems

```bash
# Check API key status
GET /api-keys/:keyId

# Review API key usage
GET /api-keys/stats

# Check rate limiting events
GET /security/audit-logs?action=api_key_rate_limited
```

### Security Incident Response

1. **Identify**: Monitor alerts and unusual patterns
2. **Contain**: Disable compromised accounts/keys immediately
3. **Investigate**: Review audit logs and security events
4. **Recover**: Reset credentials and restore access
5. **Learn**: Update security policies and procedures

## Support

For security-related questions or to report vulnerabilities:

- Email: [security@sportification.app](mailto:security@sportification.app)
- Documentation: `/api/v1/docs`
- Security Dashboard: `/api/v1/security/dashboard`

---

**Note**: This is a living document that should be updated as security features evolve.