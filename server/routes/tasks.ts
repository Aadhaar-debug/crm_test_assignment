import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { requireAgentOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all tasks with filtering, search, and pagination
router.get('/', 
  requireAgentOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['Open', 'In Progress', 'Done']),
    query('priority').optional().isIn(['Low', 'Medium', 'High']),
    query('owner').optional().isMongoId(),
    query('assignedTo').optional().isMongoId(),
    query('dueDate').optional().isISO8601(),
    query('overdue').optional().isBoolean()
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
      
      // Role-based filtering
      if (req.user.role === 'agent') {
        filter.$or = [
          { owner: req.user.id },
          { assignedTo: req.user.id }
        ];
      }

      // Status filter
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Priority filter
      if (req.query.priority) {
        filter.priority = req.query.priority;
      }

      // Owner filter (admin only)
      if (req.query.owner && req.user.role === 'admin') {
        filter.owner = req.query.owner;
      }

      // Assigned to filter (admin only)
      if (req.query.assignedTo && req.user.role === 'admin') {
        filter.assignedTo = req.query.assignedTo;
      }

      // Due date filter
      if (req.query.dueDate) {
        const dueDate = new Date(req.query.dueDate as string);
        filter.dueDate = {
          $gte: dueDate,
          $lt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
        };
      }

      // Overdue filter
      if (req.query.overdue === 'true') {
        filter.dueDate = { $lt: new Date() };
        filter.status = { $ne: 'Done' };
      }

      // Execute query with pagination
      const [tasks, total] = await Promise.all([
        Task.find(filter)
          .populate('owner', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .populate('relatedTo.id', 'name')
          .sort({ dueDate: 1, priority: -1 })
          .skip(skip)
          .limit(limit),
        Task.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: tasks,
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

// Get single task
router.get('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate('owner', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .populate('relatedTo.id', 'name');

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && 
          task.owner.toString() !== req.user.id && 
          task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create new task
router.post('/',
  requireAgentOrAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('dueDate').isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('relatedTo.type').isIn(['Lead', 'Customer']),
    body('relatedTo.id').isMongoId(),
    body('assignedTo').optional().isMongoId()
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

      const { 
        title, 
        description, 
        dueDate, 
        priority = 'Medium',
        relatedTo,
        assignedTo 
      } = req.body;

      const task = new Task({
        title,
        description,
        dueDate: new Date(dueDate),
        priority,
        relatedTo,
        owner: req.user.id,
        assignedTo: assignedTo || req.user.id
      });

      await task.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Task Created',
        entityType: 'Task',
        entityId: task._id,
        details: { title, dueDate, priority }
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update task
router.patch('/:id',
  requireAgentOrAdmin,
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['Open', 'In Progress', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('assignedTo').optional().isMongoId()
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

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && 
          task.owner.toString() !== req.user.id && 
          task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update task
      const updateData: any = { ...req.body };
      
      if (req.body.dueDate) {
        updateData.dueDate = new Date(req.body.dueDate);
      }

      if (req.body.status === 'Done' && task.status !== 'Done') {
        updateData.completedAt = new Date();
      } else if (req.body.status !== 'Done') {
        updateData.completedAt = undefined;
      }

      Object.assign(task, updateData);
      await task.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Task Updated',
        entityType: 'Task',
        entityId: task._id,
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete task
router.delete('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && 
          task.owner.toString() !== req.user.id && 
          task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Task.findByIdAndDelete(req.params.id);

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Task Deleted',
        entityType: 'Task',
        entityId: task._id,
        details: { title: task.title }
      });

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
