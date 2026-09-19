# Sahaara AI Helper

Design and build "Sahaara" — SH-105 Financial Empowerment Dashboard — as a warm, high-contrast, mobile-first React + Vite + Tailwind CSS single-page web app for financial education aimed at rural Indian women with low tech literacy.

This is the WEB DASHBOARD around a phone-call voice AI agent (Twilio/Exotel) for rural Indian women with low financial/tech literacy — you are not building the phone experience, only this dashboard.

DESIGN DIRECTION

- Light, warm, high-contrast palette: soft sage green as primary, warm off-white/cream background, a single confident terracotta/amber accent color.
- No cold corporate blue-only scheme.
- Large legible type, generous spacing, obvious full-text labeled buttons — avoid icon-only controls anywhere a low-tech-literacy user would see it.
- Keep it calm and trustworthy, not "enterprise SaaS dense."
- Create the best animated simple UI frontend for this prototype, with polished animated 3D design where appropriate and suitable to the problem statement.
- Animations and 3D elements must remain purposeful, calm, trustworthy, and relevant to financial empowerment.
- Landing page gets light visual investment only — one clean warm hero with the Spline embed, a one-line explainer of the product, and two buttons linking to /demo and /dashboard. Do not over-build this page.

TECH STACK

- React + Vite
- Tailwind CSS
- TypeScript
- react-router-dom
- recharts for charts
- lucide-react for icons
- @splinetool/react-spline
- @splinetool/runtime
- framer-motion

ROUTES

- "/" — landing
- "/demo" — chat demo console
- "/users/:id" — profile + transactions
- "/dashboard" — admin session viewer

STITCH — 2D UI SOURCE OF TRUTH

Use the connected Stitch MCP/toolset to design/derive the main 2D interface.

Stitch should define:

- overall layout
- visual hierarchy
- cards
- navigation
- typography
- spacing
- buttons
- forms
- dashboard structure
- chat interface
- responsive behavior
- animations/interactions

The React implementation should faithfully reproduce the Stitch design.

Do not independently redesign the UI after the Stitch design is established.

SPLINE (3D)

Use the connected Spline (3D) toolset.

Use @splinetool/react-spline (+ @splinetool/runtime) for one 3D hero element on the landing page only.

Lazy-load it, show a simple loading skeleton while it loads, and skip/hide it entirely if the user has prefers-reduced-motion enabled.

Use a free public Spline community scene as a placeholder, warm, abstract, organic — e.g. a soft floating orb/growth motif, gentle idle rotation only, no aggressive motion — with a clear TODO comment showing where to swap in our own scene URL later.

Create one high-quality but lightweight 3D visual that represents the platform's AI financial intelligence.

Concept:

"Financial Intelligence Orb"

A beautiful floating 3D orb/network representing the AI brain.

The object should visually communicate:

income
→ expenses
→ savings
→ goals
→ financial guidance

Design:

- elegant translucent/glass-like central orb
- subtle connected nodes
- tiny financial data particles
- gentle floating motion
- slow rotation
- soft ambient glow
- subtle orbital movement
- no excessive neon
- no gaming aesthetic
- no complicated 3D environment

The animation should be calm and premium.

Interaction:

On hover:
- slightly increase glow
- gently react/tilt
- connected nodes become slightly more visible

Idle:
- slow floating motion
- subtle rotation
- small particle movement

Do not make the 3D animation dominate the interface.

It should complement the UI and feel like part of the same design system as the Stitch UI.

Place the 3D Financial Intelligence Orb strategically on the landing page as the main visual element.

FRAMER MOTION / ANIMATION

Use framer-motion for small UI micro-animations ONLY.

Do not animate everything. This app needs to read as calm and trustworthy.

Animations must have PURPOSE and must not be decorative.

- Demo Console: each new chat message fades + slides in (150-200ms).
- Agent "typing" indicator is three softly pulsing dots, not a spinner.
- Flagged responses: distinct amber-bordered card with a gentle one-time pulse on appearance, not a repeating/blinking animation, plus a small "Flagged for review" label.
- Source citations: expand/collapse with a smooth height transition.
- Page transitions between routes: simple fade, under 200ms.
- Spline hero: idle-only motion (slow float/rotate), nothing that competes with the text next to it.

API CLIENT

Create an api/ folder with a typed client hitting base URL:

http://localhost:8000/api/v1

Functions:

- postAgentQuery
- getUserProfile
- postUserProfile
- getTransactions
- postTransaction
- getSessionHistory

Mock all of these with static data matching the shapes below until told to swap in the real backend.

Mocks should live in one clearly separated file so switching to real fetch calls is a one-line change.

POST /agent/query

body:

{
  "session_id": "string",
  "text": "string",
  "language": "string"
}

returns:

{
  "response_text": "string",
  "sources": ["string"],
  "flagged": false
}

GET/POST /user/{user_id}/profile

{
  "user_id": "string",
  "name": "string",
  "preferred_language": "string",
  "phone_number": "string",
  "monthly_income": number,
  "monthly_expenses": number,
  "savings_goal": number
}

Phone numbers must ALWAYS render masked, e.g. "XXXXX67890" — never show the full number anywhere, including admin.

GET/POST /user/{user_id}/transactions

{
  "id": "string",
  "date": "YYYY-MM-DD",
  "type": "income" | "expense",
  "category": "string",
  "amount": number,
  "note": "string"
}

GET /session/{session_id}/history

{
  "session_id": "string",
  "turns": [
    {
      "role": "user" | "agent",
      "text": "string",
      "timestamp": "ISO8601",
      "flagged": boolean
    }
  ]
}

BUILD ORDER

Build and make usable in this order. Do not skip ahead.

1. /demo — Demo Console

This is the highest-value screen. Build it first and make it fully working against mocks.

Create a beautiful chat-style demo console.

- User messages right-aligned
- Agent messages left-aligned
- Clean message bubbles
- Timestamps
- Text input
- Send button
- Language dropdown
- Typing indicator while waiting for postAgentQuery
- Each agent message shows expandable "Source: ..." citations underneath
- flagged: true responses render in the distinct amber style described above

Language dropdown must contain:

- Hindi
- Telugu
- Marathi
- English
- Auto-detect

The Demo Console is a core part of the product.

Top area:

AI status:

"Financial AI • Ready"

Show a subtle animated status indicator.

Input area:

- text input
- send button
- microphone button visually available for future voice integration
- language selector

AI response states:

IDLE

"Financial AI • Ready"

THINKING

Animated typing indicator

ANALYZING

"Checking financial guidance..."

RESPONDING

Streaming-style response appearance

FLAGGED

Amber safety state

ERROR

Friendly retry state

2. /users/:id — Profile + Transactions

Create a clean financial profile.

Show:

- Name
- Preferred language
- Masked phone number

Example:

XXXXX67890

Financial overview:

- Monthly income
- Monthly expenses
- Savings goal

Create editable income/expense/savings-goal fields.

Create an expense breakdown using Recharts.

Use a simple pie or bar chart of expenses by category.

Show recent transactions with:

- add transaction
- edit transaction

Transaction categories can include:

- Groceries
- Farming
- School Fees
- Transport
- Healthcare
- Other

3. /dashboard — Admin Session Viewer

Create a judge-facing operations dashboard.

Show:

- Total Sessions
- Flagged Responses
- Languages Used
- Active/Recent Sessions

Then show a table/list of recent sessions.

Each session should show:

- Session ID
- Language
- Time
- Status
- Flagged indicator

Clicking a session opens the full transcript via getSessionHistory.

Transcript should show:

- User message
- Agent response
- Timestamp
- Flag status
- RAG sources

Flagged turns must be visually highlighted.

If time allows, include a small stat row:

- total sessions
- % flagged
- languages used

4. / — Landing Page

Build this last with light effort only.

Create a warm hero section.

Headline:

"Financial guidance, made simple."

Supporting message explaining that the platform provides AI-powered financial education and guidance through a voice-first conversational agent.

Include:

- one clean hero section
- one-line explainer
- Spline (3D) Financial Intelligence Orb
- primary CTA: "Try AI Demo" → /demo
- secondary CTA: "View Dashboard" → /dashboard

Keep the page relatively light because the Demo Console is the main product demonstration.

FINANCIAL INSIGHT PANEL

Create an intelligent-looking but explainable panel.

Example:

"Financial Snapshot"

Monthly income
₹18,000

Monthly expenses
₹11,500

Savings goal
₹30,000

Then show:

"AI Insight"

"Your current expense pattern leaves approximately ₹6,500 before your savings goal."

Do not present AI guidance as guaranteed financial outcomes.

Never use:

- "Guaranteed savings"
- "Guaranteed returns"
- "This investment will make you..."
- any similar certainty-implying UI elements

Use educational/advisory language:

- "Based on the information provided..."
- "One possible approach is..."
- "Consider..."
- "This may help..."

RAG SOURCE VISUALIZATION

Every AI response should support expandable sources.

Example:

AI response:

"An emergency fund is money kept aside for unexpected expenses."

Below it:

"2 sources"

Clicking expands:

Source: NCFE Savings Guide
Source: Financial Education Material

Make the source UI visually elegant.

This is important because it demonstrates that the AI response is grounded in financial-literacy knowledge rather than arbitrary generation.

FLAGGED RESPONSE UI

If:

flagged = true

the response MUST visually change.

Use:

- subtle amber border
- amber indicator
- small warning icon
- "Flagged for review" label

Do not make it look like a system failure.

Make it look like an intelligent safety mechanism.

FINANCIAL INTELLIGENCE VISUALIZATION

Use Recharts for useful financial visualizations.

Examples:

- Expense breakdown
- Income vs expenses
- Savings progress

Keep charts clean and light.

Animate chart rendering subtly.

Do not create unnecessary charts.

MULTILINGUAL UI

Multilingual support is core.

At minimum support:

- English
- Hindi
- Telugu
- Marathi

The Demo Console's language selector and all user-facing labels must support Hindi, Telugu, Marathi, and English at minimum.

A simple i18n JSON dictionary is enough; no full i18n library is needed for this scope.

If text is active first, use the best one.

PRIVACY REQUIREMENTS

STRICT:

There is NO bank integration.

Do not create:

"Connect your bank account"

"Connect Bank Account"

"Link Bank"

"Import Bank Statement"

or anything similar anywhere.

All financial information is self-reported only.

Phone numbers are always masked, including in the admin dashboard.

Never expose sensitive information unnecessarily.

HARD CONSTRAINTS

Do not violate these anywhere in the UI:

- No "connect your bank account" flow or any bank-linking UI, anywhere.
- All financial data is self-reported only.
- Phone numbers are always masked, including in the admin dashboard.
- Never present agent numbers/advice as guaranteed or certain.
- No "guaranteed savings" badges or similar certainty-implying UI elements.
- Multilingual is core.
- Support Hindi, Telugu, Marathi, and English at minimum.
- Do not build the phone experience.
- Do not build backend functionality.
- Do not change the supplied API contract.

RESPONSIVE DESIGN

The app must be mobile-first.

Support:

- mobile
- tablet
- desktop

On smaller screens:

- sidebar becomes collapsible
- cards stack
- charts resize
- chat remains usable
- Spline 3D visual scales gracefully

COMPONENT ARCHITECTURE

Use reusable components.

Suggested structure:

src/
  components/
    layout/
    chat/
    financial/
    charts/
    dashboard/
    profile/
    ui/
    spline/

  pages/
    Landing.tsx
    Demo.tsx
    UserProfile.tsx
    Dashboard.tsx

  api/
    client.ts
    agent.ts
    users.ts
    transactions.ts
    sessions.ts

  mocks/

  hooks/

  types/

Keep API logic separate from presentation.

IMPORTANT DESIGN PRINCIPLE

The product should visually communicate:

VOICE-FIRST AI
+
FINANCIAL INTELLIGENCE
+
RAG-GROUNDED RESPONSES
+
SAFETY GUARDRAILS
+
MULTILINGUAL SUPPORT
+
PRIVACY

Do not communicate it as merely:

"another finance dashboard."

The visual identity should make the AI intelligence feel like the core engine behind the system.

The final result should look like ONE coherent product, not a Stitch design with a random 3D object attached to it.

The Stitch visual language and Spline visual language must feel like they belong to the same design system.

FINAL VISUAL QUALITY BAR

Aim for:

Apple-level cleanliness
+
modern fintech polish
+
approachable financial education
+
subtle AI motion
+
premium 3D visualization

But prioritize usability over decoration.

Every visual element must have a reason.

Avoid:

- excessive gradients
- excessive glassmorphism
- neon colors
- dark cyberpunk UI
- excessive animations
- giant text everywhere
- crowded dashboards
- meaningless AI decorations
- unnecessary pages
- enterprise SaaS density

MOST IMPORTANT

Use Stitch for the 2D UI design.

Use Spline (3D) for the Financial Intelligence Orb.

Use React + Vite + TypeScript for implementation.

Use Tailwind CSS for styling.

Use Recharts for charts.

Use Lucide React for icons.

Use Framer Motion only for the specified micro-animations.

The final result should be the best animated simple UI frontend for this prototype, with animated 3D design that is suitable for and varies according to the SH-105 problem statement.

Build the frontend with mocked API data first.

Do not implement backend functionality.

Do not change the supplied API contract.

Do not add features outside this specification unless absolutely necessary for the frontend to function.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
