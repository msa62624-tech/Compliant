import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@compliant.com' },
    update: {},
    create: {
      email: 'admin@compliant.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✓ Created admin user:', admin.email);

  // Create sample manager user
  const managerPassword = await bcrypt.hash('Manager123!@#', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@compliant.com' },
    update: {},
    create: {
      email: 'manager@compliant.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      isActive: true,
    },
  });

  console.log('✓ Created manager user:', manager.email);

  // Create sample contractors
  const contractor1 = await prisma.contractor.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@contractor.com',
      phone: '+1-555-0101',
      company: 'ABC Construction',
      status: 'ACTIVE',
      insuranceStatus: 'COMPLIANT',
      createdById: admin.id,
    },
  });

  const contractor2 = await prisma.contractor.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@contractor.com',
      phone: '+1-555-0102',
      company: 'XYZ Builders',
      status: 'ACTIVE',
      insuranceStatus: 'PENDING',
      createdById: manager.id,
    },
  });

  console.log('✓ Created sample contractors');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Downtown Office Building',
      description: 'New commercial office building construction',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });

  console.log('✓ Created sample project');

  // Assign contractors to project
  await prisma.projectContractor.create({
    data: {
      projectId: project.id,
      contractorId: contractor1.id,
      role: 'General Contractor',
    },
  });

  await prisma.projectContractor.create({
    data: {
      projectId: project.id,
      contractorId: contractor2.id,
      role: 'Electrical Contractor',
    },
  });

  console.log('✓ Assigned contractors to project');

  // Create sample insurance documents
  await prisma.insuranceDocument.create({
    data: {
      contractorId: contractor1.id,
      type: 'GENERAL_LIABILITY',
      provider: 'ABC Insurance Co.',
      policyNumber: 'GL-123456',
      coverageAmount: 1000000,
      effectiveDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-12-31'),
      status: 'VERIFIED',
    },
  });

  await prisma.insuranceDocument.create({
    data: {
      contractorId: contractor1.id,
      type: 'WORKERS_COMPENSATION',
      provider: 'ABC Insurance Co.',
      policyNumber: 'WC-123456',
      coverageAmount: 1000000,
      effectiveDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-12-31'),
      status: 'VERIFIED',
    },
  });

  await prisma.insuranceDocument.create({
    data: {
      contractorId: contractor2.id,
      type: 'GENERAL_LIABILITY',
      provider: 'XYZ Insurance Co.',
      policyNumber: 'GL-789012',
      coverageAmount: 2000000,
      effectiveDate: new Date('2024-01-01'),
      expirationDate: new Date('2024-12-31'),
      status: 'PENDING',
    },
  });

  console.log('✓ Created sample insurance documents');

  console.log('✅ Database seeding completed!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@compliant.com / Admin123!@#');
  console.log('   Manager: manager@compliant.com / Manager123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
