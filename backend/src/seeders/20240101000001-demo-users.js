'use strict';

const { User } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@inventory.com',
        password: hashedPassword,
        full_name: 'System Administrator',
        role: 'admin',
        department: 'IT',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'manager',
        email: 'manager@inventory.com',
        password: hashedPassword,
        full_name: 'IT Manager',
        role: 'manager',
        department: 'IT',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'user',
        email: 'user@inventory.com',
        password: hashedPassword,
        full_name: 'Regular User',
        role: 'user',
        department: 'Operations',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
