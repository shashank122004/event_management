/**
 * User Controller
 * Handles HTTP requests for user registration, login, and profile management endpoints
 */
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
} from '../services/userRegistrationService.js';
import { generateJWT, createTokenResponse } from '../utils/jwt.js';
import { sendUserRegistrationEmail, sendUserProfileUpdateEmail } from '../utils/emailService.js';

/**
 * POST /users/register
 * Register a new user account
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": { ...user details... },
 *     "token": { ...jwt token... }
 *   }
 * }
 */
export const registerUserHandler = async (req, res, next) => {
  try {
    const validatedData = req.validated;

    // Register user
    const user = await registerUser(validatedData);

    // Generate JWT token
    const jwtToken = generateJWT({
      UserID: user.UserID,
      StudentID: user.StudentID,
      Email: user.Email,
      FullName: user.FullName,
      RoleID: 2, // Default user role ID
    });
    const tokenResponse = createTokenResponse(jwtToken);

    // Send registration confirmation email (non-blocking soft-fail)
    const emailResult = await sendUserRegistrationEmail({
      to: user.Email,
      fullName: user.FullName,
      studentID: user.StudentID,
      username: user.Username,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userID: user.UserID,
          studentID: user.StudentID,
          fullName: user.FullName,
          username: user.Username,
          email: user.Email,
          phone: user.Phone,
          branchID: user.BranchID,
          graduationYear: user.GraduationYear,
          isActive: user.IsActive,
          createdAt: user.CreatedAt,
        },
        token: tokenResponse,
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /users/login
 * Authenticate user with email and password
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { ...user details... },
 *     "token": { ...jwt token... }
 *   }
 * }
 */
export const loginUserHandler = async (req, res, next) => {
  try {
    const validatedData = req.validated;

    // Login user
    const user = await loginUser(validatedData.email, validatedData.password);

    // Generate JWT token
    const jwtToken = generateJWT({
      UserID: user.UserID,
      StudentID: user.StudentID,
      Email: user.Email,
      FullName: user.FullName,
      RoleID: 2, // Default user role ID
    });
    const tokenResponse = createTokenResponse(jwtToken);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userID: user.UserID,
          studentID: user.StudentID,
          fullName: user.FullName,
          username: user.Username,
          email: user.Email,
          phone: user.Phone,
          branchID: user.BranchID,
          graduationYear: user.GraduationYear,
          isActive: user.IsActive,
          createdAt: user.CreatedAt,
          updatedAt: user.UpdatedAt,
        },
        token: tokenResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/:userId
 * Get user profile by ID
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "User profile retrieved successfully",
 *   "data": {
 *     "user": { ...user details... }
 *   }
 * }
 */
export const getUserProfileHandler = async (req, res, next) => {
  try {
    const { userId } = req.validated;
    const { sub } = req.auth; // From auth middleware (user making the request)
    const { roleID } = req.auth;

    // Check authorization: user can view own profile or admin can view any
    if (sub !== userId && roleID !== 1) {
      // roleID 1 is super admin
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this profile',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get user
    const user = await getUserById(userId);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          userID: user.UserID,
          studentID: user.StudentID,
          fullName: user.FullName,
          username: user.Username,
          email: user.Email,
          phone: user.Phone,
          branchID: user.BranchID,
          graduationYear: user.GraduationYear,
          currentYear: user.CurrentYear,
          isActive: user.IsActive,
          createdAt: user.CreatedAt,
          updatedAt: user.UpdatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /users/:userId
 * Update user profile
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "User profile updated successfully",
 *   "data": {
 *     "user": { ...updated user details... }
 *   }
 * }
 */
export const updateUserProfileHandler = async (req, res, next) => {
  try {
    const { userId } = req.validated;
    const { sub } = req.auth;
    const { roleID } = req.auth;

    // Check authorization: user can update own profile or admin can update any
    if (sub !== userId && roleID !== 1) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this profile',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update user
    const updatedUser = await updateUserProfile(userId, req.validated);

    // Build summary of changed fields for the email (password value is never sent)
    const updatedFields = {};
    if (req.validated.fullName) updatedFields.fullName = updatedUser.FullName;
    if (req.validated.phone)    updatedFields.phone = updatedUser.Phone;
    if (req.validated.password) updatedFields.passwordChanged = true;

    // Send profile update notification email (non-blocking soft-fail)
    const emailResult = await sendUserProfileUpdateEmail({
      to: updatedUser.Email,
      fullName: updatedUser.FullName,
      username: updatedUser.Username,
      updatedFields,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        emailSent: emailResult.success,
        ...(emailResult.messageId && { emailMessageId: emailResult.messageId }),
        user: {
          userID: updatedUser.UserID,
          studentID: updatedUser.StudentID,
          fullName: updatedUser.FullName,
          username: updatedUser.Username,
          email: updatedUser.Email,
          phone: updatedUser.Phone,
          branchID: updatedUser.BranchID,
          graduationYear: updatedUser.GraduationYear,
          currentYear: updatedUser.CurrentYear,
          isActive: updatedUser.IsActive,
          createdAt: updatedUser.CreatedAt,
          updatedAt: updatedUser.UpdatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
