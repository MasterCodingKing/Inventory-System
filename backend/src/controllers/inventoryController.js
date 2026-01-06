const { Inventory, User, BorrowRecord } = require('../models');
const { Op } = require('sequelize');

// Get all inventory items
exports.getAllInventory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      department, 
      status, 
      pcType,
      windowsVersion,
      isBorrowed,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { pcName: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    // Department filter
    if (department) {
      where.department = department;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // PC Type filter
    if (pcType) {
      where.pcType = pcType;
    }

    // Windows Version filter
    if (windowsVersion) {
      where.windowsVersion = windowsVersion;
    }

    // Borrowed filter
    if (isBorrowed !== undefined) {
      where.isBorrowed = isBorrowed === 'true';
    }

    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'fullName', 'email', 'department']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'fullName', 'email', 'department']
        },
        {
          model: BorrowRecord,
          as: 'borrowRecords',
          include: [
            { model: User, as: 'borrower', attributes: ['id', 'fullName', 'email'] },
            { model: User, as: 'approver', attributes: ['id', 'fullName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// Create new inventory item
exports.createInventory = async (req, res, next) => {
  try {
    let {
      fullName,
      department,
      pcName,
      windowsVersion,
      microsoftOffice,
      applicationsSystem,
      pcType,
      status,
      userStatus,
      remarks,
      serialNumber,
      brand,
      model,
      purchaseDate,
      warrantyExpiry,
      assignedTo,
      specifications
    } = req.body;

    // Convert empty strings to null for optional ENUM and text fields
    if (!purchaseDate || purchaseDate.trim() === '') {
      purchaseDate = null;
    }
    if (!warrantyExpiry || warrantyExpiry.trim() === '') {
      warrantyExpiry = null;
    }
    if (!windowsVersion || windowsVersion.trim() === '') {
      windowsVersion = null;
    }
    if (!microsoftOffice || microsoftOffice.trim() === '') {
      microsoftOffice = null;
    }
    if (!applicationsSystem || applicationsSystem.trim() === '') {
      applicationsSystem = null;
    }
    if (!remarks || remarks.trim() === '') {
      remarks = null;
    }
    if (!serialNumber || serialNumber.trim() === '') {
      serialNumber = null;
    }
    if (!brand || brand.trim() === '') {
      brand = null;
    }
    if (!model || model.trim() === '') {
      model = null;
    }
    if (!pcName || pcName.trim() === '') {
      pcName = null;
    }

    // Validate date format if provided
    if (purchaseDate && isNaN(new Date(purchaseDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase date format. Please use YYYY-MM-DD format'
      });
    }

    if (warrantyExpiry && isNaN(new Date(warrantyExpiry).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warranty expiry date format. Please use YYYY-MM-DD format'
      });
    }

    // Check for duplicate serial number
    if (serialNumber) {
      const existingItem = await Inventory.findOne({ where: { serialNumber } });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists'
        });
      }
    }

    const inventory = await Inventory.create({
      fullName,
      department,
      pcName,
      windowsVersion,
      microsoftOffice,
      applicationsSystem,
      pcType,
      status: status || 'Active User',
      userStatus: userStatus || 'Active User',
      remarks,
      serialNumber,
      brand,
      model,
      purchaseDate,
      warrantyExpiry,
      assignedTo,
      specifications
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// Update inventory item
exports.updateInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    let {
      fullName,
      department,
      pcName,
      windowsVersion,
      microsoftOffice,
      applicationsSystem,
      pcType,
      status,
      userStatus,
      remarks,
      serialNumber,
      brand,
      model,
      purchaseDate,
      warrantyExpiry,
      assignedTo,
      specifications
    } = req.body;

    // Convert empty strings to null for optional date fields
    if (!purchaseDate || purchaseDate.trim() === '') {
      purchaseDate = null;
    }
    if (!warrantyExpiry || warrantyExpiry.trim() === '') {
      warrantyExpiry = null;
    }

    // Convert empty strings to null for optional ENUM fields
    if (!windowsVersion || windowsVersion.trim() === '') {
      windowsVersion = null;
    }
    if (!microsoftOffice || microsoftOffice.trim() === '') {
      microsoftOffice = null;
    }

    // Convert empty strings to null for optional text fields
    if (!applicationsSystem || applicationsSystem.trim() === '') {
      applicationsSystem = null;
    }
    if (!remarks || remarks.trim() === '') {
      remarks = null;
    }
    if (!serialNumber || serialNumber.trim() === '') {
      serialNumber = null;
    }
    if (!brand || brand.trim() === '') {
      brand = null;
    }
    if (!model || model.trim() === '') {
      model = null;
    }
    if (!pcName || pcName.trim() === '') {
      pcName = null;
    }

    // Validate date format if provided
    if (purchaseDate && isNaN(new Date(purchaseDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase date format. Please use YYYY-MM-DD format'
      });
    }

    if (warrantyExpiry && isNaN(new Date(warrantyExpiry).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warranty expiry date format. Please use YYYY-MM-DD format'
      });
    }

    // Check for duplicate serial number (if changed)
    if (serialNumber && serialNumber !== inventory.serialNumber) {
      const existingItem = await Inventory.findOne({ where: { serialNumber } });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Serial number already exists'
        });
      }
    }

    await inventory.update({
      fullName: fullName !== undefined ? fullName : inventory.fullName,
      department: department !== undefined ? department : inventory.department,
      pcName: pcName !== undefined ? pcName : inventory.pcName,
      windowsVersion: windowsVersion !== undefined ? windowsVersion : inventory.windowsVersion,
      microsoftOffice: microsoftOffice !== undefined ? microsoftOffice : inventory.microsoftOffice,
      applicationsSystem: applicationsSystem !== undefined ? applicationsSystem : inventory.applicationsSystem,
      pcType: pcType !== undefined ? pcType : inventory.pcType,
      status: status !== undefined ? status : inventory.status,
      userStatus: userStatus !== undefined ? userStatus : inventory.userStatus,
      remarks: remarks !== undefined ? remarks : inventory.remarks,
      serialNumber: serialNumber !== undefined ? serialNumber : inventory.serialNumber,
      brand: brand !== undefined ? brand : inventory.brand,
      model: model !== undefined ? model : inventory.model,
      purchaseDate: purchaseDate !== undefined ? purchaseDate : inventory.purchaseDate,
      warrantyExpiry: warrantyExpiry !== undefined ? warrantyExpiry : inventory.warrantyExpiry,
      assignedTo: assignedTo !== undefined ? assignedTo : inventory.assignedTo,
      specifications: specifications !== undefined ? specifications : inventory.specifications
    });

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if item is currently borrowed
    if (inventory.isBorrowed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete borrowed item. Please process return first.'
      });
    }

    await inventory.destroy();

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory statistics
exports.getStatistics = async (req, res, next) => {
  try {
    const totalItems = await Inventory.count();
    const activeItems = await Inventory.count({ where: { status: 'Active User' } });
    const availableItems = await Inventory.count({ where: { status: 'Available' } });
    const maintenanceItems = await Inventory.count({ where: { status: 'Maintenance' } });
    const transferItems = await Inventory.count({ where: { status: 'Transfer' } });
    const borrowedItems = await Inventory.count({ where: { isBorrowed: true } });
    
    // Count by PC Type
    const laptops = await Inventory.count({ where: { pcType: 'LAPTOP' } });
    const desktops = await Inventory.count({ where: { pcType: 'DESKTOP' } });

    // Count by department
    const byDepartment = await Inventory.findAll({
      attributes: [
        'department',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    // Count by status
    const byStatus = await Inventory.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalItems,
          active: activeItems,
          available: availableItems,
          maintenance: maintenanceItems,
          transfer: transferItems,
          borrowed: borrowedItems
        },
        pcTypes: {
          laptops,
          desktops
        },
        byDepartment,
        byStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get departments list
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Inventory.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('department')), 'department']],
      where: {
        department: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      },
      raw: true
    });

    res.json({
      success: true,
      data: departments.map(d => d.department).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

// Bulk import inventory
exports.bulkImport = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const item of items) {
      try {
        await Inventory.create(item);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          item: item.fullName || item.pcName,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${results.success} items imported, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
