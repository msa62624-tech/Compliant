import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create SUPER_ADMIN user with default credentials
  const superAdminPassword = await bcrypt.hash("SuperAdmin123!@#", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@compliant.com" },
    update: {},
    create: {
      email: "superadmin@compliant.com",
      password: superAdminPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Created super admin user:", superAdmin.email);

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!@#", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@compliant.com" },
    update: {},
    create: {
      email: "admin@compliant.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Created admin user:", admin.email);

  // Create additional ADMIN role users
  // ADMIN role = "Assistant Admin" with filtered access by assignment
  const admin2Password = await bcrypt.hash("Admin2123!@#", 10);
  const admin2 = await prisma.user.upsert({
    where: { email: "admin2@compliant.com" },
    update: {},
    create: {
      email: "admin2@compliant.com",
      password: admin2Password,
      firstName: "Admin",
      lastName: "Two",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Created admin user 2:", admin2.email);

  const admin3Password = await bcrypt.hash("Admin3123!@#", 10);
  const admin3 = await prisma.user.upsert({
    where: { email: "admin3@compliant.com" },
    update: {},
    create: {
      email: "admin3@compliant.com",
      password: admin3Password,
      firstName: "Admin",
      lastName: "Three",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Created admin user 3:", admin3.email);

  // Create sample manager user
  const managerPassword = await bcrypt.hash("Manager123!@#", 10);
  const manager = await prisma.user.upsert({
    where: { email: "manager@compliant.com" },
    update: {},
    create: {
      email: "manager@compliant.com",
      password: managerPassword,
      firstName: "Manager",
      lastName: "User",
      role: "MANAGER",
      isActive: true,
    },
  });

  console.log("✓ Created manager user:", manager.email);

  // Create contractor user (GC role)
  const contractorPassword = await bcrypt.hash("Contractor123!@#", 10);
  const contractorUser = await prisma.user.upsert({
    where: { email: "contractor@compliant.com" },
    update: {},
    create: {
      email: "contractor@compliant.com",
      password: contractorPassword,
      firstName: "General",
      lastName: "Contractor",
      role: "CONTRACTOR",
      isActive: true,
    },
  });

  console.log("✓ Created contractor user:", contractorUser.email);

  // Create subcontractor user
  const subcontractorPassword = await bcrypt.hash("Subcontractor123!@#", 10);
  const subcontractorUser = await prisma.user.upsert({
    where: { email: "subcontractor@compliant.com" },
    update: {},
    create: {
      email: "subcontractor@compliant.com",
      password: subcontractorPassword,
      firstName: "Sub",
      lastName: "Contractor",
      role: "SUBCONTRACTOR",
      isActive: true,
    },
  });

  console.log("✓ Created subcontractor user:", subcontractorUser.email);

  // Create broker user
  const brokerPassword = await bcrypt.hash("Broker123!@#", 10);
  const brokerUser = await prisma.user.upsert({
    where: { email: "broker@compliant.com" },
    update: {},
    create: {
      email: "broker@compliant.com",
      password: brokerPassword,
      firstName: "Insurance",
      lastName: "Broker",
      role: "BROKER",
      isActive: true,
    },
  });

  console.log("✓ Created broker user:", brokerUser.email);

  console.log("✅ Database seeding completed!");
  console.log("");
  console.log("📧 Login credentials:");
  console.log("   Super Admin: superadmin@compliant.com / SuperAdmin123!@#");
  console.log("   Admin: admin@compliant.com / Admin123!@#");
  console.log("   Admin 2: admin2@compliant.com / Admin2123!@#");
  console.log("   Admin 3: admin3@compliant.com / Admin3123!@#");
  console.log("   Manager: manager@compliant.com / Manager123!@#");
  console.log("   Contractor: contractor@compliant.com / Contractor123!@#");
  console.log("   Subcontractor: subcontractor@compliant.com / Subcontractor123!@#");
  console.log("   Broker: broker@compliant.com / Broker123!@#");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
