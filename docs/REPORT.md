# Craft Collective Marketplace: Multi-Vendor Art & Craft Commerce Prototype

## 1) Title & Abstract
The Craft Collective Marketplace is a coursework-scale single-page application that curates independent artists and makers for art lovers seeking bespoke pieces. Built with vanilla HTML/CSS/JavaScript on the client and a lightweight Node.js/Express API, it targets students and hobbyists who value transparent marketplace flows over heavy frameworks. Core features include multi-vendor storefronts, configurable products, a commissions studio, a process-focused blog, and a JWT-protected checkout that simulates secure purchases. The latest iteration introduces role-aware dashboards: customers can manage profiles, past orders, and customization requests, while vendors gain storefront overviews and product toggles. Data persists in structured JSON files, enabling fast iteration without a full database, and the UI maintains the handcrafted visual identity across desktop and mobile breakpoints.

---

## 2) Technologies Used
- **Frontend**: HTML5 templates, modern CSS (Grid/Flex), vanilla JavaScript with a SPA-style module (`app.js`) managing state, fetch calls, and localStorage persistence to keep tooling light for coursework clarity.
- **Backend**: Node.js + Express with helmet/cors/morgan for security logging, JWT authentication, bcrypt-secured passwords, and JSON file storage via a simple fileStore helper—chosen to avoid DB setup overhead while demonstrating REST patterns.
- **Rationale**: The stack balances pedagogical simplicity and industry-aligned patterns (JWT, modular routing, service separation). JSON persistence keeps the prototype portable; security middlewares and validation helpers reinforce best practices without introducing heavyweight dependencies.

---

## 3) System Overview
- **Architecture**: A single-page frontend served statically communicates with Express REST endpoints over HTTP. Fetch-based calls populate UI panels, while protected routes require bearer tokens issued during login/register.
- **Data Model**
  - **Users**: `{ id, name, email, role: "customer"|"vendor", vendorId?, passwordHash, timestamps }`.
  - **Vendors**: `{ id, name, bio, heroImage, categories[], shippingPolicy, social }`.
  - **Products**: `{ id, vendorId, name, description, price, isActive, inventory, tags[], images[], customizations[] }`.
  - **Orders**: `{ id, customerId, customerName, items[], subtotal, serviceFee, total, status }`.
  - **Customizations**: `{ id, customerId, vendorId, productId, details, budget, status }`.
  - **Blog Posts**: `{ id, vendorId, title, excerpt, content, publishedAt }`.
- **Role Matrix**

| Role | View Marketplace | Submit Custom Requests | Checkout | Profile Dashboard | Vendor Tools |
|------|------------------|------------------------|----------|-------------------|--------------|
| Customer | ✔ | ✔ | ✔ | Profile + orders + customizations + name edit | ✖ |
| Vendor | ✔ | ✔ | ✔ | Store info + products + vendor requests | ✔ (product edit/toggle) |

---

## 4) Features Implemented
- **Marketplace & Vendor Stores**: Visitors land on a curated grid of artisans with location, categories, and bios. Clicking a card reveals a store panel featuring shipping info and highlighted products. *Figure 1. Vendor detail panel—featured products.*
- **Product Search/Filtering & Cart**: Search and vendor filters update the marketplace instantly; each card supports inline customization controls and quantity selectors before adding items to the persistent cart drawer.
- **Customization Requests**: A “Custom Studio” form pairs vendor and product selections with freeform briefs/budgets, sending authenticated POST requests so vendors can follow up on bespoke commissions.
- **Blog/Gallery**: A stories section surfaces vendor tutorials and studio spotlights via `/api/blog`, maintaining the platform’s storytelling ethos. *Figure 2. Blog grid—process journal cards.*
- **Authentication & Protected Actions**: The modal supports register/login with JWT issuance, stored in localStorage and attached to fetch headers; checkout, customization submissions, and dashboards require valid tokens.
- **Profile/Dashboard (NEW)**:
  - **Navigation**: After login, a “Profile” tab appears in the header; selecting it swaps the SPA to the dashboard panel, and the tab disappears upon logout.
  - **Customer capabilities**: View profile metadata, edit display name, and inspect “My Orders” plus “My Customizations” with status indicators. *Figure 3. Customer Dashboard — orders list.*
  - **Vendor capabilities**: Review store bio/location, browse “My Products,” toggle active status or adjust prices inline, and read vendor-specific customization requests.

---

## 5) API Summary

| Method | Path | Auth? | Purpose | Key Request / Response Fields |
|--------|------|-------|---------|-------------------------------|
| POST | /api/auth/login | No | Issue JWT for existing user | Req: `{ email, password }`; Res: `{ token, user }` |
| POST | /api/auth/register | No | Create account (role optional) | Req: `{ name, email, password, role?, vendorId? }`; Res: `{ token, user }` |
| GET | /api/profile/me | Yes | Fetch current user profile | Res: `{ id, name, email, role, vendorId }` |
| PUT | /api/profile/me | Yes | Update display name | Req: `{ name }`; Res: updated profile |
| GET | /api/orders/my | Yes (customer) | Retrieve customer’s orders | Res: `[ { id, createdAt, items[], total } ]` |
| GET | /api/customizations/my | Yes (customer) | List customer customization requests | Res: `[ { id, productId, vendorId, status } ]` |
| GET | /api/vendors/me | Yes (vendor) | Vendor store profile | Res: vendor object |
| GET | /api/vendor/products | Yes (vendor) | Vendor’s products | Res: `[ product ]` |
| POST | /api/vendor/products | Yes (vendor) | Create product | Req: `{ name, description, price, ... }` |
| PUT | /api/vendor/products/:id | Yes (vendor) | Update product | Req: partial fields (name/price/isActive/inventory) |
| POST | /api/customizations | Yes | Create customization request | Req: `{ vendorId, productId, details, budget? }` |
| POST | /api/cart/checkout | Yes | Simulated secure checkout | Req: `{ items: [{ productId, vendorId, quantity, customizations }], paymentMethod }`; Res: `{ order }` |

---

## 6) Design & User Experience
- **Visual Consistency**: The dashboard inherits the existing typography, pill buttons, and clay-inspired palette, ensuring the new panel feels native to the brand.
- **Responsiveness**: CSS Grid & Flex layouts collapse gracefully; the cart drawer spans full width on small screens, and dashboard grids convert to single-column stacks.
- **Accessibility**: Skip link, aria roles (modals/dialogs/cart), focus trapping, and keyboard shortcuts maintain usability. Inputs/buttons show high-contrast focus rings, and a `prefers-reduced-motion` rule minimizes animation for sensitive users.
- **State Feedback**: Each section renders loading spinners, empty placeholders, or inline error alerts; live regions announce authentication and checkout status for screen readers.

---

## 7) Security & Data Integrity (Prototype-Level)
- JWT tokens issued on login/registration secure protected endpoints; middleware attaches decoded `{ id, role, vendorId }` for downstream authorization.
- Body validators enforce required strings, numeric ranges, and vendor/product relationships before persisting any change.
- Checkout logic reconstructs line items from server-side product data, revalidates quantities, and recomputes subtotal/service fees to counter price tampering.
- Only the JWT and cart array persist client-side; logout clears storage and hides dashboard navigation, limiting exposure of personal data.

---

## 8) Challenges & Solutions
1. **SPA Auth State** – Coordinating login/logout across modals, nav, and dashboard without a framework. *Solution*: Central state object with helper functions to update UI bindings and persist tokens.
2. **File-Based Storage Consistency** – Avoiding race conditions when multiple routes touch JSON files. *Solution*: Single fileStore helper with async read/write patterns and small atomic operations.
3. **Vendor-Scoped Actions** – Ensuring vendors only edit their own products/requests. *Solution*: Vendor dashboards consult `req.user.vendorId` and filter/guard product IDs server-side.
4. **Accessible Overlays** – Managing focus between auth modal, cart drawer, and skip links. *Solution*: Focus memory helpers, ARIA metadata, and Escape-key listeners to close overlays predictably.
5. **Fetch Error Surfacing** – Communicating network failures without breaking the SPA. *Solution*: Loading/error flags per panel with shared helper `renderPanelState` to show status messages.

---

## 9) Testing & Evaluation
- **Manual Scenarios**:
  - Register/login/logout for both roles; confirm Profile tab visibility toggles accordingly.
  - Customer journey: add items, submit custom request, checkout (server logs recomputed totals).
  - Vendor journey: switch to dashboard, edit product price/toggle active flag, observe persistence in marketplace feed.
  - Edge cases: invalid login credentials, empty searches, API failure simulations (disconnect server) verifying error banners.
- **Happy Paths**: Verified fetch flows for `/api/profile/me`, `/api/orders/my`, `/api/customizations/my`, vendor equivalents, and checkout, ensuring JWT headers attach automatically.
- **Integrity Checks**: Confirmed server rejects carts with invalid product IDs or negative quantities and returns descriptive errors surfaced in the cart drawer.

---

## 10) Future Improvements
- Integrate a real payment gateway (Stripe Connect) with vendor payouts and webhook confirmations.
- Migrate JSON storage to a relational/NoSQL database with an ORM (e.g., Prisma) for scalability and relational queries.
- Expand vendor dashboards with analytics (sales trends, request funnels) and richer content editing.
- Add media upload/optimization pipelines (S3/Cloudinary) for product galleries.
- Localize currency/text, strengthen RBAC (admin roles), send transactional emails, and introduce automated CI tests plus linting.

---

## 11) Mapping to Evaluation Criteria
- **Functionality**: Multi-vendor listings, vendor store pages, customizable products, commission workflow, blog gallery, JWT-protected checkout, and role-based dashboards meet the brief.
- **Design & UX**: Responsive layouts, cohesive styling, informative empty/loading states, and accessibility enhancements (skip links, focus states) support a polished experience.
- **Code Quality**: Clear separation between frontend SPA logic and backend REST modules, inline comments/JSDoc on key functions, centralized validation, and consistent error handling.
- **Innovation**: Role-aware dashboard experience, dynamic customization module, and storytelling gallery push beyond baseline commerce features while remaining feasible for coursework.
