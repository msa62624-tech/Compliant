# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the Compliant Insurance Tracking Platform seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** Disclose Publicly

Please **do not** create a public GitHub issue for security vulnerabilities. This could put all users at risk.

### 2. Report Privately

Send a detailed report to: **security@yourdomain.com** (update with your organization's security contact email)

Include in your report:
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Affected versions** (if known)
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 5 business days
- **Fix Timeline**: 
  - Critical vulnerabilities: 7 days
  - High severity: 14 days
  - Medium severity: 30 days
  - Low severity: 60 days

### 4. Disclosure Policy

- We will acknowledge your report within 48 hours
- We will provide regular updates on our progress
- We will notify you when the vulnerability is fixed
- We will publicly disclose the vulnerability after a fix is released (with your permission, we'll credit you)

## Security Features

### Authentication & Authorization
- ✅ JWT-based authentication with refresh tokens
- ✅ Secure token storage (selector/verifier pattern)
- ✅ Password hashing with bcrypt (10+ rounds)
- ✅ Role-based access control (RBAC)
- ✅ Session expiration and automatic refresh
- ✅ Rate limiting on authentication endpoints

### Data Protection
- ✅ Field-level encryption for sensitive data
- ✅ Database connections over SSL/TLS
- ✅ Encrypted data at rest
- ✅ Secure file upload handling
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (DOMPurify)

### Infrastructure Security
- ✅ CORS configuration
- ✅ Security headers (Helmet.js)
- ✅ Rate limiting and DDoS protection
- ✅ Comprehensive audit logging
- ✅ Docker security best practices
- ✅ Multi-stage builds (secret prevention)

### Continuous Security
- ✅ Automated dependency scanning (npm audit)
- ✅ CodeQL static analysis (weekly)
- ✅ Container vulnerability scanning (Trivy)
- ✅ SAST with Semgrep (OWASP Top 10)
- ✅ Secret scanning in code and containers
- ✅ SBOM generation for compliance

## Security Best Practices for Contributors

### Code Security
1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Server-side validation is mandatory
3. **Use parameterized queries** - Prevent SQL injection (Prisma does this)
4. **Sanitize user content** - Prevent XSS attacks
5. **Follow principle of least privilege** - Minimal permissions required
6. **Keep dependencies updated** - Run `npm audit` regularly

### Secrets Management
- Store secrets in `.env` files (never commit)
- Use strong, randomly generated secrets (32+ characters)
- Rotate secrets regularly (90-day recommended)
- Use separate secrets for each environment
- Use secret management services (AWS Secrets Manager, Vault)

### Code Review Requirements
- All PRs must pass security scans
- Critical endpoints require security review
- Authentication/authorization changes need approval
- Dependency updates must pass vulnerability checks

## Vulnerability Scanning

### Running Security Scans Locally

```bash
# Dependency vulnerabilities
npm audit
npm audit fix

# Code security analysis (if CodeQL CLI installed)
codeql database create compliant-db --language=javascript
codeql database analyze compliant-db --format=sarif-latest --output=results.sarif

# Container security (if you have Docker)
docker build -t compliant:test .
trivy image compliant:test
```

### Automated Scans
Our CI/CD pipeline automatically runs:
- **CodeQL**: Weekly and on security-sensitive changes
- **Dependency Scan**: On every push and PR
- **Container Scan**: On every push and PR
- **Semgrep**: Weekly SAST scanning
- **Secret Detection**: On every commit

## Security Contacts

- **Security Team**: security@yourdomain.com (update with your organization's security email)
- **General Support**: support@yourdomain.com (update with your organization's support email)

## Security Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:
- (List will be maintained as reports are received)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: January 2026  
**Version**: 1.0.0
