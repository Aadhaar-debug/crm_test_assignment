import express from 'express';
import { query, validationResult } from 'express-validator';
import { Activity } from '../models/Activity';
import { requireAgentOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get activity logs with filtering and pagination
router.get('/', 
  requireAgentOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('entityType').optional().isIn(['Lead', 'Customer', 'Task', 'User']),
    query('action').optional().trim(),
    query('user').optional().isMongoId(),
    query('entityId').optional().isMongoId()
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = {};
      
      // Role-based filtering for agents
      if (req.user.role === 'agent') {
        filter.user = req.user.id;
      }

      // Entity type filter
      if (req.query.entityType) {
        filter.entityType = req.query.entityType;
      }

      // Action filter
      if (req.query.action) {
        const actionRegex = new RegExp(req.query.action as string, 'i');
        filter.action = actionRegex;
      }

      // User filter (admin only)
      if (req.query.user && req.user.role === 'admin') {
        filter.user = req.query.user;
      }

      // Entity ID filter
      if (req.query.entityId) {
        filter.entityId = req.query.entityId;
      }

      // Execute query with pagination
      const [activities, total] = await Promise.all([
        Activity.find(filter)
          .populate('user', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Activity.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get recent activity (last 10 events)
router.get('/recent',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      // Build filter query
      const filter: any = {};
      
      // Role-based filtering for agents
      if (req.user.role === 'agent') {
        filter.user = req.user.id;
      }

      const activities = await Activity.find(filter)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get activity for specific entity
router.get('/entity/:entityType/:entityId',
  requireAgentOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

      const { entityType, entityId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: any = {
        entityType,
        entityId
      };
      
      // Role-based filtering for agents
      if (req.user.role === 'agent') {
        filter.user = req.user.id;
      }

      // Execute query with pagination
      const [activities, total] = await Promise.all([
        Activity.find(filter)
          .populate('user', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Activity.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user activity summary
router.get('/user/:userId/summary',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Check if user can access this data
      if (req.user.role === 'agent' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const [totalActions, actionsByType, recentActions] = await Promise.all([
        Activity.countDocuments({ user: userId }),
        Activity.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$entityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Activity.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'firstName lastName email')
      ]);

      res.json({
        success: true,
        data: {
          totalActions,
          actionsByType,
          recentActions
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
