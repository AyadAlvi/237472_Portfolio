# Craft Collective Marketplace

Art & craft e-commerce experience focused on multi-vendor storytelling, configurable products, and simulated secure checkout.

## Stack

- **Frontend**: Vanilla HTML/CSS/JS (single-page layout with fetch + localStorage, accessible modals, role-aware dashboard view).
- **Backend**: Node.js + Express, JSON file storage, JWT auth with bcrypt, helmet/cors/morgan, validation helpers for resilient prototype APIs.

## Getting Started

1. **API**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Serves `http://localhost:5000`.

2. **Frontend**
   ```bash
   cd frontend
   npx serve .
   ```
   Open the printed URL (usually `http://localhost:3000`) or use a static server/Live Server.

## Demo Accounts

- Vendor: `vendor@craftcollective.com` / `CraftPass123!`

## Highlights

- Multi-vendor listing grid + vendor detail panels with featured products and shipping metadata.
- Marketplace search/filter, product-level customization controls, and persistent cart drawer with checkout fees.
- Custom commission studio wiring authenticated POST requests per vendor/product pairing.
- Blog/gallery feed for process storytelling.
- JWT-based auth with protected checkout, customization submission, and role-based Profile/Dashboard tab:
  - **Customers**: profile edit, “My Orders,” “My Customizations.”
  - **Vendors**: store overview, “My Products” with inline edits/toggles, incoming customization queue.

## Documentation

See `docs/REPORT.md` for the full coursework report (abstract, architecture, API table, UX/security notes, testing, and evaluation criteria mapping).
