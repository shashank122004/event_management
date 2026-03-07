/**
 * Authentication and Authorization Middleware
 * Handles JWT verification and access control
 */
import { verifyJWT } from '../utils/jwt.js';
import { createUnauthorizedError, createForbiddenError } from '../utils/errors.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Generic Authentication Middleware for Users and Admins
 * Verifies JWT token from Authorization header and extracts user/admin data
 * Expects: Authorization: Bearer <token>
 * Attaches decoded JWT data to req.auth
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError(
        ERROR_CODES.UNAUTHORIZED,
        'Missing or invalid Authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyJWT(token);

    // Extract ID and force numeric type to prevent "7" !== 7 issues
    const rawID = decoded.userID || decoded.UserID || decoded.adminID || decoded.AdminID;
    let extractedID = rawID !== undefined ? parseInt(rawID, 10) : undefined;

    // Fallback: Try to parse ID from standard 'sub' claim (e.g., "user-7" -> 7)
    if (isNaN(extractedID) || extractedID === undefined) {
      if (decoded.sub) {
        const match = decoded.sub.match(/\d+$/);
        if (match) {
          extractedID = parseInt(match[0], 10);
        }
      }
    }

    // Attach decoded data to request object
    req.auth = {
      userID: decoded.userID || decoded.UserID ? parseInt(decoded.userID || decoded.UserID, 10) : undefined,
      adminID: decoded.adminID || decoded.AdminID ? parseInt(decoded.adminID || decoded.AdminID, 10) : undefined,
      sub: extractedID,
      email: decoded.email || decoded.Email,
      roleID: parseInt(decoded.roleID || decoded.RoleID || 2, 10),
      fullName: decoded.fullName || decoded.FullName,
      studentID: decoded.studentID || decoded.StudentID,
    };

    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
    } else {
      next(createUnauthorizedError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token'));
    }
  }
};

/**
 * Authentication Middleware for Admins
 * Verifies JWT token from Authorization header and extracts admin data
 * Expects: Authorization: Bearer <token>
 */
export const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError(
        ERROR_CODES.UNAUTHORIZED,
        'Missing or invalid Authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyJWT(token);

    // Reject user tokens — admin routes require a token issued for an admin account
    if (!decoded.adminID) {
      throw createForbiddenError(
        ERROR_CODES.FORBIDDEN,
        'Access denied: admin token required'
      );
    }

    // Attach admin data to request object
    req.user = {
      AdminID: decoded.adminID,
      Email: decoded.email,
      RoleID: decoded.roleID,
    };

    next();
  } catch (error) {
    if (error.statusCode) {
      next(error);
    } else {
      next(createUnauthorizedError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token'));
    }
  }
};

/**
 * Conditional Authentication Middleware for Event Queries
 * Requires admin JWT for all queries EXCEPT:
 *   - status=Open AND isPublished=true (public access to published open events)
 * All other queries require admin authentication.
 */
export const authenticateAdminForRestrictedQuery = (req, res, next) => {
  const { status, isPublished } = req.query;
  const isPublicQuery = status === 'Open' && isPublished === 'true';

  // Allow public access only for status=Open&isPublished=true
  if (isPublicQuery) {
    return next();
  }

  // All other queries require admin authentication
  return authenticateAdmin(req, res, next);
};

/**
 * Authorization Middleware
 * Ensures user can only update their own profile or has admin role
 * RoleID 1 = Super Admin (can update any admin)
 * Other roles = Can only update their own profile
 */
export const authorizeUpdateAdmin = (req, res, next) => {
  try {
    const { adminId } = req.params;
    const targetAdminID = parseInt(adminId, 10);
    const currentAdminID = req.user.AdminID;
    const currentRoleID = req.user.RoleID;

    // Check if admin is authorized
    const isSuperAdmin = currentRoleID === 1;
    const isOwnProfile = currentAdminID === targetAdminID;

    if (!isSuperAdmin && !isOwnProfile) {
      throw createForbiddenError(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to update this profile'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization Middleware for Event Management
 * Restricts event management operations to admins with RoleID 1 or 2
 * RoleID 1 = President
 * RoleID 2 = Vice-President
 * Operations: Create, Update, Delete, Publish, Unpublish events
 */
export const authorizeEventManagement = (req, res, next) => {
  try {
    const currentRoleID = req.user.RoleID;

    // Check if admin has permission (RoleID 1 or 2)
    if (currentRoleID !== 1 && currentRoleID !== 2) {
      throw createForbiddenError(
        ERROR_CODES.FORBIDDEN,
        'Only President and Vice-President can manage events'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization Middleware for Admin Payment Review
 * Allows RoleID 1 (President), 2 (Vice-President), 3 (Core Member / Event Manager)
 * Operations: List, Approve, Reject payment screenshots
 */
export const authorizeAdminReview = (req, res, next) => {
  try {
    const currentRoleID = req.user.RoleID;

    if (currentRoleID !== 1 && currentRoleID !== 2 && currentRoleID !== 3) {
      throw createForbiddenError(
        ERROR_CODES.FORBIDDEN,
        'Only President, Vice-President, or Core Members can review payments'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and extracts user data
 * Expects: Authorization: Bearer <token>
 */

export const authenticateUser = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw createUnauthorizedError(
                ERROR_CODES.UNAUTHORIZED,
                'Missing or invalid Authorization header'
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyJWT(token);

        req.user = {
            userId: decoded.userID || decoded.UserID || decoded.userId,
            userName: decoded.name || decoded.fullName,
            userEmail: decoded.email,
        };

        next();
    } catch (error) {
        if (error.statusCode) {
            next(error);
        } else {
            next(createUnauthorizedError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token'));
        }
    }
};