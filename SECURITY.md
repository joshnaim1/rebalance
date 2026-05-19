# Security Policy

## Supported versions

ReBalance is a hackathon prototype. Security fixes are applied to the current `main` branch.

## Reporting a vulnerability

Please report suspected security issues privately instead of opening a public issue.

Email the maintainers with:

- A short description of the issue
- Steps to reproduce it
- Any affected browser, operating system, or hardware details
- The impact you believe the issue could have

We will review reports as soon as practical and follow up if we need more detail.

## Data and privacy expectations

ReBalance is designed to run without a backend. Session history, profile information, calibration values, and preferences are stored locally in the browser unless the app explicitly sends data to an external service.

Do not include sensitive personal health information in bug reports, screenshots, logs, or sample data unless it has been removed or anonymized.

## Secrets

Do not commit API keys, credentials, tokens, or private configuration files. If a secret is accidentally committed, revoke it immediately and rotate any affected credentials.

## Scope

Security reports are most useful when they relate to:

- Browser-side handling of patient/session data
- Web Serial device access and input validation
- Unsafe dependency behavior
- Accidental exposure of API keys or sensitive configuration
- Cross-site scripting or injection risks in the React app

Out-of-scope reports include denial-of-service attacks against local development servers, social engineering, and issues requiring physical access to a user's unlocked machine unless they expose a broader application flaw.
