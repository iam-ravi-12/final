# Security Documentation

## Security Features

This application implements several security measures to protect user data and ensure secure communication:

### 1. Authentication & Authorization

- **JWT (JSON Web Token)** based authentication
- **BCrypt password hashing** with salt for secure password storage
- **Stateless sessions** - no session cookies, reducing attack surface
- **Bearer token authentication** in HTTP headers

### 2. Security Configuration

#### CSRF Protection
**Status:** Disabled (intentional)

**Rationale:**
- This is a stateless REST API designed for mobile (Android) client consumption
- Authentication uses JWT tokens in Authorization headers, not session cookies
- CSRF attacks target browser-based applications using cookie-based authentication
- For JWT-based APIs accessed by mobile apps, CSRF protection is not applicable

**Reference:** [OWASP on JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

#### Session Management
- **Stateless sessions** (SessionCreationPolicy.STATELESS)
- No server-side session storage
- Each request is authenticated independently via JWT

### 3. Password Security

- Passwords are hashed using BCrypt before storage
- Never stored in plain text
- Minimum password length: 6 characters (configurable via validation)

### 4. Configuration Security

**Environment Variables:**
All sensitive configuration values support environment variables:

```bash
DATABASE_URL       # Database connection string
DATABASE_USERNAME  # Database username
DATABASE_PASSWORD  # Database password
JWT_SECRET        # Secret key for JWT signing
JWT_EXPIRATION    # Token expiration time in milliseconds
```

**Best Practices:**
- Never commit sensitive values to version control
- Use environment-specific configuration
- Rotate JWT secrets periodically in production
- Use strong, randomly generated JWT secrets (at least 256 bits)

### 5. API Security

**Public Endpoints:**
- `/api/auth/signup` - User registration
- `/api/auth/login` - User authentication

**Protected Endpoints:**
All other endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### 6. Input Validation

- Request DTOs use Jakarta Validation annotations
- Email format validation
- Username and password length validation
- Content validation for posts

### 7. SQL Injection Prevention

- Uses Spring Data JPA with parameterized queries
- ORM (Hibernate) handles query parameterization
- No raw SQL queries with string concatenation

## Security Recommendations for Production

### 1. JWT Configuration
```bash
# Generate a strong secret (256-bit minimum)
openssl rand -base64 64
export JWT_SECRET=<generated_secret>
```

### 2. Database Security
- Use strong database passwords
- Restrict database access to application server only
- Enable SSL/TLS for database connections
- Regular database backups with encryption

### 3. HTTPS/TLS
- **Always use HTTPS in production**
- Configure SSL certificates
- Redirect HTTP to HTTPS
- Enable HSTS (HTTP Strict Transport Security)

### 4. CORS Configuration
Current configuration allows all origins (`*`):
```java
@CrossOrigin(origins = "*", maxAge = 3600)
```

**Production Recommendation:**
```java
@CrossOrigin(origins = "https://your-android-app-domain.com", maxAge = 3600)
```

### 5. Rate Limiting
Consider implementing rate limiting to prevent:
- Brute force attacks on login
- API abuse
- DDoS attacks

### 6. Logging & Monitoring
- Log authentication failures
- Monitor for suspicious patterns
- Set up alerts for unusual activity
- Don't log sensitive data (passwords, tokens)

### 7. Token Expiration
- Current default: 24 hours (86400000 ms)
- Consider shorter expiration for sensitive operations
- Implement refresh token mechanism for better UX

### 8. Error Messages
- Don't expose sensitive information in error messages
- Use generic messages for authentication failures
- Log detailed errors server-side only

## CodeQL Security Scan Results

### Findings

**Alert:** CSRF protection disabled
- **Status:** Acknowledged - Not applicable for JWT-based REST API
- **Location:** SecurityConfig.java
- **Justification:** See "CSRF Protection" section above

## Compliance Notes

This implementation follows:
- OWASP Top 10 security guidelines
- Spring Security best practices
- JWT security recommendations
- REST API security standards

## Security Audit Checklist

- [x] Password hashing with BCrypt
- [x] JWT token authentication
- [x] Stateless session management
- [x] Input validation
- [x] SQL injection prevention (JPA)
- [x] Environment variable support for secrets
- [x] Constructor injection (better for testing)
- [ ] HTTPS enforcement (deployment configuration)
- [ ] Rate limiting (to be implemented)
- [ ] Refresh token mechanism (future enhancement)
- [ ] CORS restriction (configure for production)

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourcompany.com. Do not create public GitHub issues for security vulnerabilities.
