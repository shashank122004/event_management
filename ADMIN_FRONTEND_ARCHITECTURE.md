# Dashboard UI Architecture (Admin + Participant)

Scope: This document defines only the UI architecture for:
- Admin Dashboard UI
- Participant Dashboard UI

Out of scope (already present):
- frontend/index.html
- frontend/login.html
- frontend/signup.html
- frontend/script.js
- frontend/styles.css

Base API URL: http://localhost:3000
Frontend stack: HTML, CSS, JavaScript, Bootstrap 5

---

## Directory Tree

```text
frontend/
├── admin dashboard/
│   ├── dashboard.html                         # Admin landing page after login with KPI cards + quick links
│   ├── events.html                            # Event list with filters and row-level actions
│   ├── event-form.html                        # Create/Edit event form (mode via query string)
│   ├── event-registrations.html               # Registrations table for a selected event
│   ├── payments-review.html                   # UnderReview payments queue with approve/reject actions
│   ├── venues.html                            # Venue reference page used by event managers
│   ├── profile.html                           # Admin profile update page
│   ├── css/
│   │   └── admin-dashboard.css                # Admin dashboard-specific layout/theme overrides
│   └── js/
│       ├── core/
│       │   ├── config.js                      # BASE_URL, role constants, shared UI constants
│       │   ├── session.js                     # Token/admin session helpers (read, write, clear)
│       │   ├── http.js                        # fetch wrapper with Authorization and standardized error handling
│       │   └── guard.js                       # Route protection + role-based page guard
│       ├── api/
│       │   ├── admin.api.js                   # /admin login-independent dashboard APIs (payments review, profile update)
│       │   ├── events.api.js                  # /events CRUD, publish/unpublish, registrations, QR upload
│       │   └── venues.api.js                  # /events/venues endpoints
│       ├── ui/
│       │   ├── navbar.js                      # Top nav renderer (name, role badge, logout)
│       │   ├── sidebar.js                     # Role-aware admin navigation
│       │   ├── table.js                       # Reusable table renderer with empty/loading states
│       │   ├── modal.js                       # Confirm/reject-reason modal helpers
│       │   └── toast.js                       # Bootstrap toast utility
│       └── pages/
│           ├── dashboard.page.js              # Admin dashboard bootstrap + KPI fetch orchestration
│           ├── events.page.js                 # Events list/filter/action handlers
│           ├── event-form.page.js             # Create/edit form handlers + venue population
│           ├── event-registrations.page.js    # Registrations fetch/render by event ID
│           ├── payments-review.page.js        # Review queue render + approve/reject workflows
│           ├── venues.page.js                 # Venue list render
│           └── profile.page.js                # Profile load/update handlers
└── user dashboard/
    ├── dashboard.html                         # Participant landing page with open events + registration state
    ├── events.html                            # Event catalog with status/fee filters
    ├── event-details.html                     # Event info + register CTA + payment instructions
    ├── my-registrations.html                  # User registrations with payment/confirmation status
    ├── upload-payment.html                    # Payment proof upload page (screenshot)
    ├── profile.html                           # Participant profile view/update page
    ├── css/
    │   └── user-dashboard.css                 # Participant dashboard styles
    └── js/
        ├── core/
        │   ├── config.js                      # BASE_URL and user-facing constants
        │   ├── session.js                     # User token/session helpers
        │   ├── http.js                        # Auth-aware fetch wrapper + error normalization
        │   └── guard.js                       # Ensures authenticated user pages are protected
        ├── api/
        │   ├── users.api.js                   # /users/:userId read/update wrappers
        │   ├── events.api.js                  # Public/open events + /events/:id/register wrappers
        │   └── payments.api.js                # /payments/:paymentId/screenshot wrapper
        ├── ui/
        │   ├── navbar.js                      # Participant navbar + logout
        │   ├── tabs.js                        # Dashboard section tab handling
        │   ├── card.js                        # Event card renderer
        │   └── toast.js                       # Toast utility for success/error feedback
        └── pages/
            ├── dashboard.page.js              # Initial participant overview + open events preview
            ├── events.page.js                 # Event listing/filter/register navigation logic
            ├── event-details.page.js          # Event load + registration initiation
            ├── my-registrations.page.js       # Registration/payment status rendering
            ├── upload-payment.page.js         # Payment screenshot upload flow
            └── profile.page.js                # User profile read/update flow
```

---

## Required UI Pages/Components

### Admin dashboard UI
- dashboard.html: KPI cards (Total Events, Open Events, Pending Reviews), latest events, pending-payment quick actions.
- events.html: Search/filter table, action column for publish, unpublish, delete, edit, upload QR, view registrations.
- event-form.html: Single reusable form for create and edit (mode=create|edit, id=<eventId>).
- event-registrations.html: Table (student, email, status, date) for one event.
- payments-review.html: Payment cards/table with screenshot preview, approve/reject CTA.
- venues.html: Venue name/capacity/location list for planning.
- profile.html: Admin self-profile update; president-only section for updating another admin ID.

Reusable admin UI components
- navbar.js, sidebar.js, table.js, modal.js, toast.js.

### Participant dashboard UI
- dashboard.html: Personalized greeting, open events summary, recent registration statuses.
- events.html: Open/published event listing with fee/status filters.
- event-details.html: Full event detail, register button, QR/payment instructions status.
- my-registrations.html: All registration entries with payment status lifecycle.
- upload-payment.html: Screenshot upload form for a selected payment ID.
- profile.html: Profile update form (name, phone, password with old password).

Reusable participant UI components
- navbar.js, tabs.js, card.js, toast.js.

---

## JavaScript API Integration Modules

### Admin API modules
- admin.api.js
  - getPendingPayments() -> GET /admin/payments/review
  - approvePayment(paymentId) -> PUT /admin/payments/:paymentId/approve
  - rejectPayment(paymentId, reason) -> PUT /admin/payments/:paymentId/reject
  - updateAdmin(adminId, payload) -> PUT /admin/:adminId

- events.api.js
  - getEvents(filters) -> GET /events
  - createEvent(payload) -> POST /events
  - updateEvent(eventId, payload) -> PUT /events/:id
  - publishEvent(eventId) -> POST /events/:id/publish
  - unpublishEvent(eventId) -> POST /events/:id/unpublish
  - deleteEvent(eventId) -> DELETE /events/:id
  - uploadEventQr(eventId, file) -> POST /events/:id/upload-qrcode (multipart/form-data)
  - getEventRegistrations(eventId) -> GET /events/:id/registrations

- venues.api.js
  - getAllVenues() -> GET /events/venues/all
  - getVenue(venueId) -> GET /events/venues/:id

### Participant API modules
- users.api.js
  - getUser(userId) -> GET /users/:userId
  - updateUser(userId, payload) -> PUT /users/:userId

- events.api.js
  - getOpenPublishedEvents() -> GET /events?status=Open&isPublished=true
  - registerForEvent(eventId) -> POST /events/:id/register

- payments.api.js
  - uploadPaymentScreenshot(paymentId, file) -> POST /payments/:paymentId/screenshot (multipart/form-data)

---

## UI Action -> API Endpoint Mapping

### Admin dashboard mapping
| UI Action | Endpoint | Notes |
|---|---|---|
| Load dashboard summary | GET /events + GET /admin/payments/review | Derive KPI counts client-side |
| Filter events by status | GET /events?status={Draft|Open|Closed|Completed|Cancelled} | Admin token required |
| Create event submit | POST /events | Role 1/2 only |
| Edit event submit | PUT /events/:id | Role 1/2 only |
| Publish event | POST /events/:id/publish | Role 1/2 only |
| Unpublish event | POST /events/:id/unpublish | Role 1/2 only |
| Delete event | DELETE /events/:id | Only if constraints pass |
| Upload event QR | POST /events/:id/upload-qrcode | multipart form upload |
| Open registrations view | GET /events/:id/registrations | Any admin role |
| Open payment queue | GET /admin/payments/review | Any admin role |
| Approve payment | PUT /admin/payments/:paymentId/approve | Sets Success/Confirmed |
| Reject payment | PUT /admin/payments/:paymentId/reject | Sets Failed/Cancelled |
| Update own profile | PUT /admin/:adminId | Own ID for roles 1/2/3 |
| Update another admin | PUT /admin/:adminId | Role 1 only |

### Participant dashboard mapping
| UI Action | Endpoint | Notes |
|---|---|---|
| Load dashboard events preview | GET /events?status=Open&isPublished=true | Public endpoint usable with user session |
| Browse open events | GET /events?status=Open&isPublished=true | Event catalog source |
| Start registration | POST /events/:id/register | Returns paymentId + qrCodeUrl |
| Upload payment proof | POST /payments/:paymentId/screenshot | multipart form upload |
| Open profile page | GET /users/:userId | Own profile only |
| Save profile changes | PUT /users/:userId | oldPassword needed for password change |

---

## Suggested State/Data Flow

### Admin dashboard state model
- Session state (sessionStorage)
  - adminToken, adminId, roleID, fullName
- View state (in-memory per page)
  - events[], venues[], paymentsUnderReview[], filters, loading, error
- Derived state
  - dashboard KPIs (totalEvents, openEvents, pendingPayments)
  - role flags (isPresident, canManageEvents)

Admin flow
1. guard.js validates token and role for page.
2. page module requests data through api modules.
3. api modules call http.js, which appends Authorization header.
4. ui components render loading -> data -> empty/error states.
5. mutating action (approve, publish, delete, update) triggers optimistic UI update or list refresh.

### Participant dashboard state model
- Session state (sessionStorage)
  - userToken, userId, fullName
- View state
  - openEvents[], selectedEvent, registrations[], paymentUploadStatus, profile
- Derived state
  - current registration stage per event (NotRegistered, Pending, UnderReview, Confirmed, Cancelled)

Participant flow
1. guard.js validates authenticated user pages.
2. dashboard/events fetch open published events.
3. registerForEvent returns registrationId/paymentId/qrCodeUrl and moves UI to payment step.
4. uploadPaymentScreenshot transitions status to UnderReview.
5. my-registrations page reflects backend lifecycle changes.

---

## Notes for Implementation Consistency
- Keep admin and participant dashboard code isolated in their own folders.
- Use one fetch wrapper per dashboard (core/http.js) for consistent headers and error handling.
- Handle 401 globally by clearing session and redirecting to existing login page.
- Keep role checks in core/guard.js; do not duplicate role checks in every page file.
- Reuse Bootstrap components for tables, cards, modals, toasts, and responsive nav.
