import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { requireAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all users (Admin only)
router.get('/', 
  requireAdmin,
  async (req, res, next) => {
    try {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get single user
router.get('/:id',
  requireAdmin,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user (Admin only)
router.patch('/:id',
  requireAdmin,
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('role').optional().isIn(['admin', 'agent']),
    body('isActive').optional().isBoolean()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (req.params.id === req.user.id && req.body.isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      // Update user
      Object.assign(user, req.body);
      await user.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'User Updated',
        entityType: 'User',
        entityId: user._id,
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (Admin only)
router.delete('/:id',
  requireAdmin,
  async (req, res, next) => {
    try {
      // Prevent admin from deleting themselves
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await User.findByIdAndDelete(req.params.id);

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'User Deleted',
        entityType: 'User',
        entityId: user._id,
        details: { email: user.email, role: user.role }
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user profile
router.get('/profile/me',
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update current user profile
router.patch('/profile/me',
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update profile
      Object.assign(user, req.body);
      await user.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Profile Updated',
        entityType: 'User',
        entityId: user._id,
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
