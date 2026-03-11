/**
 * Registration Service
 * Handles business logic for event registration (manual QR payment flow).
 *
 * Flow:
 *  1. POST /events/:id/register  → initiateRegistration()
 *       - Validates event is Open + published and has capacity
 *       - Inserts Registration (RegStatus = 'Pending')
 *       - Creates a Pending Payment record
 *       - Returns { registrationId, paymentId, qrCodeUrl, amount }
 */
import pool from '../db.js';
import {
  APIError,
  createNotFoundError,
  createConflictError,
  createServerError,
} from '../utils/errors.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { createPendingPayment } from './paymentService.js';

// ---------------------------------------------------------------------------
// Initiate Registration
// Inserts Pending Registration + Pending Payment, returns QR code URL.
// ---------------------------------------------------------------------------
export const initiateRegistration = async (userId, eventId) => {
  // -- Fetch event --
  const eventQuery = `
    SELECT "EventID", "EventName", "RegistrationFee", "MaxSlots",
           "Status", "IsPublished", "QRCodeURL"
    FROM "Event"
    WHERE "EventID" = $1
    LIMIT 1
  `;
  const eventResult = await pool.query(eventQuery, [Number(eventId)]);

  if (eventResult.rowCount === 0) {
    throw createNotFoundError(ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
  }

  const event = eventResult.rows[0];

  // -- Check event is open for registration --
  if (event.Status !== 'Open' || !event.IsPublished) {
    throw new APIError(
      400,
      ERROR_CODES.EVENT_NOT_OPEN,
      `Event is not open for registration (status: ${event.Status}, published: ${event.IsPublished})`
    );
  }

  // -- Check for duplicate registration (exclude Cancelled so they can re-register) --
  const dupQuery = `
    SELECT 1 FROM "Registration"
    WHERE "UserID" = $1 AND "EventID" = $2 AND "RegStatus" != 'Cancelled'
    LIMIT 1
  `;
  const dup = await pool.query(dupQuery, [userId, Number(eventId)]);
  if (dup.rowCount > 0) {
    throw createConflictError(ERROR_CODES.ALREADY_REGISTERED, 'You are already registered for this event');
  }

  // -- Check capacity --
  const countQuery = `
    SELECT COUNT(*) AS registered
    FROM "Registration"
    WHERE "EventID" = $1 AND "RegStatus" != 'Cancelled'
  `;
  const countResult = await pool.query(countQuery, [Number(eventId)]);
  const registered = parseInt(countResult.rows[0].registered, 10);

  if (event.MaxSlots !== null && registered >= event.MaxSlots) {
    throw createConflictError(ERROR_CODES.EVENT_FULL, 'Event has reached maximum capacity');
  }

  // -- Insert Registration as Pending --
  const regInsert = `
    INSERT INTO "Registration" ("UserID", "EventID", "RegStatus")
    VALUES ($1, $2, 'Pending')
    RETURNING "RegID", "UserID", "EventID", "RegDate", "RegStatus"
  `;
  const regResult = await pool.query(regInsert, [userId, Number(eventId)]);
  const registration = regResult.rows[0];

  // -- Create Pending Payment record --
  const fee = parseFloat(event.RegistrationFee) || 0;
  let payment;
  try {
    payment = await createPendingPayment(registration.RegID, fee);
  } catch (err) {
    // Rollback the pending registration if payment record creation fails
    await pool.query(`DELETE FROM "Registration" WHERE "RegID" = $1`, [registration.RegID]);
    throw createServerError(ERROR_CODES.TRANSACTION_FAILED, 'Failed to create payment record');
  }

  return {
    registrationId: registration.RegID,
    paymentId: payment.PayID,
    amount: fee,
    qrCodeUrl: event.QRCodeURL || null,
    event: {
      eventId: event.EventID,
      eventName: event.EventName,
    },
    registration: {
      regId: registration.RegID,
      regDate: registration.RegDate,
      regStatus: registration.RegStatus,
    },
    instructions: fee > 0
      ? 'Scan the QR code to complete your payment, then upload a screenshot as proof.'
      : 'This is a free event. Your registration is pending admin confirmation.',
  };
};

// ---------------------------------------------------------------------------
// Get event name by registration ID (used for email notifications)
// ---------------------------------------------------------------------------
export const getEventNameByRegId = async (regId) => {
  const query = `
    SELECT e."EventName"
    FROM "Registration" r
    JOIN "Event" e ON e."EventID" = r."EventID"
    WHERE r."RegID" = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [Number(regId)]);
  return result.rows[0]?.EventName ?? null;
};

// ---------------------------------------------------------------------------
// Get user email, full name, and event name by registration ID
// Used for payment approval / rejection email notifications
// ---------------------------------------------------------------------------
export const getRegistrationEmailContext = async (regId) => {
  const query = `
    SELECT
      u."Email"     AS "userEmail",
      u."FullName"  AS "userFullName",
      e."EventName" AS "eventName"
    FROM "Registration" r
    JOIN "User"  u ON u."UserID"  = r."UserID"
    JOIN "Event" e ON e."EventID" = r."EventID"
    WHERE r."RegID" = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [Number(regId)]);
  return result.rows[0] ?? null;
};
