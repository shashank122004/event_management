# GFG Event Management — API Documentation

> **Base URL:** `http://localhost:3000`  
> **API Version:** 1.0.0  
> **Content-Type:** `application/json` (unless stated otherwise)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Standard Response Format](#standard-response-format)
4. [Error Codes Reference](#error-codes-reference)
5. [API Endpoints](#api-endpoints)
   - [Health & Root](#health--root)
   - [Users](#users)
   - [Admin](#admin)
   - [Events](#events)
   - [Payments](#payments)
6. [Payment Flow (End-to-End)](#payment-flow-end-to-end)
7. [Role-Based Access Control](#role-based-access-control)
8. [Postman Setup Guide](#postman-setup-guide)

---

## Overview

The GFG Event Management API is a RESTful backend that powers event creation, user registration, payments (manual QR-based flow), and admin operations for the GeeksForGeeks student chapter.

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js + Express |
| Database | PostgreSQL (via Supabase) |
| Auth | JWT (Bearer token) |
| File Storage | Supabase Storage |
| Payment | Manual QR Code Flow |

---

## Authentication

All protected endpoints require a **JWT Bearer token** in the `Authorization` header.

```
Authorization: Bearer <your_jwt_token>
```

### Token Lifecycle

| Property | Value |
|----------|-------|
| Type | Bearer |
| Default Expiry | 24 hours (configurable via `JWT_EXPIRY`) |
| Issuer | `gfg-event-management` |
| Audience (User token) | `user-api` |
| Audience (Admin token) | `admin-api` |

Tokens are returned on login/register in the `data.token` object:

```json
{
  "token": "<jwt_string>",
  "type": "Bearer",
  "expiresAt": "2026-03-02T10:00:00.000Z"
}
```

> **Note:** User tokens and Admin tokens are issued separately. Admin-only routes reject user tokens.

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": null,
    "timestamp": "2026-03-01T10:00:00.000Z"
  }
}
```

---

## Error Codes Reference

### HTTP Status → Error Code Mapping

| HTTP Status | Meaning |
|------------|---------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — authenticated but insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict — duplicate entry or invalid state transition |
| 500 | Internal server error |

### Complete Error Code List

| Error Code | HTTP Status | Description |
|------------|------------|-------------|
| `INVALID_INPUT` | 400 | Invalid input provided |
| `MISSING_FIELD` | 400 | Required field is missing |
| `INVALID_EMAIL` | 400 | Invalid email format |
| `INVALID_PASSWORD` | 400 | Password does not meet security requirements |
| `INVALID_GRADUATION_YEAR` | 400 | Graduation year must be between 2020 and 2035 |
| `INVALID_PHONE` | 400 | Invalid phone number format (E.164 expected) |
| `INVALID_TIME_RANGE` | 400 | Invalid time range for event |
| `INVALID_MAX_SLOTS` | 400 | Max slots exceed venue capacity |
| `INCOMPLETE_EVENT` | 400 | Event details are incomplete for publishing |
| `NO_UPDATE_FIELDS` | 400 | No valid fields provided for update |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for this resource |
| `USER_NOT_FOUND` | 404 | User not found |
| `EVENT_NOT_FOUND` | 404 | Event not found |
| `VENUE_NOT_FOUND` | 404 | Venue not found |
| `PAYMENT_NOT_FOUND` | 404 | Payment record not found |
| `REGISTRATION_NOT_FOUND` | 404 | Registration not found |
| `DUPLICATE_STUDENT_ID` | 409 | Student ID already registered |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `DUPLICATE_USERNAME` | 409 | Username already taken |
| `DUPLICATE_EVENT` | 409 | Event with same name/time/venue already exists |
| `INVALID_INVITATION_CODE` | 400 | Invitation code does not exist |
| `INVITATION_CODE_INACTIVE` | 400 | Invitation code is inactive |
| `INVITATION_CODE_EXPIRED` | 400 | Invitation code has expired |
| `INVITATION_CODE_ALREADY_USED` | 400 | Invitation code has already been used |
| `ALREADY_REGISTERED` | 409 | User already registered for this event |
| `EVENT_FULL` | 409 | Event has reached maximum capacity |
| `EVENT_NOT_OPEN` | 400 | Event is not open for registration |
| `EVENT_ALREADY_PUBLISHED` | 409 | Event is already published |
| `EVENT_NOT_PUBLISHED` | 409 | Event is not published |
| `EVENT_HAS_REGISTRATIONS` | 409 | Cannot delete event with existing registrations |
| `INVALID_STATUS_TRANSITION` | 409 | Invalid status transition for payment/registration |
| `PAYMENT_NOT_FOUND` | 404 | Payment record not found |
| `DATABASE_ERROR` | 409/400 | Database constraint violation |
| `TRANSACTION_FAILED` | 500 | Database transaction could not be completed |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Password Requirements

Passwords must satisfy **all** of the following:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## API Endpoints

---

### Health & Root

#### `GET /`
Returns a welcome message and available endpoint summary.

**Authentication:** None

**Response `200`:**
```json
{
  "message": "Welcome to GFG Event Management API",
  "status": "Server is running",
  "version": "1.0.0",
  "endpoints": {
    "root": "/",
    "events": "/events",
    "health": "/health",
    "users": "/users/register, /users/login, /users/:userId",
    "admin": "/admin/onboard"
  }
}
```

---

#### `GET /health`
Database connectivity check.

**Authentication:** None

**Response `200`:**
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

**Response `500` (DB unreachable):**
```json
{
  "status": "ERROR",
  "database": "Disconnected",
  "error": "connection refused"
}
```

---

### Users

#### `POST /users/register`
Register a new user account. Returns a JWT token on success.

**Authentication:** None (public)

**Request Body:**
```json
{
  "studentID": "CS2024001",
  "fullName": "Jane Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "phone": "+919876543210",
  "branchID": 1,
  "graduationYear": 2027,
  "uniID": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `studentID` | string | ✅ | Alphanumeric, 3–20 chars |
| `fullName` | string | ✅ | Non-empty string |
| `username` | string | ✅ | Alphanumeric, no spaces |
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | See password requirements |
| `phone` | string | ✅ | E.164 format (e.g. `+919876543210`) |
| `branchID` | integer | ✅ | Positive integer |
| `graduationYear` | integer | ✅ | Between 2020 and 2035 |
| `uniID` | integer | ✅ | Positive integer |

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userID": 42,
      "studentID": "CS2024001",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "phone": "+919876543210",
      "branchID": 1,
      "graduationYear": 2027,
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z"
    },
    "token": {
      "token": "<jwt_string>",
      "type": "Bearer",
      "expiresAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `DUPLICATE_STUDENT_ID` | 409 | Student ID already exists |
| `DUPLICATE_USERNAME` | 409 | Username already taken |
| `INVALID_INPUT` | 400 | Missing or invalid fields |

---

#### `POST /users/login`
Authenticate an existing user. Returns a JWT token.

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass@123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userID": 42,
      "studentID": "CS2024001",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "phone": "+919876543210",
      "branchID": 1,
      "graduationYear": 2027,
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    },
    "token": {
      "token": "<jwt_string>",
      "type": "Bearer",
      "expiresAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `UNAUTHORIZED` | 401 | Invalid credentials |
| `MISSING_FIELD` | 400 | Email or password not provided |

---

#### `GET /users/:userId`
Retrieve a user's profile by ID.

**Authentication:** Required (User JWT — user can only view their own profile; `roleID=1` can view any)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | integer | User's unique ID |

**Headers:**
```
Authorization: Bearer <user_jwt_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "userID": 42,
      "studentID": "CS2024001",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "phone": "+919876543210",
      "branchID": 1,
      "graduationYear": 2027,
      "currentYear": 2,
      "isActive": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Trying to view another user's profile |
| `USER_NOT_FOUND` | 404 | User ID does not exist |

---

#### `PUT /users/:userId`
Update a user's profile (name, phone, or password).

**Authentication:** Required (User JWT — own profile only)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `userId` | integer | User's unique ID |

**Headers:**
```
Authorization: Bearer <user_jwt_token>
```

**Request Body** (at least one field required):
```json
{
  "fullName": "Jane Updated",
  "phone": "+911234567890",
  "password": "NewPass@456",
  "oldPassword": "SecurePass@123"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fullName` | string | optional | |
| `phone` | string | optional | E.164 format |
| `password` | string | optional | Requires `oldPassword` |
| `oldPassword` | string | conditional | Required when changing password |

**Response `200`:**
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "user": { "...updated user fields..." }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `MISSING_FIELD` | 400 | `oldPassword` missing when changing password |
| `INVALID_INPUT` | 400 | No valid fields provided |
| `UNAUTHORIZED` | 401 | Invalid or missing token |

---

### Admin

#### `POST /admin/onboard`
Register a new admin account using an invitation code.

**Authentication:** None (public, but requires a valid invitation code)

**Request Body:**
```json
{
  "studentID": "CS2024002",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "AdminPass@123",
  "phone": "+919876543211",
  "roleID": 3,
  "branchID": 1,
  "graduationYear": 2026,
  "invitationCode": "INVITE2024ABC"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `studentID` | string | ✅ | Alphanumeric, 3–20 chars |
| `fullName` | string | ✅ | Non-empty string |
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | See password requirements |
| `phone` | string | ✅ | E.164 format |
| `roleID` | integer | ✅ | See Role ID table below |
| `branchID` | integer | optional | Positive integer |
| `graduationYear` | integer | ✅ | 2020–2035 |
| `invitationCode` | string | ✅ | Uppercase alphanumeric, 8–20 chars |

**Role IDs:**
| roleID | Role |
|--------|------|
| 1 | President |
| 2 | Vice-President |
| 3 | Core Member / Event Manager |

**Response `201`:**
```json
{
  "success": true,
  "message": "Admin onboarded successfully",
  "data": {
    "admin": {
      "adminID": 5,
      "studentID": "CS2024002",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543211",
      "roleID": 3,
      "branchID": 1,
      "graduationYear": 2026,
      "currentYear": 3,
      "createdAt": "2026-03-01T10:00:00.000Z"
    },
    "token": {
      "token": "<admin_jwt_string>",
      "type": "Bearer",
      "expiresAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `INVALID_INVITATION_CODE` | 400 | Code not found |
| `INVITATION_CODE_EXPIRED` | 400 | Code past expiry date |
| `INVITATION_CODE_INACTIVE` | 400 | Code has been deactivated |
| `INVITATION_CODE_ALREADY_USED` | 400 | Code already consumed |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `DUPLICATE_STUDENT_ID` | 409 | Student ID already exists |

---

#### `POST /admin/login`
Authenticate an existing admin. Returns an admin JWT token.

**Authentication:** None (public)

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "AdminPass@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "adminID": 5,
      "studentID": "CS2024002",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543211",
      "roleID": 3,
      "branchID": 1,
      "graduationYear": 2026,
      "currentYear": 3,
      "createdAt": "2026-03-01T10:00:00.000Z"
    },
    "token": {
      "token": "<admin_jwt_string>",
      "type": "Bearer",
      "expiresAt": "2026-03-02T10:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `UNAUTHORIZED` | 401 | Invalid credentials |

---

#### `PUT /admin/:adminId`
Update an admin's profile details.

**Authentication:** Required (Admin JWT)  
**Authorization:** Own profile only, OR `roleID=1` (President) to update any admin

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `adminId` | integer | Admin's unique ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body** (at least one field required):
```json
{
  "fullName": "John Updated",
  "phone": "+911234567890",
  "password": "NewAdminPass@456",
  "oldPassword": "AdminPass@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Admin details updated successfully",
  "data": {
    "admin": {
      "adminID": 5,
      "studentID": "CS2024002",
      "fullName": "John Updated",
      "email": "john@example.com",
      "phone": "+911234567890",
      "roleID": 3,
      "branchID": 1,
      "graduationYear": 2026,
      "currentYear": 3,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T11:00:00.000Z"
    }
  }
}
```

---

#### `GET /admin/payments/review`
List all payment records with status `UnderReview` (awaiting screenshot approval).

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1, 2, or 3

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "3 payment(s) pending review",
  "data": {
    "reviews": [
      {
        "paymentId": 10,
        "amount": "199.00",
        "paymentStatus": "UnderReview",
        "paymentMode": "QR",
        "transactionRef": "uuid-string",
        "screenshotUrl": "https://storage.supabase.co/...",
        "paymentDate": "2026-03-01T09:00:00.000Z",
        "registrationId": 25,
        "registrationStatus": "Pending",
        "registrationDate": "2026-03-01T08:55:00.000Z",
        "eventId": 3,
        "eventName": "Hackathon 2026",
        "eventStart": "2026-04-10T09:00:00.000Z",
        "userId": 42,
        "userName": "Jane Smith",
        "userEmail": "jane@example.com",
        "studentId": "CS2024001"
      }
    ]
  }
}
```

---

#### `PUT /admin/payments/:paymentId/approve`
Approve a payment screenshot. Sets Payment → `Success`, Registration → `Confirmed`.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1, 2, or 3

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `paymentId` | integer | Payment record ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment approved. Registration confirmed.",
  "data": {
    "payment": { "...updated payment record..." },
    "registration": { "...updated registration record..." }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `PAYMENT_NOT_FOUND` | 404 | Payment ID does not exist |
| `INVALID_STATUS_TRANSITION` | 409 | Payment is not in `UnderReview` status |

---

#### `PUT /admin/payments/:paymentId/reject`
Reject a payment screenshot. Sets Payment → `Failed`, Registration → `Cancelled`.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1, 2, or 3

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `paymentId` | integer | Payment record ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body** (optional):
```json
{
  "reason": "Screenshot is blurry and unreadable"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment rejected. Registration cancelled.",
  "data": {
    "payment": { "...updated payment record..." },
    "registration": { "...updated registration record..." }
  }
}
```

---

### Events

#### `GET /events`
Retrieve all events with filters. Admin authentication required, except for a specific public query.

**Authentication:**
- Admin JWT required by default
- Public access (no token) allowed ONLY for: `status=Open&isPublished=true`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by event status: `Draft`, `Open`, `Closed`, `Completed`, `Cancelled` |
| `isPublished` | boolean | Filter by published state: `true` or `false` |
| `venueID` | integer | Filter by venue ID |

**Example Requests:**
```
GET /events?status=Open&isPublished=true              → public (no auth required)
GET /events                                           → requires admin token
GET /events?status=Open                               → requires admin token
GET /events?status=Draft                              → requires admin token
GET /events?isPublished=false                         → requires admin token
GET /events?venueID=2                                 → requires admin token
GET /events?status=Open&isPublished=true&venueID=2    → requires admin token (has extra params)
```

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "EventID": 3,
      "EventName": "Hackathon 2026",
      "Description": "Annual hackathon",
      "StartTime": "2026-04-10T09:00:00.000Z",
      "EndTime": "2026-04-10T18:00:00.000Z",
      "MaxSlots": 100,
      "RegistrationFee": "199.00",
      "Status": "Open",
      "IsPublished": true,
      "VenueID": 1,
      "CreatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
}
```

---

#### `POST /events`
Create a new event.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1 (President) or 2 (Vice-President)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "eventName": "Tech Conference 2026",
  "description": "Annual technology conference for students",
  "startTime": "2026-05-15T09:00:00",
  "endTime": "2026-05-15T17:00:00",
  "maxSlots": 200,
  "registrationFee": 99.00,
  "venueID": 1
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventName` | string | ✅ | |
| `description` | string | optional | |
| `startTime` | ISO 8601 datetime | ✅ | |
| `endTime` | ISO 8601 datetime | ✅ | Must be after `startTime` |
| `maxSlots` | integer | optional | Must not exceed venue capacity |
| `registrationFee` | number | optional | Defaults to 0 (free) |
| `venueID` | integer | ✅ | Must exist in Venue table |

**Response `201`:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "EventID": 5,
    "EventName": "Tech Conference 2026",
    "Status": "Draft",
    "IsPublished": false,
    "...other event fields..."
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `VENUE_NOT_FOUND` | 404 | `venueID` does not exist |
| `INVALID_TIME_RANGE` | 400 | `endTime` is before `startTime` |
| `INVALID_MAX_SLOTS` | 400 | Slots exceed venue capacity |
| `DUPLICATE_EVENT` | 409 | Same name/time/venue combination exists |
| `FORBIDDEN` | 403 | Admin role is not President or Vice-President |

---

#### `PUT /events/:id`
Update an existing event's details.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1 or 2

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body** (all fields optional):
```json
{
  "eventName": "Updated Conference Name",
  "description": "Updated description",
  "startTime": "2026-05-20T09:00:00",
  "endTime": "2026-05-20T17:00:00",
  "maxSlots": 250,
  "registrationFee": 149.00,
  "venueID": 2
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": { "...updated event fields..." }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `NO_UPDATE_FIELDS` | 400 | No valid fields sent |
| `EVENT_NOT_FOUND` | 404 | Event ID does not exist |
| `FORBIDDEN` | 403 | Insufficient role |

---

#### `POST /events/:id/publish`
Publish an event, making it visible to users.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1 or 2

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Event published successfully",
  "data": { "...event with IsPublished: true..." }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `EVENT_ALREADY_PUBLISHED` | 409 | Event is already published |
| `INCOMPLETE_EVENT` | 400 | Event is missing required fields |

---

#### `POST /events/:id/unpublish`
Unpublish an event, hiding it from users.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1 or 2

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Response `200`:**
```json
{
  "success": true,
  "message": "Event unpublished successfully",
  "data": { "...event with IsPublished: false..." }
}
```

---

#### `DELETE /events/:id`
Delete an event. Only possible if the event is unpublished and has no confirmed registrations.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1 or 2

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Response `200`:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `EVENT_ALREADY_PUBLISHED` | 409 | Event is published. Unpublish it first |
| `EVENT_HAS_REGISTRATIONS` | 409 | Event has confirmed registrations |
| `EVENT_NOT_FOUND` | 404 | Event ID does not exist |

---

#### `POST /events/:id/upload-qrcode`
Upload a QR code image for an event. The QR code will be displayed to users during registration to scan for payment.

**Authentication:** Required (Admin JWT)  
**Authorization:** `roleID` 1, 2, or 3 (Any admin)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `qrcode` | file | ✅ | QR code image file (PNG, JPEG, or WebP) |

**File Constraints:**
- Maximum file size: 5 MB
- Allowed formats: PNG, JPEG, WebP

**Response `200`:**
```json
{
  "success": true,
  "message": "QR code uploaded successfully",
  "data": {
    "EventID": 3,
    "EventName": "Hackathon 2026",
    "Description": "Annual hackathon",
    "StartTime": "2026-04-10T09:00:00.000Z",
    "EndTime": "2026-04-10T18:00:00.000Z",
    "MaxSlots": 100,
    "RegistrationFee": "199.00",
    "QRCodeURL": "https://storage.supabase.co/...",
    "Status": "Open",
    "IsPublished": true,
    "VenueID": 1,
    "CreatedAt": "2026-03-01T10:00:00.000Z"
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `MISSING_FILE` | 400 | QR code file not provided |
| `INVALID_FILE_TYPE` | 400 | File is not an image (PNG, JPEG, or WebP) |
| `EVENT_NOT_FOUND` | 404 | Event ID does not exist |

---

#### `GET /events/:id/registrations`
Get all registrations associated with a specific event.

**Authentication:** Required (Admin JWT)  
**Authorization:** Any valid admin

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Response `200`:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "RegID": 25,
      "UserID": 42,
      "EventID": 3,
      "RegStatus": "Confirmed",
      "RegDate": "2026-03-01T09:00:00.000Z",
      "FullName": "Jane Smith",
      "Email": "jane@example.com",
      "StudentID": "CS2024001"
    }
  ]
}
```

---

#### `POST /events/:id/register`
Register the authenticated user for an event. Creates a pending registration and payment record. Returns a QR code URL for payment.

**Authentication:** Required (User JWT)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Event's unique ID |

**Headers:**
```
Authorization: Bearer <user_jwt_token>
```

**No request body required.**

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration initiated. Scan the QR code and upload payment proof to confirm.",
  "data": {
    "registrationId": 25,
    "paymentId": 10,
    "amount": 199,
    "qrCodeUrl": "https://storage.supabase.co/qr/event3.png",
    "event": {
      "eventId": 3,
      "eventName": "Hackathon 2026"
    },
    "registration": {
      "regId": 25,
      "regDate": "2026-03-01T09:00:00.000Z",
      "regStatus": "Pending"
    },
    "instructions": "Scan the QR code to complete your payment, then upload a screenshot as proof."
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `EVENT_NOT_FOUND` | 404 | Event does not exist |
| `EVENT_NOT_OPEN` | 400 | Event is not open/published |
| `ALREADY_REGISTERED` | 409 | User already has an active registration |
| `EVENT_FULL` | 409 | Event is at max capacity |

---

#### `GET /events/venues/all`
Retrieve all available venues.

**Authentication:** Required (Admin JWT)

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "VenueID": 1,
      "VenueName": "Main Auditorium",
      "Capacity": 500,
      "Location": "Block A, Ground Floor"
    }
  ]
}
```

---

#### `GET /events/venues/:id`
Retrieve a single venue by ID.

**Authentication:** Required (Admin JWT)

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Venue's unique ID |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "VenueID": 1,
    "VenueName": "Main Auditorium",
    "Capacity": 500,
    "Location": "Block A, Ground Floor"
  }
}
```

---

### Payments

#### `POST /payments/:paymentId/screenshot`
Upload a payment screenshot as proof after scanning the QR code. Transitions the payment to `UnderReview` status.

**Authentication:** Required (User JWT — owner of the payment only)  
**Content-Type:** `multipart/form-data`

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `paymentId` | integer | Payment record ID (returned from `/events/:id/register`) |

**Headers:**
```
Authorization: Bearer <user_jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `screenshot` | file | ✅ | JPEG, PNG, or WebP. Max 5 MB |

**Response `200`:**
```json
{
  "success": true,
  "message": "Screenshot uploaded. Your payment is under review.",
  "data": {
    "payment": {
      "PayID": 10,
      "RegID": 25,
      "Amount": "199.00",
      "PaymentStatus": "UnderReview",
      "ScreenshotURL": "https://storage.supabase.co/screenshots/pay_10_42_1234567890.jpg",
      "CreatedAt": "2026-03-01T09:00:00.000Z"
    }
  }
}
```

**Common Errors:**
| Code | HTTP | Scenario |
|------|------|----------|
| `PAYMENT_NOT_FOUND` | 404 | Payment ID does not exist |
| `FORBIDDEN` | 403 | Payment belongs to another user |
| `INVALID_STATUS_TRANSITION` | 409 | Payment is not in `Pending` or `Failed` status |
| `INVALID_INPUT` | 400 | No file uploaded or unsupported file type |
| `INVALID_INPUT` | 400 | File exceeds 5 MB limit |

---

## Payment Flow (End-to-End)

```
User                          API                          Admin
 |                             |                              |
 |-- POST /users/login ------> |                              |
 |<-- { user_jwt_token } ------|                              |
 |                             |                              |
 |-- POST /events/:id/register |                              |
 |   (Bearer user_jwt_token) ->|                              |
 |<-- { paymentId, qrCodeURL } |                              |
 |                             |                              |
 | [User scans QR and pays]    |                              |
 |                             |                              |
 |-- POST /payments/:paymentId/screenshot                     |
 |   (multipart: screenshot) ->|                              |
 |<-- { PaymentStatus:         |                              |
 |      "UnderReview" } -------|                              |
 |                             |                              |
 |                             |-- GET /admin/payments/review |
 |                             |<-- [list of UnderReview] ----|
 |                             |                              |
 |                             |-- PUT /admin/payments/:id/approve
 |                             |   OR                         |
 |                             |-- PUT /admin/payments/:id/reject
 |                             |<-- { Registration: Confirmed |
 |                             |      OR Cancelled } ---------|
```

### Payment Status Lifecycle

```
Pending → UnderReview → Success (Confirmed registration)
                      ↘ Failed  (Cancelled registration — user can re-upload)
```

---

## Role-Based Access Control

| roleID | Role | Permissions |
|--------|------|------------|
| 1 | President | Full access: all admin + event management + payment review + update any admin |
| 2 | Vice-President | Event management (CRUD, publish/unpublish) + payment review |
| 3 | Core Member / Event Manager | Payment review (list, approve, reject) only |
| — | Authenticated User | Register for events, upload screenshots, view/update own profile |
| — | Public | View published events, user register/login, admin login/onboard |

### Endpoint Permission Matrix

| Endpoint | Public | User JWT | Admin (Role 3) | Admin (Role 2) | Admin (Role 1) |
|----------|--------|----------|---------------|---------------|---------------|
| `GET /events?status=Open&isPublished=true` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /events` (all other queries) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `GET /events/:id` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `POST /events/:id/register` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `POST /payments/:id/screenshot` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `GET /admin/payments/review` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PUT /admin/payments/:id/approve` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PUT /admin/payments/:id/reject` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `POST /events` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `PUT /events/:id` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `DELETE /events/:id` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /events/:id/publish` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `POST /events/:id/unpublish` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `GET /events/:id/registrations` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `GET /events/venues/all` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PUT /admin/:adminId` (own) | ❌ | ❌ | ✅ | ✅ | ✅ |
| `PUT /admin/:adminId` (any) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Postman Setup Guide

### Step 1 — Import Environment Variables

1. Open Postman → click **Environments** in the left sidebar
2. Click **+** to create a new environment, name it **GFG Event Management**
3. Add the following variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `userToken` | *(leave empty)* | *(filled after login)* |
| `adminToken` | *(leave empty)* | *(filled after login)* |
| `userId` | *(leave empty)* | *(filled after register)* |
| `adminId` | *(leave empty)* | *(filled after onboard)* |
| `eventId` | *(leave empty)* | *(filled after event creation)* |
| `paymentId` | *(leave empty)* | *(filled after registration)* |

4. Click **Save** and select this environment from the top-right dropdown

---

### Step 2 — Create a Postman Collection

1. Click **Collections** → **+** → name it **GFG Event Management API**
2. Organize requests into folders matching the sections below

---

### Step 3 — Configure Authorization

#### For User-Protected Requests:
1. Open the request → **Authorization** tab
2. Select **Bearer Token**
3. Set Token to: `{{userToken}}`

#### For Admin-Protected Requests:
1. Open the request → **Authorization** tab
2. Select **Bearer Token**
3. Set Token to: `{{adminToken}}`

> **Tip:** You can set the Authorization at the Collection or Folder level so all requests inside inherit it automatically.

---

### Step 4 — Auto-Save Tokens with Tests Scripts

After setting up the login requests, add the following to their **Tests** tab to automatically save tokens to environment variables:

#### For `POST /users/login` or `POST /users/register`:
```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("userToken", response.data.token.token);
    pm.environment.set("userId", response.data.user.userID);
    console.log("User token saved:", response.data.token.token.substring(0, 30) + "...");
}
```

#### For `POST /admin/login` or `POST /admin/onboard`:
```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("adminToken", response.data.token.token);
    pm.environment.set("adminId", response.data.admin.adminID);
    console.log("Admin token saved:", response.data.token.token.substring(0, 30) + "...");
}
```

#### After `POST /events/:id/register`:
```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("paymentId", response.data.paymentId);
    console.log("Payment ID saved:", response.data.paymentId);
}
```

#### After `POST /events` (create event):
```javascript
const response = pm.response.json();
if (response.success) {
    pm.environment.set("eventId", response.data.EventID);
    console.log("Event ID saved:", response.data.EventID);
}
```

---

### Step 5 — Sample Requests in Postman

#### Request 1: Check Health
```
Method:  GET
URL:     {{baseUrl}}/health
Auth:    None
Body:    None
```

---

#### Request 2: Register User
```
Method:  POST
URL:     {{baseUrl}}/users/register
Auth:    None
Headers: Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "studentID": "CS2024001",
  "fullName": "Jane Smith",
  "username": "janesmith",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "phone": "+919876543210",
  "branchID": 1,
  "graduationYear": 2027,
  "uniID": 1
}
```

---

#### Request 3: User Login
```
Method:  POST
URL:     {{baseUrl}}/users/login
Auth:    None
Headers: Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass@123"
}
```

---

#### Request 4: Admin Onboard
```
Method:  POST
URL:     {{baseUrl}}/admin/onboard
Auth:    None
Headers: Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "studentID": "CS2024002",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "AdminPass@123",
  "phone": "+919876543211",
  "roleID": 2,
  "branchID": 1,
  "graduationYear": 2026,
  "invitationCode": "INVITE2024ABC"
}
```

---

#### Request 5: Admin Login
```
Method:  POST
URL:     {{baseUrl}}/admin/login
Auth:    None
Headers: Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "AdminPass@123"
}
```

---

#### Request 6: Get All Events (Public)
```
Method:  GET
URL:     {{baseUrl}}/events
Auth:    None
```
**Optional query params:** `?status=Open`, `?isPublished=true`, `?venueID=1`

---

#### Request 7: Create Event (Admin)
```
Method:  POST
URL:     {{baseUrl}}/events
Auth:    Bearer {{adminToken}}
Headers: Content-Type: application/json
```
**Body (raw JSON):**
```json
{
  "eventName": "Hackathon 2026",
  "description": "24-hour coding hackathon",
  "startTime": "2026-04-10T09:00:00",
  "endTime": "2026-04-10T21:00:00",
  "maxSlots": 100,
  "registrationFee": 199,
  "venueID": 1
}
```

---

#### Request 8: Publish Event (Admin)
```
Method:  POST
URL:     {{baseUrl}}/events/{{eventId}}/publish
Auth:    Bearer {{adminToken}}
Body:    None
```

---

#### Request 9: Register for Event (User)
```
Method:  POST
URL:     {{baseUrl}}/events/{{eventId}}/register
Auth:    Bearer {{userToken}}
Body:    None
```

---

#### Request 10: Upload Payment Screenshot (User)
```
Method:  POST
URL:     {{baseUrl}}/payments/{{paymentId}}/screenshot
Auth:    Bearer {{userToken}}
Body:    form-data
```
**Form Data:**
| Key | Type | Value |
|-----|------|-------|
| `screenshot` | File | Select a JPEG/PNG image from your machine (max 5 MB) |

> In Postman, change Body type to **form-data**, add key `screenshot`, and change the type dropdown from **Text** to **File**.

---

#### Request 11: List Payments Under Review (Admin)
```
Method:  GET
URL:     {{baseUrl}}/admin/payments/review
Auth:    Bearer {{adminToken}}
Body:    None
```

---

#### Request 12: Approve Payment (Admin)
```
Method:  PUT
URL:     {{baseUrl}}/admin/payments/{{paymentId}}/approve
Auth:    Bearer {{adminToken}}
Body:    None
```

---

#### Request 13: Reject Payment (Admin)
```
Method:  PUT
URL:     {{baseUrl}}/admin/payments/{{paymentId}}/reject
Auth:    Bearer {{adminToken}}
Headers: Content-Type: application/json
```
**Body (raw JSON — optional):**
```json
{
  "reason": "Screenshot is blurry and unreadable"
}
```

---

### Step 6 — Common Postman Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Token is expired or not set — re-login and ensure the Tests script ran |
| `403 Forbidden` | Token does not have required role for this endpoint |
| `400 Invalid JSON` | Ensure `Content-Type: application/json` header is set for JSON bodies |
| `404 Not Found` | Check the URL path and that environment variables (IDs) are correctly set |
| `409 Conflict` | Resource already exists (duplicate email, student ID, etc.) |
| Environment variables empty | Re-run login/register requests so the Tests scripts populate the variables |
| Screenshot upload fails | Ensure Body type is `form-data` (not `raw`) and field type is `File` |
| Token missing for admin routes | Ensure you used `POST /admin/login` not `POST /users/login` |

---

### Step 7 — Recommended Testing Order

Follow this sequence for a complete end-to-end test pass:

```
1.  GET    /health                          → verify server + DB are up
2.  POST   /users/register                  → create user account
3.  POST   /admin/onboard                   → create admin account (needs invite code)
4.  POST   /admin/login                     → get adminToken
5.  GET    /events/venues/all               → list venues (note VenueID)
6.  POST   /events                          → create event (use VenueID)
7.  POST   /events/:id/publish              → make event visible
8.  GET    /events                          → confirm event appears publicly
9.  POST   /users/login                     → get userToken
10. POST   /events/:id/register             → register user (get paymentId)
11. POST   /payments/:paymentId/screenshot  → upload screenshot
12. GET    /admin/payments/review           → admin sees pending review
13. PUT    /admin/payments/:id/approve      → approve payment
14. GET    /events/:id/registrations        → confirm registration is Confirmed
```

---

*Documentation generated for GFG Event Management API v1.0.0 — March 2026*
