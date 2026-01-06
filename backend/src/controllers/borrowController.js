const { BorrowRecord, Inventory, User } = require('../models');
const { Op } = require('sequelize');
const { sendEmail, emailTemplates } = require('../config/email');

// Get all borrow records
exports.getAllBorrowRecords = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { borrowerName: { [Op.like]: `%${search}%` } },
        { borrowerDepartment: { [Op.like]: `%${search}%` } }
      ];
    }

    if (startDate && endDate) {
      where.borrowDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows: records } = await BorrowRecord.findAndCountAll({
      where,
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'pcType', 'department', 'serialNumber']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'fullName', 'email', 'department']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    res.json({
      success: true,
      data: {
        records,
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

// Get borrow record by ID
exports.getBorrowRecordById = async (req, res, next) => {
  try {
    const record = await BorrowRecord.findByPk(req.params.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory'
        },
        {
          model: User,
          as: 'borrower',
          attributes: { exclude: ['password'] }
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'returnProcessor',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Create borrow record (Release equipment)
exports.createBorrowRecord = async (req, res, next) => {
  try {
    const {
      inventoryId,
      borrowerId,
      borrowerName,
      borrowerEmail,
      borrowerDepartment,
      borrowDate,
      expectedReturnDate,
      purpose,
      notes
    } = req.body;

    // Check if inventory item exists
    const inventory = await Inventory.findByPk(inventoryId);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if item is already borrowed
    if (inventory.isBorrowed) {
      return res.status(400).json({
        success: false,
        message: 'This item is already borrowed'
      });
    }

    // Create borrow record
    const record = await BorrowRecord.create({
      inventoryId,
      borrowerId,
      borrowerName,
      borrowerEmail,
      borrowerDepartment,
      borrowDate: borrowDate || new Date(),
      expectedReturnDate,
      purpose,
      notes,
      status: 'Borrowed',
      approvedBy: req.userId
    });

    // Update inventory item status
    await inventory.update({ 
      isBorrowed: true,
      status: 'Transfer'
    });

    // Send confirmation email
    if (borrowerEmail) {
      const emailData = emailTemplates.borrowConfirmation({
        borrowerName,
        equipmentName: `${inventory.brand || ''} ${inventory.model || ''} (${inventory.pcType})`.trim(),
        pcName: inventory.pcName,
        borrowDate: borrowDate || new Date().toISOString().split('T')[0],
        expectedReturnDate
      });

      sendEmail({
        to: borrowerEmail,
        ...emailData
      }).catch(console.error);
    }

    // Fetch complete record with associations
    const completeRecord = await BorrowRecord.findByPk(record.id, {
      include: [
        { model: Inventory, as: 'inventory' },
        { model: User, as: 'borrower', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Equipment released successfully',
      data: completeRecord
    });
  } catch (error) {
    next(error);
  }
};

// Process return
exports.processReturn = async (req, res, next) => {
  try {
    const { returnCondition, notes } = req.body;

    const record = await BorrowRecord.findByPk(req.params.id, {
      include: [{ model: Inventory, as: 'inventory' }]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    if (record.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been returned'
      });
    }

    const returnDate = new Date().toISOString().split('T')[0];

    // Update borrow record
    await record.update({
      status: 'Returned',
      actualReturnDate: returnDate,
      returnCondition: returnCondition || 'Good',
      notes: notes || record.notes,
      returnProcessedBy: req.userId
    });

    // Update inventory item
    await record.inventory.update({
      isBorrowed: false,
      status: returnCondition === 'Damaged' ? 'Maintenance' : 'Active User'
    });

    // Send return confirmation email
    if (record.borrowerEmail) {
      const emailData = emailTemplates.returnConfirmation({
        borrowerName: record.borrowerName,
        equipmentName: `${record.inventory.brand || ''} ${record.inventory.model || ''} (${record.inventory.pcType})`.trim(),
        pcName: record.inventory.pcName,
        returnDate
      });

      sendEmail({
        to: record.borrowerEmail,
        ...emailData
      }).catch(console.error);
    }

    res.json({
      success: true,
      message: 'Return processed successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Extend borrow period
exports.extendBorrowPeriod = async (req, res, next) => {
  try {
    const { newExpectedReturnDate, reason } = req.body;

    const record = await BorrowRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    if (record.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend returned item'
      });
    }

    await record.update({
      expectedReturnDate: newExpectedReturnDate,
      status: 'Extended',
      notes: record.notes 
        ? `${record.notes}\n\nExtension: ${reason || 'No reason provided'}`
        : `Extension: ${reason || 'No reason provided'}`
    });

    res.json({
      success: true,
      message: 'Borrow period extended successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue items
exports.getOverdueItems = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const overdueRecords = await BorrowRecord.findAll({
      where: {
        status: { [Op.in]: ['Borrowed', 'Extended'] },
        expectedReturnDate: { [Op.lt]: today }
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'pcType', 'department']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'fullName', 'email', 'department']
        }
      ],
      order: [['expectedReturnDate', 'ASC']]
    });

    // Update status to Overdue
    for (const record of overdueRecords) {
      if (record.status !== 'Overdue') {
        await record.update({ status: 'Overdue' });
      }
    }

    res.json({
      success: true,
      data: overdueRecords
    });
  } catch (error) {
    next(error);
  }
};

// Get upcoming returns (items due within specified days)
exports.getUpcomingReturns = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const upcomingRecords = await BorrowRecord.findAll({
      where: {
        status: { [Op.in]: ['Borrowed', 'Extended'] },
        expectedReturnDate: {
          [Op.between]: [today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0]]
        }
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'pcType', 'department']
        },
        {
          model: User,
          as: 'borrower',
          attributes: ['id', 'fullName', 'email', 'department']
        }
      ],
      order: [['expectedReturnDate', 'ASC']]
    });

    res.json({
      success: true,
      data: upcomingRecords
    });
  } catch (error) {
    next(error);
  }
};

// Send reminder emails for upcoming returns
exports.sendReturnReminders = async (req, res, next) => {
  try {
    const { days = 3 } = req.body;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const upcomingRecords = await BorrowRecord.findAll({
      where: {
        status: { [Op.in]: ['Borrowed', 'Extended'] },
        expectedReturnDate: {
          [Op.between]: [today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0]]
        },
        borrowerEmail: { [Op.ne]: null }
      },
      include: [
        {
          model: Inventory,
          as: 'inventory'
        }
      ]
    });

    let sentCount = 0;
    for (const record of upcomingRecords) {
      const emailData = emailTemplates.returnReminder({
        borrowerName: record.borrowerName,
        equipmentName: `${record.inventory.brand || ''} ${record.inventory.model || ''} (${record.inventory.pcType})`.trim(),
        pcName: record.inventory.pcName,
        expectedReturnDate: record.expectedReturnDate
      });

      const result = await sendEmail({
        to: record.borrowerEmail,
        ...emailData
      });

      if (result.success) sentCount++;
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} reminder emails`,
      data: { totalRecords: upcomingRecords.length, emailsSent: sentCount }
    });
  } catch (error) {
    next(error);
  }
};

// Get borrow statistics
exports.getBorrowStatistics = async (req, res, next) => {
  try {
    const totalBorrowed = await BorrowRecord.count({
      where: { status: { [Op.in]: ['Borrowed', 'Extended', 'Overdue'] } }
    });

    const totalReturned = await BorrowRecord.count({
      where: { status: 'Returned' }
    });

    const totalOverdue = await BorrowRecord.count({
      where: { status: 'Overdue' }
    });

    // Get today's date for upcoming returns
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingReturns = await BorrowRecord.count({
      where: {
        status: { [Op.in]: ['Borrowed', 'Extended'] },
        expectedReturnDate: {
          [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]]
        }
      }
    });

    // Monthly trends
    const monthlyBorrows = await BorrowRecord.findAll({
      attributes: [
        [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('borrow_date'), '%Y-%m'), 'month'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('borrow_date'), '%Y-%m')],
      order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('borrow_date'), '%Y-%m'), 'DESC']],
      limit: 12,
      raw: true
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalBorrowed,
          totalReturned,
          totalOverdue,
          upcomingReturns
        },
        monthlyTrends: monthlyBorrows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete borrow record (Admin only)
exports.deleteBorrowRecord = async (req, res, next) => {
  try {
    const record = await BorrowRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    // If item is still borrowed, update inventory
    if (record.status !== 'Returned') {
      const inventory = await Inventory.findByPk(record.inventoryId);
      if (inventory) {
        await inventory.update({ isBorrowed: false });
      }
    }

    await record.destroy();

    res.json({
      success: true,
      message: 'Borrow record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
