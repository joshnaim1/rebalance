# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Accessibility & Clinical Objectivity

BalanceBack is designed to meet **WCAG 2.1 AA** compliance standards, ensuring the application is usable by patients with visual impairments, motor limitations, and cognitive differences.

### Key Accessibility Features

- **Multi-signal status indicators** — Selected states use three simultaneous signals (checkmark icon, bold text weight, stronger border) so that selection is never communicated by color alone.
- **WCAG contrast compliance** — All text meets minimum contrast ratios: 4.5:1 for normal text, 3:1 for non-text elements and large text. Status badges use dark text on bright backgrounds for readability.
- **Keyboard navigation** — All interactive elements have visible focus rings (3px solid, 2px offset). The balance game supports keyboard controls (arrow keys / A/D) as a fallback when no board is connected.
- **Screen reader support** — ARIA live regions announce dynamic state changes (connection status, session events). Role attributes, proper labels, and `aria-live` regions ensure assistive technology users receive equivalent information.
- **Reduced motion support** — The application respects the `prefers-reduced-motion` media query. When active, animations are simplified, game obstacle speed is reduced by 30%, and screen shake and floating popups are disabled.

### Clinical Objectivity Principle

BalanceBack collects only the data necessary for effective balance rehabilitation therapy. This approach maintains clinical objectivity and patient trust.

**What data IS collected:**

- Display name
- Pronouns (optional)
- Stroke/injury date
- Affected side
- Therapy goals
- Self-reported pain, fatigue, dizziness, and confidence levels
- Session balance data (scores, duration, time in balanced zone)

**What data is NOT collected:**

- Legal sex
- Gender marker
- Gender-affirming care history
- Unrelated medical history

**Why:** Collecting only clinically relevant data ensures that therapy recommendations and session notes remain objective and focused on rehabilitation outcomes. Excluding identity data that is not relevant to balance therapy prevents bias and maintains patient trust.

### Detailed Requirements

For comprehensive accessibility and clinical objectivity requirements, see the spec documents at `.kiro/specs/ui-accessibility-improvements/`.
