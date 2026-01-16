const sequelize = require('../config/sequelize');
const User = require('./User');
const Inventory = require('./Inventory');
const BorrowRecord = require('./BorrowRecord');
const Department = require('./Department');
const Disposal = require('./Disposal');

// Define associations

// User - Inventory (One-to-Many: User can have multiple inventory items assigned)
User.hasMany(Inventory, { 
  foreignKey: 'assigned_to', 
  as: 'assignedInventory' 
});
Inventory.belongsTo(User, { 
  foreignKey: 'assigned_to', 
  as: 'assignedUser' 
});

// Inventory - BorrowRecord (One-to-Many)
Inventory.hasMany(BorrowRecord, { 
  foreignKey: 'inventory_id', 
  as: 'borrowRecords' 
});
BorrowRecord.belongsTo(Inventory, { 
  foreignKey: 'inventory_id', 
  as: 'inventory' 
});

// User - BorrowRecord (Borrower)
User.hasMany(BorrowRecord, { 
  foreignKey: 'borrower_id', 
  as: 'borrowedItems' 
});
BorrowRecord.belongsTo(User, { 
  foreignKey: 'borrower_id', 
  as: 'borrower' 
});

// User - BorrowRecord (Approver)
User.hasMany(BorrowRecord, { 
  foreignKey: 'approved_by', 
  as: 'approvedRecords' 
});
BorrowRecord.belongsTo(User, { 
  foreignKey: 'approved_by', 
  as: 'approver' 
});

// User - BorrowRecord (Return Processor)
User.hasMany(BorrowRecord, { 
  foreignKey: 'return_processed_by', 
  as: 'processedReturns' 
});
BorrowRecord.belongsTo(User, { 
  foreignKey: 'return_processed_by', 
  as: 'returnProcessor' 
});

// Inventory - Disposal (One-to-Many)
Inventory.hasMany(Disposal, { 
  foreignKey: 'inventory_id', 
  as: 'disposalRecords' 
});
Disposal.belongsTo(Inventory, { 
  foreignKey: 'inventory_id', 
  as: 'inventory' 
});

// User - Disposal (Approved By)
User.hasMany(Disposal, { 
  foreignKey: 'approved_by_id', 
  as: 'approvedDisposals' 
});
Disposal.belongsTo(User, { 
  foreignKey: 'approved_by_id', 
  as: 'approvedBy' 
});

// User - Disposal (Disposed By)
User.hasMany(Disposal, { 
  foreignKey: 'disposed_by_id', 
  as: 'processedDisposals' 
});
Disposal.belongsTo(User, { 
  foreignKey: 'disposed_by_id', 
  as: 'disposedBy' 
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Inventory,
  BorrowRecord,
  Department,
  Disposal,
  syncDatabase
};
