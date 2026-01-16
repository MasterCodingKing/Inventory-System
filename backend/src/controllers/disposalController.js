const { Disposal, Inventory, User } = require('../models');
const { Op } = require('sequelize');

// Get all disposal records
exports.getAllDisposals = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      disposalMethod,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Disposal method filter
    if (disposalMethod) {
      where.disposalMethod = disposalMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      where.disposalDate = {};
      if (startDate) {
        where.disposalDate[Op.gte] = startDate;
      }
      if (endDate) {
        where.disposalDate[Op.lte] = endDate;
      }
    }

    // Build search conditions for related models
    const includeOptions = [
      {
        model: Inventory,
        as: 'inventory',
        attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType', 'brand', 'model'],
        where: search ? {
          [Op.or]: [
            { fullName: { [Op.like]: `%${search}%` } },
            { pcName: { [Op.like]: `%${search}%` } },
            { serialNumber: { [Op.like]: `%${search}%` } },
            { department: { [Op.like]: `%${search}%` } }
          ]
        } : undefined,
        required: search ? true : false
      },
      {
        model: User,
        as: 'approvedBy',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'disposedBy',
        attributes: ['id', 'fullName', 'email']
      }
    ];

    const { count, rows: disposals } = await Disposal.findAndCountAll({
      where,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        disposals,
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

// Get disposal by ID
exports.getDisposalById = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType', 'brand', 'model', 'status']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'disposedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    res.json({
      success: true,
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// Create disposal request
exports.createDisposal = async (req, res, next) => {
  try {
    const {
      inventoryId,
      disposalDate,
      disposalMethod,
      reason,
      salePrice,
      recipientName,
      recipientContact,
      certificateNumber,
      notes
    } = req.body;

    // Check if inventory item exists
    const inventoryItem = await Inventory.findByPk(inventoryId);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check if item is currently borrowed
    if (inventoryItem.isBorrowed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispose borrowed item. Please process return first.'
      });
    }

    // Check if there's already a pending/approved disposal for this item
    const existingDisposal = await Disposal.findOne({
      where: {
        inventoryId,
        status: { [Op.in]: ['Pending', 'Approved'] }
      }
    });

    if (existingDisposal) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending or approved disposal request for this item'
      });
    }

    const disposal = await Disposal.create({
      inventoryId,
      disposalDate,
      disposalMethod,
      reason,
      approvedById: req.user.id,
      status: 'Pending',
      salePrice: salePrice || null,
      recipientName: recipientName || null,
      recipientContact: recipientContact || null,
      certificateNumber: certificateNumber || null,
      notes: notes || null
    });

    // Fetch complete disposal with relations
    const createdDisposal = await Disposal.findByPk(disposal.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Disposal request created successfully',
      data: createdDisposal
    });
  } catch (error) {
    next(error);
  }
};

// Update disposal record
exports.updateDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id);

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    // Only pending disposals can be updated
    if (disposal.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending disposal requests can be updated'
      });
    }

    const {
      disposalDate,
      disposalMethod,
      reason,
      salePrice,
      recipientName,
      recipientContact,
      certificateNumber,
      notes
    } = req.body;

    await disposal.update({
      disposalDate: disposalDate || disposal.disposalDate,
      disposalMethod: disposalMethod || disposal.disposalMethod,
      reason: reason || disposal.reason,
      salePrice: salePrice !== undefined ? salePrice : disposal.salePrice,
      recipientName: recipientName !== undefined ? recipientName : disposal.recipientName,
      recipientContact: recipientContact !== undefined ? recipientContact : disposal.recipientContact,
      certificateNumber: certificateNumber !== undefined ? certificateNumber : disposal.certificateNumber,
      notes: notes !== undefined ? notes : disposal.notes
    });

    // Fetch updated disposal with relations
    const updatedDisposal = await Disposal.findByPk(disposal.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'disposedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Disposal record updated successfully',
      data: updatedDisposal
    });
  } catch (error) {
    next(error);
  }
};

// Approve disposal
exports.approveDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id, {
      include: [{ model: Inventory, as: 'inventory' }]
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    if (disposal.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending disposals can be approved'
      });
    }

    await disposal.update({
      status: 'Approved',
      approvedById: req.user.id
    });

    res.json({
      success: true,
      message: 'Disposal approved successfully',
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// Complete disposal
exports.completeDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id, {
      include: [{ model: Inventory, as: 'inventory' }]
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    if (disposal.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved disposals can be completed'
      });
    }

    const { certificateNumber, notes } = req.body;

    // Update disposal record
    await disposal.update({
      status: 'Completed',
      disposedById: req.user.id,
      completedAt: new Date(),
      certificateNumber: certificateNumber || disposal.certificateNumber,
      notes: notes || disposal.notes
    });

    // Update inventory item status to 'Retired'
    await disposal.inventory.update({
      status: 'Retired',
      remarks: `Disposed via ${disposal.disposalMethod} on ${disposal.disposalDate}. ${disposal.reason}`
    });

    // Fetch complete disposal with relations
    const completedDisposal = await Disposal.findByPk(disposal.id, {
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType', 'status']
        },
        {
          model: User,
          as: 'approvedBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'disposedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Disposal completed successfully. Inventory item marked as Retired.',
      data: completedDisposal
    });
  } catch (error) {
    next(error);
  }
};

// Cancel disposal
exports.cancelDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id);

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    if (disposal.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed disposals cannot be cancelled'
      });
    }

    const { notes } = req.body;

    await disposal.update({
      status: 'Cancelled',
      notes: notes ? `${disposal.notes || ''}\nCancellation reason: ${notes}` : disposal.notes
    });

    res.json({
      success: true,
      message: 'Disposal cancelled successfully',
      data: disposal
    });
  } catch (error) {
    next(error);
  }
};

// Delete disposal (only pending)
exports.deleteDisposal = async (req, res, next) => {
  try {
    const disposal = await Disposal.findByPk(req.params.id);

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    if (disposal.status !== 'Pending' && disposal.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only pending or cancelled disposals can be deleted'
      });
    }

    await disposal.destroy();

    res.json({
      success: true,
      message: 'Disposal record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get disposal statistics
exports.getStatistics = async (req, res, next) => {
  try {
    const totalDisposals = await Disposal.count();
    const pendingDisposals = await Disposal.count({ where: { status: 'Pending' } });
    const approvedDisposals = await Disposal.count({ where: { status: 'Approved' } });
    const completedDisposals = await Disposal.count({ where: { status: 'Completed' } });
    const cancelledDisposals = await Disposal.count({ where: { status: 'Cancelled' } });

    // Count by disposal method (completed only)
    const byMethod = await Disposal.findAll({
      attributes: [
        'disposalMethod',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { status: 'Completed' },
      group: ['disposalMethod'],
      raw: true
    });

    // Total sale value (completed sales)
    const totalSaleValue = await Disposal.sum('salePrice', {
      where: {
        status: 'Completed',
        disposalMethod: { [Op.in]: ['Sold', 'Trade-In'] }
      }
    });

    // Recent completions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCompletions = await Disposal.count({
      where: {
        status: 'Completed',
        completedAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalDisposals,
          pending: pendingDisposals,
          approved: approvedDisposals,
          completed: completedDisposals,
          cancelled: cancelledDisposals
        },
        byMethod,
        totalSaleValue: totalSaleValue || 0,
        recentCompletions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get items available for disposal
exports.getAvailableItems = async (req, res, next) => {
  try {
    const { search } = req.query;

    // Get IDs of items with pending or approved disposals
    const existingDisposals = await Disposal.findAll({
      attributes: ['inventoryId'],
      where: {
        status: { [Op.in]: ['Pending', 'Approved'] }
      },
      raw: true
    });

    // When using raw: true, Sequelize returns database field names (inventory_id)
    const excludedIds = existingDisposals.map(d => d.inventory_id || d.inventoryId).filter(Boolean);

    const where = {
      isBorrowed: false
    };

    if (excludedIds.length > 0) {
      where.id = { [Op.notIn]: excludedIds };
    }

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { pcName: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } }
      ];
    }

    const items = await Inventory.findAll({
      where,
      attributes: ['id', 'fullName', 'pcName', 'serialNumber', 'department', 'pcType', 'brand', 'model', 'status'],
      order: [['fullName', 'ASC']],
      limit: 50
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};
