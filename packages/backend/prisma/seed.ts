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

  // NOTE: Contractor, Subcontractor, and Broker users are NOT pre-seeded
  // They are auto-created by the system when:
  // - Admin adds a GC/Contractor
  // - GC adds a Subcontractor  
  // - Subcontractor provides Broker information
  // The system generates secure credentials and sends them via email

  console.log("✅ Database seeding completed!");
  console.log("");
  console.log("📧 Login credentials (Admin users only):");
  console.log("   Super Admin: superadmin@compliant.com / SuperAdmin123!@#");
  console.log("   Admin: admin@compliant.com / Admin123!@#");
  console.log("   Admin 2: admin2@compliant.com / Admin2123!@#");
  console.log("   Admin 3: admin3@compliant.com / Admin3123!@#");
  console.log("   Manager: manager@compliant.com / Manager123!@#");
  console.log("");
  console.log("ℹ️  GC, Subcontractor, and Broker accounts are auto-created when added to the system.");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
