/**
 * Email Service
 * Triggers the Google Apps Script email API to send transactional emails.
 * All functions are non-throwing — errors are logged and returned as { success: false }.
 */
import axios from 'axios';

const APPS_SCRIPT_EMAIL_URL = process.env.APPS_SCRIPT_BASE_URL;
/**
 * Send a registration confirmation email to a newly registered user.
 *
 * @param {object} params
 * @param {string} params.to         - Recipient email address
 * @param {string} params.fullName   - User's full name
 * @param {string} params.studentID  - User's student ID
 * @param {string} params.username   - User's username
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendUserRegistrationEmail = async ({ to, fullName, studentID, username }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendUserRegistrationEmail`;
    
    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        studentID,
        username,
        emailType: 'registration_confirmation',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Registration confirmation email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send registration confirmation email:', error.message);
    return { success: false };
  }
};

/**
 * Send a profile update notification email to a user.
 *
 * @param {object} params
 * @param {string} params.to            - Recipient email address
 * @param {string} params.fullName      - User's current full name
 * @param {string} params.username      - User's username
 * @param {object} params.updatedFields - Changed fields: { fullName?, phone?, passwordChanged? }
 *                                        Password value is never included.
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendUserProfileUpdateEmail = async ({ to, fullName, username, updatedFields }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendUserUpdateProfileEmail`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        username,
        updatedFields,
        emailType: 'profile_update_confirmation',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Profile update email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send profile update email:', error.message);
    return { success: false };
  }
};

/**
 * Send an onboarding confirmation email to a newly onboarded admin.
 *
 * @param {object} params
 * @param {string} params.to             - Recipient email address
 * @param {string} params.fullName       - Admin's full name
 * @param {string} params.studentID      - Admin's student ID
 * @param {string} params.roleName       - Admin's role name (e.g. "Super Admin")
 * @param {string|null} params.branchName - Admin's branch name, or null if not set
 * @param {number} params.graduationYear  - Admin's graduation year
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendAdminRegistrationEmail = async ({ to, fullName, studentID, roleName, branchName, graduationYear }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendAdminRegistrationEmail`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        studentID,
        roleName,
        branchName,
        graduationYear,
        emailType: 'admin_registration_confirmation',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Admin onboarding email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send admin onboarding email:', error.message);
    return { success: false };
  }
};

/**
 * Send a profile update notification email to an admin.
 *
 * @param {object} params
 * @param {string} params.to            - Recipient email address
 * @param {string} params.fullName      - Admin's current full name
 * @param {object} params.updatedFields - Changed fields: { fullName?, phone?, passwordChanged? }
 *                                        Password value is never included.
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendAdminProfileUpdateEmail = async ({ to, fullName, updatedFields }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendAdminUpdateProfileEmail`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        updatedFields,
        emailType: 'admin_profile_update_confirmation',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Admin profile update email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send admin profile update email:', error.message);
    return { success: false };
  }
};

/**
 * Send an event registration pending email to a user.
 *
 * @param {object} params
 * @param {string} params.to         - Recipient email address
 * @param {string} params.fullName   - User's full name
 * @param {string} params.eventName  - Name of the event registered for
 * @param {number} params.amount     - Registration fee amount
 * @param {string|null} params.qrCodeUrl - QR code URL for payment
 * @param {string} params.regDate    - Registration date (ISO string)
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendEventRegistrationPendingEmail = async ({ to, fullName, eventName, amount, qrCodeUrl, regDate }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendUserEventRegistrationPending`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        eventName,
        amount,
        qrCodeUrl,
        regDate,
        emailType: 'event_registration_pending',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Event registration pending email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send event registration pending email:', error.message);
    return { success: false };
  }
};

/**
 * Send a payment screenshot upload confirmation email to a user.
 *
 * @param {object} params
 * @param {string} params.to        - Recipient email address
 * @param {string} params.fullName  - User's full name
 * @param {string} params.eventName - Name of the event
 * @param {number} params.amount    - Payment amount
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 *   Never rejects — failures are caught and returned as { success: false }.
 */
export const sendPaymentScreenshotUploadedEmail = async ({ to, fullName, eventName, amount }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendPaymentScreenshotUploaded`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        eventName,
        amount,
        emailType: 'payment_screenshot_uploaded',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Payment screenshot uploaded email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send payment screenshot uploaded email:', error.message);
    return { success: false };
  }
};

/**
 * Send a payment approved / registration confirmed email to a participant.
 *
 * @param {object} params
 * @param {string} params.to        - Recipient email address
 * @param {string} params.fullName  - Participant's full name
 * @param {string} params.eventName - Name of the event
 * @param {number} params.amount    - Payment amount
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export const sendPaymentApprovedEmail = async ({ to, fullName, eventName, amount }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendPaymentApproved`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        eventName,
        amount,
        emailType: 'payment_approved',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Payment approved email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send payment approved email:', error.message);
    return { success: false };
  }
};

/**
 * Send a payment rejected / registration unsuccessful email to a participant.
 *
 * @param {object} params
 * @param {string} params.to        - Recipient email address
 * @param {string} params.fullName  - Participant's full name
 * @param {string} params.eventName - Name of the event
 * @param {number} params.amount    - Payment amount
 * @param {string} [params.reason]  - Rejection reason provided by admin
 *
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export const sendPaymentRejectedEmail = async ({ to, fullName, eventName, amount, reason }) => {
  try {
    const fullUrl = `${APPS_SCRIPT_EMAIL_URL}?route=sendPaymentRejected`;
    console.log('[emailService] Hitting Apps Script URL:', fullUrl);

    const response = await axios.post(
      fullUrl,
      {
        api_key: process.env.APPS_SCRIPT_API_KEY,
        to,
        fullName,
        eventName,
        amount,
        reason: reason || null,
        emailType: 'payment_rejected',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    if (response.data?.success === true) {
      console.log('[emailService] Payment rejected email sent successfully to:', to, '| messageId:', response.data.messageId);
      return { success: true, messageId: response.data.messageId };
    }

    console.error('[emailService] Apps Script returned unsuccessful response:', response.data);
    return { success: false };
  } catch (error) {
    console.error('[emailService] Failed to send payment rejected email:', error.message);
    return { success: false };
  }
};
