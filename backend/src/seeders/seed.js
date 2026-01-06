require('dotenv').config();
const { sequelize, User, Inventory, Department, BorrowRecord } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear all tables in order to handle foreign keys
    await Inventory.destroy({ where: {}, truncate: true, force: true });
    await BorrowRecord.destroy({ where: {}, truncate: true, force: true });
    await User.destroy({ where: {}, truncate: true, force: true });
    await Department.destroy({ where: {}, truncate: true, force: true });

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create Users
    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);
    const managerPassword = await bcrypt.hash('manager123', salt);
    
    const users = await User.bulkCreate([
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        department: 'IT',
        isActive: true,
      },
      {
        id: uuidv4(),
        username: 'manager',
        email: 'manager@inventory.com',
        password: managerPassword,
        fullName: 'IT Manager',
        role: 'manager',
        department: 'IT',
        isActive: true,
      },
      {
        id: uuidv4(),
        username: 'user',
        email: 'user@inventory.com',
        password: userPassword,
        fullName: 'Regular User',
        role: 'user',
        department: 'Operations',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // Create Departments
    console.log('Creating departments...');
    const departments = await Department.bulkCreate([
      {
        id: uuidv4(),
        name: 'President',
        description: 'Office of the President',
        headName: 'Executive',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'AGM',
        description: 'Assistant General Manager',
        headName: 'Management',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'Accounting',
        description: 'Accounting Department',
        headName: 'Head Accountant',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'Operations',
        description: 'Operations Department',
        headName: 'Operations Manager',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'IT',
        description: 'Information Technology Department',
        headName: 'IT Manager',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${departments.length} departments\n`);

    // Create Inventory Items
    console.log('Creating inventory items...');
    const inventoryItems = await Inventory.bulkCreate([
      {
        id: uuidv4(),
        fullName: 'Reyes Joebert',
        department: 'President',
        pcName: 'Updating',
        windowsVersion: 'Windows 11',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
        pcType: 'LAPTOP',
        status: 'Transfer',
        userStatus: 'Active User',
        remarks: 'Kenneth PC',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Domingo, Noel',
        department: 'AGM',
        pcName: 'Updating',
        windowsVersion: 'Windows 10',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Fernandez, Jan Kris Ann',
        department: 'Accounting',
        pcName: 'Updating',
        windowsVersion: 'Windows 10',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Gabion, Maria',
        department: 'Accounting',
        pcName: 'FFCC-MARIA-PC',
        windowsVersion: 'Windows 10',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail, Quickbooks',
        pcType: 'DESKTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working - Finance System',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Santos, Jose',
        department: 'Operations',
        pcName: 'FFCC-SANTOS-LAP',
        windowsVersion: 'Windows 11',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Garcia, Rosa',
        department: 'IT',
        pcName: 'FFCC-IT-ADMIN-01',
        windowsVersion: 'Windows 11',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Visual Studio Code, Chrome, Firefox',
        pcType: 'DESKTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working - Admin Machine',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Lim, Carlos',
        department: 'Operations',
        pcName: 'FFCC-OPS-LAPTOP-02',
        windowsVersion: 'Windows 10',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Messenger, Gmail',
        pcType: 'LAPTOP',
        status: 'Available',
        userStatus: 'Inactive',
        remarks: 'Ready for assignment',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'De Leon, Maria',
        department: 'Accounting',
        pcName: 'FFCC-ACC-03',
        windowsVersion: 'Windows 10',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Quickbooks, Outlook',
        pcType: 'DESKTOP',
        status: 'For Upgrade',
        userStatus: 'Active User',
        remarks: 'Scheduled for Windows 11 upgrade',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Reyes, Miguel',
        department: 'President',
        pcName: 'FFCC-PRES-02',
        windowsVersion: 'Windows 11',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Chrome, Outlook, Teams',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Executive device',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Dela Cruz, Juan',
        department: 'IT',
        pcName: 'FFCC-IT-DEV-01',
        windowsVersion: 'Windows 11',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Visual Studio, Docker, Node.js, MySQL',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Development machine',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Castillo, Ana',
        department: 'Operations',
        pcName: 'FFCC-OPS-DESK-01',
        windowsVersion: 'Windows 10',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Messenger',
        pcType: 'DESKTOP',
        status: 'Maintenance',
        userStatus: 'Inactive',
        remarks: 'Under maintenance - HDD replacement',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Morales, Pedro',
        department: 'AGM',
        pcName: 'FFCC-AGM-LAPTOP',
        windowsVersion: 'Windows 11',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Chrome, Teams, Outlook',
        pcType: 'LAPTOP',
        status: 'Transfer',
        userStatus: 'Active User',
        remarks: 'Being transferred to Finance',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Hernandez, Sofia',
        department: 'Accounting',
        pcName: 'FFCC-ACC-04',
        windowsVersion: 'Windows 10',
        msOffice: 'Office LTSC',
        applicationsSystem: 'MS Office, Quickbooks, Gmail',
        pcType: 'LAPTOP',
        status: 'Active User',
        userStatus: 'On Leave',
        remarks: 'User on leave until Feb',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Lopez, Ricardo',
        department: 'Operations',
        pcName: 'FFCC-OPS-DESKTOP-02',
        windowsVersion: 'Windows 11',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Chrome, Viber',
        pcType: 'DESKTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Working fine',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Gonzales, Emma',
        department: 'IT',
        pcName: 'FFCC-IT-SERVER-01',
        windowsVersion: 'Windows Server',
        msOffice: 'None',
        applicationsSystem: 'Server software, MySQL, Apache',
        pcType: 'DESKTOP',
        status: 'Active User',
        userStatus: 'Active User',
        remarks: 'Server machine - not for general use',
        isBorrowed: false,
      },
      {
        id: uuidv4(),
        fullName: 'Torres, Vincent',
        department: 'Operations',
        pcName: 'FFCC-OPS-LAPTOP-03',
        windowsVersion: 'Windows 10',
        msOffice: 'Office 365',
        applicationsSystem: 'MS Office, Viber, Gmail',
        pcType: 'LAPTOP',
        status: 'Available',
        userStatus: 'Inactive',
        remarks: 'New unit - ready for deployment',
        isBorrowed: false,
      },
    ]);
    console.log(`✅ Created ${inventoryItems.length} inventory items\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('  Admin:   admin / admin123');
    console.log('  Manager: manager / manager123');
    console.log('  User:    user / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
