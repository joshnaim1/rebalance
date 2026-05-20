# Contributing to ReBalance

Thanks for helping improve ReBalance. This project is a React/Vite dashboard for a pressure-sensitive balance board, with a strong focus on local-first data handling, accessibility, and objective rehab feedback.

## Getting started

1. Fork or clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local Vite URL in Chrome or Edge.
5. Use demo mode if you do not have the balance board hardware available.

## Development workflow

- Create a focused branch for each fix or feature.
- Keep changes scoped to the problem you are solving.
- Prefer small pull requests that are easy to review.
- Match the existing React component, hook, utility, and CSS patterns.
- Update documentation when behavior, setup steps, hardware assumptions, or data handling changes.

## Quality checks

Run these before opening a pull request:

```bash
npm run lint
npm run test
npm run build
```

If a check cannot be run, explain why in the pull request.

## App guidelines

- Preserve the local-first model. Do not add backend, cloud, WiFi, Bluetooth, or persistent external storage requirements without discussing the tradeoff first.
- Keep patient and session data private by default.
- Treat AI features as optional and make any external data flow explicit to the user.
- Keep demo mode working for reviewers and contributors without hardware.
- Avoid using personal health information in fixtures, screenshots, logs, or examples.

## Hardware and serial contributions

When changing board integration or serial parsing:

- Document the expected serial protocol.
- Keep simulated/demo data aligned with real sensor behavior.
- Validate malformed or incomplete serial input safely.
- Note any required firmware, baud rate, browser, or hardware changes.

## Accessibility

ReBalance is intended for rehab contexts, so accessibility changes matter. Preserve keyboard access, readable contrast, reduced-motion support, and clear feedback for loading, empty, and error states.

## Pull request checklist

Before requesting review, confirm that:

- The change has a clear purpose.
- Relevant tests were added or updated.
- `npm run lint`, `npm run test`, and `npm run build` pass where applicable.
- Documentation was updated where needed.
- No secrets, API keys, private health data, or generated build artifacts were committed unintentionally.

## Security

Please report suspected vulnerabilities privately. See [SECURITY.md](SECURITY.md) for the security policy.
