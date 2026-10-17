# Security Policy

## Supported project

Security reports are welcome for the CampusMate / Studora project.

## Report a vulnerability privately

Please do not publish exploitable security details in a public issue. Use GitHub's private vulnerability reporting feature if it is enabled for this repository. Otherwise, contact the repository owner privately through their GitHub profile: https://github.com/muhammedaseem12.

Include the affected page or API route, the impact, and clear reproduction steps. Do not include real users' personal data or credentials.

## Important security rules

- Never commit `.env` files, Supabase service-role keys, database passwords, Resend API keys, teacher-approval secrets, Firebase service-account JSON files, or other credentials.
- Browser code may use only the Supabase publishable/anon key. Service-role keys must stay server-side in Vercel environment variables.
- If a credential is accidentally committed, revoke/rotate it immediately. Deleting it from the latest commit does not remove it from Git history.
- Authorization must be enforced server-side and by Supabase Row Level Security policies; hiding buttons in the UI is not access control.
- Do not test against real users or data without permission.
