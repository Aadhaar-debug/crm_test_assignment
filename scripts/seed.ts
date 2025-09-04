import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../server/models/User';
import { Lead } from '../server/models/Lead';
import { Customer } from '../server/models/Customer';
import { Task } from '../server/models/Task';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_app';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Customer.deleteMany({}),
      Task.deleteMany({})
    ]);

    console.log('Creating users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      email: 'admin@crm.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    // Create agent users
    const agent1Password = await bcrypt.hash('agent123', 12);
    const agent1 = await User.create({
      email: 'agent1@crm.com',
      password: agent1Password,
      firstName: 'John',
      lastName: 'Smith',
      role: 'agent',
      isActive: true
    });

    const agent2Password = await bcrypt.hash('agent123', 12);
    const agent2 = await User.create({
      email: 'agent2@crm.com',
      password: agent2Password,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'agent',
      isActive: true
    });

    console.log('Creating leads...');
    
    // Create 10 leads
    const leadSources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Trade Show'];
    const leadStatuses = ['New', 'In Progress', 'Closed Won', 'Closed Lost'];
    
    const leads = [];
    for (let i = 1; i <= 10; i++) {
      const lead = await Lead.create({
        name: `Lead ${i}`,
        email: `lead${i}@example.com`,
        phone: `+1-555-${String(i).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
        status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
        source: leadSources[Math.floor(Math.random() * leadSources.length)],
        assignedAgent: [agent1._id, agent2._id][Math.floor(Math.random() * 2)],
        notes: `This is lead ${i} with some notes.`,
        isArchived: false
      });
      leads.push(lead);
    }

    console.log('Creating customers...');
    
    // Create 5 customers
    const customerCompanies = ['TechCorp', 'InnovateLabs', 'Global Solutions', 'Future Systems', 'Digital Dynamics'];
    const customerTags = ['VIP', 'Enterprise', 'Startup', 'SMB', 'Enterprise'];
    
    const customers = [];
    for (let i = 1; i <= 5; i++) {
      const customer = await Customer.create({
        name: `Customer ${i}`,
        company: customerCompanies[i - 1],
        email: `customer${i}@${customerCompanies[i - 1].toLowerCase()}.com`,
        phone: `+1-555-${String(i + 100).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
        tags: [customerTags[Math.floor(Math.random() * customerTags.length)]],
        owner: [agent1._id, agent2._id][Math.floor(Math.random() * 2)],
        notes: [
          {
            content: `Initial contact with ${customerCompanies[i - 1]}`,
            createdBy: [agent1._id, agent2._id][Math.floor(Math.random() * 2)],
            createdAt: new Date()
          },
          {
            content: `Follow-up meeting scheduled`,
            createdBy: [agent1._id, agent2._id][Math.floor(Math.random() * 2)],
            createdAt: new Date()
          }
        ],
        deals: [
          {
            title: `Deal ${i}`,
            value: Math.floor(Math.random() * 50000) + 10000,
            status: ['Open', 'Won', 'Lost'][Math.floor(Math.random() * 3)],
            expectedCloseDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
            createdAt: new Date()
          }
        ]
      });
      customers.push(customer);
    }

    console.log('Creating tasks...');
    
    // Create tasks for leads and customers
    const taskPriorities = ['Low', 'Medium', 'High'];
    const taskStatuses = ['Open', 'In Progress', 'Done'];
    
    // Tasks for leads
    for (let i = 0; i < 5; i++) {
      await Task.create({
        title: `Follow up with ${leads[i].name}`,
        description: `Call ${leads[i].name} to discuss their interest`,
        dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
        priority: taskPriorities[Math.floor(Math.random() * taskPriorities.length)],
        relatedTo: {
          type: 'Lead',
          id: leads[i]._id
        },
        owner: leads[i].assignedAgent,
        assignedTo: leads[i].assignedAgent
      });
    }

    // Tasks for customers
    for (let i = 0; i < 3; i++) {
      await Task.create({
        title: `Review proposal for ${customers[i].company}`,
        description: `Prepare and review proposal for ${customers[i].company}`,
        dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
        priority: taskPriorities[Math.floor(Math.random() * taskPriorities.length)],
        relatedTo: {
          type: 'Customer',
          id: customers[i]._id
        },
        owner: customers[i].owner,
        assignedTo: customers[i].owner
      });
    }

    console.log('Database seeded successfully!');
    console.log('\nCreated:');
    console.log(`- ${await User.countDocuments()} users (1 admin, 2 agents)`);
    console.log(`- ${await Lead.countDocuments()} leads`);
    console.log(`- ${await Customer.countDocuments()} customers`);
    console.log(`- ${await Task.countDocuments()} tasks`);
    
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@crm.com / admin123');
    console.log('Agent 1: agent1@crm.com / agent123');
    console.log('Agent 2: agent2@crm.com / agent123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();
