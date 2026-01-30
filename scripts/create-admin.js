const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Get the default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found. Creating one...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Ghana Lands',
          slug: 'ghana-lands',
          domain: 'localhost',
        }
      });
      console.log('Tenant created:', tenant.id);
    }
    
    // Check if admin role exists
    let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'ADMIN', description: 'Administrator' }
      });
      console.log('Admin role created');
    }
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@ghanalands.com' } });
    if (existingAdmin) {
      // Update password just in case
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { passwordHash }
      });
      console.log('Admin user already exists - password reset');
      console.log('');
      console.log('=== ADMIN CREDENTIALS ===');
      console.log('Email: admin@ghanalands.com');
      console.log('Password: Admin@123');
      console.log('=========================');
      await prisma.$disconnect();
      return;
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'admin@ghanalands.com',
        passwordHash,
        fullName: 'System Admin',
        accountStatus: 'ACTIVE',
        emailVerified: true,
      }
    });
    
    // Assign admin role
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: adminRole.id,
      }
    });
    
    console.log('Admin user created successfully!');
    console.log('');
    console.log('=== ADMIN CREDENTIALS ===');
    console.log('Email: admin@ghanalands.com');
    console.log('Password: Admin@123');
    console.log('=========================');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
