const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const BorrowRecord = sequelize.define('BorrowRecord', {
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
  borrowerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'borrower_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  borrowerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'borrower_name'
  },
  borrowerEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'borrower_email',
    validate: {
      isEmail: true
    }
  },
  borrowerDepartment: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'borrower_department'
  },
  borrowDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'borrow_date'
  },
  expectedReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'expected_return_date'
  },
  actualReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'actual_return_date'
  },
  status: {
    type: DataTypes.ENUM('Borrowed', 'Returned', 'Overdue', 'Extended'),
    defaultValue: 'Borrowed'
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  returnCondition: {
    type: DataTypes.ENUM('Good', 'Damaged', 'Lost'),
    allowNull: true,
    field: 'return_condition'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  returnProcessedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'return_processed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'borrow_records',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['inventory_id'] },
    { fields: ['borrower_id'] },
    { fields: ['status'] },
    { fields: ['borrow_date'] },
    { fields: ['expected_return_date'] }
  ]
});

module.exports = BorrowRecord;
