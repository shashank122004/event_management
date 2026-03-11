/**
 * Registration Controller
 * Handlers:
 *   initiateRegistrationHandler   →  POST /events/:id/register
 *   uploadScreenshotHandler       →  POST /payments/:paymentId/screenshot
 */
import { initiateRegistration, getEventNameByRegId } from '../services/registrationService.js';
import { attachScreenshot } from '../services/paymentService.js';
import { uploadScreenshot } from '../utils/supabaseClient.js';
import { APIError } from '../utils/errors.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { sendEventRegistrationPendingEmail, sendPaymentScreenshotUploadedEmail } from '../utils/emailService.js';

// ---------------------------------------------------------------------------
// POST /events/:id/register
// Creates a Pending registration + Pending payment record.
// Returns QR code URL so the user can make the payment.
// ---------------------------------------------------------------------------
export const initiateRegistrationHandler = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId  = req.user?.userId;

    if (!userId) {
      throw new APIError(401, ERROR_CODES.UNAUTHORIZED, 'Login required');
    }
    if (!eventId || isNaN(Number(eventId))) {
      throw new APIError(400, ERROR_CODES.INVALID_INPUT, 'Event ID must be a number');
    }

    const result = await initiateRegistration(userId, eventId);

    // Send event registration pending email (non-blocking soft-fail)
    const emailResult = await sendEventRegistrationPendingEmail({
      to: req.user.userEmail,
      fullName: req.user.userName,
      eventName: result.event.eventName,
      amount: result.amount,
      qrCodeUrl: result.qrCodeUrl,
      regDate: result.registration.regDate,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration initiated. Scan the QR code and upload payment proof to confirm.',
      data: {
        ...result,
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /payments/:paymentId/screenshot
// Accepts multipart/form-data with a 'screenshot' file field.
// Uploads to Supabase Storage, sets Payment → UnderReview.
// ---------------------------------------------------------------------------
export const uploadScreenshotHandler = async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    const userId    = req.user?.userId;

    if (!userId) {
      throw new APIError(401, ERROR_CODES.UNAUTHORIZED, 'Login required');
    }
    if (!paymentId || isNaN(Number(paymentId))) {
      throw new APIError(400, ERROR_CODES.INVALID_INPUT, 'Payment ID must be a number');
    }
    if (!req.file) {
      throw new APIError(400, ERROR_CODES.INVALID_INPUT, 'Screenshot file is required (field name: screenshot)');
    }

    const { buffer, mimetype, originalname } = req.file;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(mimetype)) {
      throw new APIError(400, ERROR_CODES.INVALID_INPUT, 'Only JPEG, PNG, and WebP images are accepted');
    }

    // Build a unique filename: pay_<paymentId>_<userId>_<timestamp>.<ext>
    const ext = originalname.split('.').pop();
    const filename = `pay_${paymentId}_${userId}_${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const screenshotUrl = await uploadScreenshot(buffer, filename, mimetype);

    // Update payment record
    const payment = await attachScreenshot(Number(paymentId), userId, screenshotUrl);

    // Send screenshot upload confirmation email (non-blocking soft-fail)
    const eventName = await getEventNameByRegId(payment.RegID);
    const emailResult = await sendPaymentScreenshotUploadedEmail({
      to: req.user.userEmail,
      fullName: req.user.userName,
      eventName: eventName ?? 'your event',
      amount: parseFloat(payment.Amount) || 0,
    });

    return res.status(200).json({
      success: true,
      message: 'Screenshot uploaded. Your payment is under review.',
      data: {
        payment,
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
      },
    });
  } catch (err) {
    next(err);
  }
};

