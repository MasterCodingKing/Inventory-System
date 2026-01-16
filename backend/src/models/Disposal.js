const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Disposal = sequelize.define('Disposal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  inventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'inventory_id',
    references: {
      model: 'inventory',
      key: 'id'
    }
  },
  disposalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'disposal_date'
  },
  disposalMethod: {
    type: DataTypes.ENUM('Sold', 'Donated', 'Recycled', 'Scrapped', 'Trade-In', 'Other'),
    allowNull: false,
    field: 'disposal_method'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Reason for disposal (e.g., End of life, Damaged beyond repair, Obsolete)'
  },
  approvedById: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'approved_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  disposedById: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'disposed_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  salePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'sale_price',
    comment: 'Price if sold or trade-in value'
  },
  recipientName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'recipient_name',
    comment: 'Name of buyer or recipient organization'
  },
  recipientContact: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'recipient_contact',
    comment: 'Contact information of recipient'
  },
  certificateNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'certificate_number',
    comment: 'Disposal or recycling certificate number'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the disposal'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  tableName: 'disposals',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['inventory_id'] },
    { fields: ['disposal_method'] },
    { fields: ['status'] }
  ]
});

module.exports = Disposal;
