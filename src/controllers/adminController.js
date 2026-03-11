/**
 * Admin Onboarding Controller
 * Handles HTTP requests for admin registration endpoint
 */
import { onboardAdmin, loginAdmin, updateAdmin, validateRole, validateBranch } from '../services/adminOnboardingService.js';
import { generateJWT, createTokenResponse } from '../utils/jwt.js';
import { createValidationError } from '../utils/errors.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import {
  listPendingReviews,
  approvePayment,
  rejectPayment,
} from '../services/paymentService.js';
import { sendAdminRegistrationEmail, sendAdminProfileUpdateEmail, sendPaymentApprovedEmail, sendPaymentRejectedEmail } from '../utils/emailService.js';
import { getRegistrationEmailContext } from '../services/registrationService.js';

/**
 * POST /admin/onboard
 * Creates a new admin account with invitation code validation
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "Admin onboarded successfully",
 *   "data": {
 *     "admin": { ...admin details... },
 *     "token": { ...jwt token... }
 *   }
 * }
 */
export const onboardAdminHandler = async (req, res, next) => {
  try {
    // Get validated data from middleware
    const validatedData = req.validated;

    // Execute onboarding service
    const admin = await onboardAdmin(validatedData);

    // Generate JWT token
    const jwtToken = generateJWT(admin);
    const tokenResponse = createTokenResponse(jwtToken);

    // Send admin onboarding confirmation email (non-blocking soft-fail)
    const [roleData, branchData] = await Promise.all([
      validateRole(admin.RoleID),
      validateBranch(admin.BranchID),
    ]);

    const emailResult = await sendAdminRegistrationEmail({
      to: admin.Email,
      fullName: admin.FullName,
      studentID: admin.StudentID,
      roleName: roleData.RoleName,
      branchName: branchData?.BranchName ?? null,
      graduationYear: admin.GraduationYear,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Admin onboarded successfully',
      data: {
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
        admin: {
          adminID: admin.AdminID,
          studentID: admin.StudentID,
          fullName: admin.FullName,
          email: admin.Email,
          phone: admin.Phone,
          roleID: admin.RoleID,
          branchID: admin.BranchID,
          graduationYear: admin.GraduationYear,
          currentYear: admin.CurrentYear,
          createdAt: admin.CreatedAt,
        },
        token: tokenResponse,
      },
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

/**
 * POST /admin/login
 * Authenticates admin with email and password
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "admin": { ...admin details... },
 *     "token": { ...jwt token... }
 *   }
 * }
 */
export const loginAdminHandler = async (req, res, next) => {
  try {
    const validatedData = req.validated;

    // Execute login service
    const admin = await loginAdmin(validatedData.email, validatedData.password);

    // Generate JWT token
    const jwtToken = generateJWT(admin);
    const tokenResponse = createTokenResponse(jwtToken);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          adminID: admin.AdminID,
          studentID: admin.StudentID,
          fullName: admin.FullName,
          email: admin.Email,
          phone: admin.Phone,
          roleID: admin.RoleID,
          branchID: admin.BranchID,
          graduationYear: admin.GraduationYear,
          currentYear: admin.CurrentYear,
          createdAt: admin.CreatedAt,
        },
        token: tokenResponse,
      },
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

/**
 * PUT /admin/:adminId
 * Updates admin details (fullName, phone, password)
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Admin details updated successfully",
 *   "data": {
 *     "admin": { ...updated admin details... }
 *   }
 * }
 */
export const updateAdminHandler = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const validatedData = req.validated;

    // Validate adminId is a number
    const id = parseInt(adminId, 10);
    if (isNaN(id) || id <= 0) {
      return next(createValidationError(ERROR_CODES.INVALID_INPUT, 'Invalid admin ID'));
    }

    // Execute update service
    const admin = await updateAdmin(id, validatedData);

    // Build summary of changed fields for the email (password value is never sent)
    const updatedFields = {};
    if (validatedData.fullName) updatedFields.fullName = admin.FullName;
    if (validatedData.phone)    updatedFields.phone = admin.Phone;
    if (validatedData.password) updatedFields.passwordChanged = true;

    // Send profile update notification email (non-blocking soft-fail)
    const emailResult = await sendAdminProfileUpdateEmail({
      to: admin.Email,
      fullName: admin.FullName,
      updatedFields,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Admin details updated successfully',
      data: {
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
        admin: {
          adminID: admin.AdminID,
          studentID: admin.StudentID,
          fullName: admin.FullName,
          email: admin.Email,
          phone: admin.Phone,
          roleID: admin.RoleID,
          branchID: admin.BranchID,
          graduationYear: admin.GraduationYear,
          currentYear: admin.CurrentYear,
          createdAt: admin.CreatedAt,
          updatedAt: admin.UpdatedAt,
        },
      },
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /admin/payments/review
// List all payments awaiting screenshot review (PaymentStatus = 'UnderReview')
// Requires: Admin JWT, RoleID 1 / 2 / 3
// ---------------------------------------------------------------------------
export const listPaymentReviewsHandler = async (req, res, next) => {
  try {
    const reviews = await listPendingReviews();
    return res.status(200).json({
      success: true,
      message: `${reviews.length} payment(s) pending review`,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /admin/payments/:paymentId/approve
// Approve screenshot → Payment: Success, Registration: Confirmed
// Requires: Admin JWT, RoleID 1 / 2 / 3
// ---------------------------------------------------------------------------
export const approvePaymentHandler = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const id = parseInt(paymentId, 10);

    if (isNaN(id) || id <= 0) {
      return next(createValidationError(ERROR_CODES.INVALID_INPUT, 'Invalid payment ID'));
    }

    const result = await approvePayment(id);

    // Send payment approved email (non-blocking soft-fail)
    const ctx = await getRegistrationEmailContext(result.registration.RegID);
    if (ctx) {
      await sendPaymentApprovedEmail({
        to: ctx.userEmail,
        fullName: ctx.userFullName,
        eventName: ctx.eventName,
        amount: parseFloat(result.payment.Amount) || 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment approved. Registration confirmed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /admin/payments/:paymentId/reject
// Reject screenshot → Payment: Failed, Registration: Cancelled
// Body (optional): { "reason": "Screenshot is blurry" }
// Requires: Admin JWT, RoleID 1 / 2 / 3
// ---------------------------------------------------------------------------
export const rejectPaymentHandler = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const id = parseInt(paymentId, 10);

    if (isNaN(id) || id <= 0) {
      return next(createValidationError(ERROR_CODES.INVALID_INPUT, 'Invalid payment ID'));
    }

    const { reason } = req.body || {};
    const result = await rejectPayment(id, reason);

    // Send payment rejected email (non-blocking soft-fail)
    const ctx = await getRegistrationEmailContext(result.registration.RegID);
    if (ctx) {
      await sendPaymentRejectedEmail({
        to: ctx.userEmail,
        fullName: ctx.userFullName,
        eventName: ctx.eventName,
        amount: parseFloat(result.payment.Amount) || 0,
        reason: reason || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment rejected. Registration cancelled.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
