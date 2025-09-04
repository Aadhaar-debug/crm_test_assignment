import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { Activity } from '../models/Activity';
import { requireAgentOrAdmin, requireOwnerOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all leads with filtering, search, and pagination
router.get('/', 
  requireAgentOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['New', 'In Progress', 'Closed Won', 'Closed Lost']),
    query('search').optional().trim(),
    query('assignedAgent').optional().isMongoId()
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
      const filter: any = { isArchived: false };
      
      // Role-based filtering
      if (req.user.role === 'agent') {
        filter.assignedAgent = req.user.id;
      }

      // Status filter
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Assigned agent filter (admin only)
      if (req.query.assignedAgent && req.user.role === 'admin') {
        filter.assignedAgent = req.query.assignedAgent;
      }

      // Search filter
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { source: searchRegex }
        ];
      }

      // Execute query with pagination
      const [leads, total] = await Promise.all([
        Lead.find(filter)
          .populate('assignedAgent', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Lead.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: leads,
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

// Get single lead
router.get('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .populate('assignedAgent', 'firstName lastName email')
        .populate('convertedToCustomer', 'name company');

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && lead.assignedAgent.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create new lead
router.post('/',
  requireAgentOrAdmin,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isLength({ min: 1, max: 20 }),
    body('source').trim().isLength({ min: 1, max: 50 }),
    body('notes').optional().trim().isLength({ max: 1000 })
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

      const { name, email, phone, source, notes } = req.body;

      // Check if lead with email already exists
      const existingLead = await Lead.findOne({ email, isArchived: false });
      if (existingLead) {
        return res.status(400).json({
          success: false,
          message: 'Lead with this email already exists'
        });
      }

      const lead = new Lead({
        name,
        email,
        phone,
        source,
        notes,
        assignedAgent: req.user.id
      });

      await lead.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Lead Created',
        entityType: 'Lead',
        entityId: lead._id,
        details: { name, email, source }
      });

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update lead
router.patch('/:id',
  requireAgentOrAdmin,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ min: 1, max: 20 }),
    body('status').optional().isIn(['New', 'In Progress', 'Closed Won', 'Closed Lost']),
    body('source').optional().trim().isLength({ min: 1, max: 50 }),
    body('notes').optional().trim().isLength({ max: 1000 }),
    body('assignedAgent').optional().isMongoId()
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

      const lead = await Lead.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && lead.assignedAgent.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if email is being changed and if it conflicts
      if (req.body.email && req.body.email !== lead.email) {
        const existingLead = await Lead.findOne({ 
          email: req.body.email, 
          isArchived: false,
          _id: { $ne: lead._id }
        });
        if (existingLead) {
          return res.status(400).json({
            success: false,
            message: 'Lead with this email already exists'
          });
        }
      }

      // Update lead
      Object.assign(lead, req.body);
      await lead.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Lead Updated',
        entityType: 'Lead',
        entityId: lead._id,
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: lead
      });
    } catch (error) {
      next(error);
    }
  }
);

// Convert lead to customer
router.post('/:id/convert',
  requireAgentOrAdmin,
  [
    body('company').trim().isLength({ min: 1, max: 100 }),
    body('tags').optional().isArray(),
    body('deals').optional().isArray()
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

      const lead = await Lead.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && lead.assignedAgent.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (lead.status === 'Closed Won' || lead.status === 'Closed Lost') {
        return res.status(400).json({
          success: false,
          message: 'Cannot convert closed lead'
        });
      }

      const { company, tags = [], deals = [] } = req.body;

      // Create customer
      const customer = new Customer({
        name: lead.name,
        company,
        email: lead.email,
        phone: lead.phone,
        tags,
        deals,
        owner: req.user.id,
        convertedFromLead: lead._id
      });

      await customer.save();

      // Update lead
      lead.status = 'Closed Won';
      lead.convertedToCustomer = customer._id;
      lead.convertedAt = new Date();
      await lead.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Lead Converted to Customer',
        entityType: 'Lead',
        entityId: lead._id,
        details: { customerId: customer._id, company }
      });

      res.json({
        success: true,
        message: 'Lead converted to customer successfully',
        data: {
          customer,
          lead
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Soft delete (archive) lead
router.delete('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && lead.assignedAgent.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      lead.isArchived = true;
      await lead.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Lead Archived',
        entityType: 'Lead',
        entityId: lead._id,
        details: { name: lead.name }
      });

      res.json({
        success: true,
        message: 'Lead archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
