const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  pcName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'pc_name'
  },
  windowsVersion: {
    type: DataTypes.ENUM('Windows 10', 'Windows 11', 'Windows Server'),
    allowNull: true,
    field: 'windows_version'
  },
  microsoftOffice: {
    type: DataTypes.ENUM('Office 365', 'Office LTSC', 'Office 2021', 'Office 2019', 'None'),
    allowNull: true,
    field: 'microsoft_office'
  },
  applicationsSystem: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'applications_system',
    comment: 'MS Office, Viber, Messenger, Gmail, etc.'
  },
  pcType: {
    type: DataTypes.ENUM('LAPTOP', 'DESKTOP', 'LAPTOP DESKTOP'),
    allowNull: false,
    field: 'pc_type'
  },
  status: {
    type: DataTypes.ENUM('Active User', 'Transfer', 'For Upgrade', 'Available', 'Maintenance', 'Retired'),
    defaultValue: 'Active User'
  },
  userStatus: {
    type: DataTypes.ENUM('Active User', 'Inactive', 'On Leave'),
    defaultValue: 'Active User',
    field: 'user_status'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Working, PC-from-Name, Transfer to Collection Grp, etc.'
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    field: 'serial_number'
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'purchase_date'
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'warranty_expiry'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isBorrowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_borrowed'
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'RAM, Storage, Processor, etc.'
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['department'] },
    { fields: ['status'] },
    { fields: ['pc_type'] },
    { fields: ['is_borrowed'] }
  ]
});

module.exports = Inventory;
