/**
 * Event Routes
 * Handles all event-related endpoints for admin management
 */
import express from 'express';
import multer from 'multer';
import {
  createEventHandler,
  getAllEventsHandler,
  updateEventHandler,
  publishEventHandler,
  unpublishEventHandler,
  deleteEventHandler,
  getEventRegistrationsHandler,
  getAllVenuesHandler,
  getVenueByIdHandler,
  uploadEventQRCodeHandler,
} from '../controllers/eventController.js';
import { authenticateAdmin, authorizeEventManagement, authenticateAdminForRestrictedQuery } from '../middleware/authMiddleware.js';
import { initiateRegistrationHandler } from '../controllers/registrationController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB max
});

/**
 * Protected Event Routes
 */

// Get all events - Admin required (public only for status=Open&isPublished=true query)
router.get('/', authenticateAdminForRestrictedQuery, getAllEventsHandler);

/**
 * Protected Event Management Routes (Admin authentication required)
 */

// Get all venues (Admin only)
router.get('/venues/all', authenticateAdmin, getAllVenuesHandler);

// Get venue by ID (Admin only)
router.get('/venues/:id', authenticateAdmin, getVenueByIdHandler);

/**
 * Protected Event Management Operations (President & Vice-President only)
 */

// Create new event (President & Vice-President only)
router.post('/', authenticateAdmin, authorizeEventManagement, createEventHandler);

// Update event (President & Vice-President only)
router.put('/:id', authenticateAdmin, authorizeEventManagement, updateEventHandler);

// Delete event (President & Vice-President only)
router.delete('/:id', authenticateAdmin, authorizeEventManagement, deleteEventHandler);

/**
 * Protected Event Publishing Routes (Admin authentication required)
 */

// Publish event (President & Vice-President only)
router.post('/:id/publish', authenticateAdmin, authorizeEventManagement, publishEventHandler);

// Unpublish event (President & Vice-President only)
router.post('/:id/unpublish', authenticateAdmin, authorizeEventManagement, unpublishEventHandler);

// Upload QR code for event (Any admin: roleID 1, 2, or 3)
router.post('/:id/upload-qrcode', authenticateAdmin, upload.single('qrcode'), uploadEventQRCodeHandler);

/**
 * Protected Event Registration Management Routes (Admin authentication required)
 */

// Get all registrations for an event (Admin only)
router.get('/:id/registrations', authenticateAdmin, getEventRegistrationsHandler);

// Register authenticated user for an event → creates Pending registration + Razorpay order
router.post('/:id/register', authenticateUser, initiateRegistrationHandler);

export default router;
