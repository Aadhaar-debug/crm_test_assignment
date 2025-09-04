import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Customer } from '../models/Customer';
import { Activity } from '../models/Activity';
import { requireAgentOrAdmin } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get all customers with filtering, search, and pagination
router.get('/', 
  requireAgentOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('tags').optional().isArray(),
    query('owner').optional().isMongoId()
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
        filter.owner = req.user.id;
      }

      // Owner filter (admin only)
      if (req.query.owner && req.user.role === 'admin') {
        filter.owner = req.query.owner;
      }

      // Tags filter
      if (req.query.tags && Array.isArray(req.query.tags)) {
        filter.tags = { $in: req.query.tags };
      }

      // Search filter
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
          { name: searchRegex },
          { company: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }

      // Execute query with pagination
      const [customers, total] = await Promise.all([
        Customer.find(filter)
          .populate('owner', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Customer.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: customers,
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

// Get single customer
router.get('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.params.id)
        .populate('owner', 'firstName lastName email')
        .populate('convertedFromLead', 'name source status');

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && customer.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create new customer
router.post('/',
  requireAgentOrAdmin,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('company').trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isLength({ min: 1, max: 20 }),
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

      const { name, company, email, phone, tags = [], deals = [] } = req.body;

      // Check if customer with email already exists
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }

      const customer = new Customer({
        name,
        company,
        email,
        phone,
        tags,
        deals,
        owner: req.user.id
      });

      await customer.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Customer Created',
        entityType: 'Customer',
        entityId: customer._id,
        details: { name, company, email }
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update customer
router.patch('/:id',
  requireAgentOrAdmin,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('company').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ min: 1, max: 20 }),
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

      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && customer.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if email is being changed and if it conflicts
      if (req.body.email && req.body.email !== customer.email) {
        const existingCustomer = await Customer.findOne({ 
          email: req.body.email,
          _id: { $ne: customer._id }
        });
        if (existingCustomer) {
          return res.status(400).json({
            success: false,
            message: 'Customer with this email already exists'
          });
        }
      }

      // Update customer
      Object.assign(customer, req.body);
      await customer.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Customer Updated',
        entityType: 'Customer',
        entityId: customer._id,
        details: { updatedFields: Object.keys(req.body) }
      });

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add note to customer
router.post('/:id/notes',
  requireAgentOrAdmin,
  [
    body('content').trim().isLength({ min: 1, max: 1000 })
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

      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && customer.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { content } = req.body;

      // Add note
      customer.notes.push({
        content,
        createdBy: req.user.id,
        createdAt: new Date()
      });

      // Keep only latest 5 notes
      if (customer.notes.length > 5) {
        customer.notes = customer.notes.slice(-5);
      }

      await customer.save();

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Note Added to Customer',
        entityType: 'Customer',
        entityId: customer._id,
        details: { noteContent: content.substring(0, 100) }
      });

      res.json({
        success: true,
        message: 'Note added successfully',
        data: customer.notes
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete customer
router.delete('/:id',
  requireAgentOrAdmin,
  async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check ownership for agents
      if (req.user.role === 'agent' && customer.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Customer.findByIdAndDelete(req.params.id);

      // Log activity
      await Activity.create({
        user: req.user.id,
        action: 'Customer Deleted',
        entityType: 'Customer',
        entityId: customer._id,
        details: { name: customer.name, company: customer.company }
      });

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
