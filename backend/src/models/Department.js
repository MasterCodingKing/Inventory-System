const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  headName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'head_name'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'departments',
  timestamps: true,
  underscored: true
});

module.exports = Department;
