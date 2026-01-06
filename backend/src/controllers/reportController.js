const { Inventory, BorrowRecord, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/sequelize');

// Generate inventory report
exports.generateInventoryReport = async (req, res, next) => {
  try {
    const { department, status, pcType, startDate, endDate, format = 'json' } = req.query;

    const where = {};

    if (department) where.department = department;
    if (status) where.status = status;
    if (pcType) where.pcType = pcType;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    const inventory = await Inventory.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email', 'department']
        }
      ],
      order: [['department', 'ASC'], ['fullName', 'ASC']]
    });

    // Summary statistics
    const summary = {
      totalItems: inventory.length,
      byStatus: {},
      byPcType: {},
      byDepartment: {},
      byWindowsVersion: {}
    };

    inventory.forEach(item => {
      // By status
      summary.byStatus[item.status] = (summary.byStatus[item.status] || 0) + 1;
      // By PC Type
      summary.byPcType[item.pcType] = (summary.byPcType[item.pcType] || 0) + 1;
      // By department
      summary.byDepartment[item.department] = (summary.byDepartment[item.department] || 0) + 1;
      // By Windows Version
      if (item.windowsVersion) {
        summary.byWindowsVersion[item.windowsVersion] = (summary.byWindowsVersion[item.windowsVersion] || 0) + 1;
      }
    });

    if (format === 'csv') {
      const csvData = generateCSV(inventory, [
        'fullName', 'department', 'pcName', 'pcType', 'windowsVersion', 
        'microsoftOffice', 'applicationsSystem', 'status', 'userStatus', 
        'serialNumber', 'brand', 'model', 'remarks'
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: {
        summary,
        items: inventory,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate borrow/return report
exports.generateBorrowReport = async (req, res, next) => {
  try {
    const { status, startDate, endDate, department, format = 'json' } = req.query;

    const where = {};

    if (status) where.status = status;
    if (department) where.borrowerDepartment = department;
    if (startDate && endDate) {
      where.borrowDate = { [Op.between]: [startDate, endDate] };
    }

    const records = await BorrowRecord.findAll({
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
      order: [['borrowDate', 'DESC']]
    });

    // Summary statistics
    const summary = {
      totalRecords: records.length,
      byStatus: {},
      totalBorrowed: records.filter(r => r.status === 'Borrowed').length,
      totalReturned: records.filter(r => r.status === 'Returned').length,
      totalOverdue: records.filter(r => r.status === 'Overdue').length,
      totalExtended: records.filter(r => r.status === 'Extended').length
    };

    records.forEach(record => {
      summary.byStatus[record.status] = (summary.byStatus[record.status] || 0) + 1;
    });

    if (format === 'csv') {
      const csvRows = records.map(r => ({
        borrowerName: r.borrowerName,
        borrowerDepartment: r.borrowerDepartment,
        itemName: r.inventory?.pcName || 'N/A',
        pcType: r.inventory?.pcType || 'N/A',
        serialNumber: r.inventory?.serialNumber || 'N/A',
        borrowDate: r.borrowDate,
        expectedReturnDate: r.expectedReturnDate,
        actualReturnDate: r.actualReturnDate || 'N/A',
        status: r.status,
        returnCondition: r.returnCondition || 'N/A',
        purpose: r.purpose || 'N/A'
      }));

      const csvData = generateCSV(csvRows, Object.keys(csvRows[0] || {}));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=borrow-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: {
        summary,
        records,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate department report
exports.generateDepartmentReport = async (req, res, next) => {
  try {
    const departments = await Inventory.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalItems'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Active User' THEN 1 ELSE 0 END")), 'activeItems'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Available' THEN 1 ELSE 0 END")), 'availableItems'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END")), 'maintenanceItems'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN pc_type = 'LAPTOP' THEN 1 ELSE 0 END")), 'laptops'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN pc_type = 'DESKTOP' THEN 1 ELSE 0 END")), 'desktops'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_borrowed = 1 THEN 1 ELSE 0 END")), 'borrowed']
      ],
      group: ['department'],
      order: [['department', 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        departments,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate activity report (recent changes)
exports.generateActivityReport = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Recent inventory additions
    const recentAdditions = await Inventory.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Recent borrow activities
    const recentBorrows = await BorrowRecord.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'pcName', 'pcType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Recent returns
    const recentReturns = await BorrowRecord.findAll({
      where: {
        status: 'Returned',
        actualReturnDate: { [Op.gte]: startDate.toISOString().split('T')[0] }
      },
      include: [
        {
          model: Inventory,
          as: 'inventory',
          attributes: ['id', 'pcName', 'pcType']
        }
      ],
      order: [['actualReturnDate', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        recentAdditions: {
          count: recentAdditions.length,
          items: recentAdditions
        },
        recentBorrows: {
          count: recentBorrows.length,
          items: recentBorrows
        },
        recentReturns: {
          count: recentReturns.length,
          items: recentReturns
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    // Inventory summary
    const totalInventory = await Inventory.count();
    const activeItems = await Inventory.count({ where: { status: 'Active User' } });
    const availableItems = await Inventory.count({ where: { status: 'Available' } });
    const maintenanceItems = await Inventory.count({ where: { status: 'Maintenance' } });
    const borrowedItems = await Inventory.count({ where: { isBorrowed: true } });

    // PC Type summary
    const laptops = await Inventory.count({ where: { pcType: 'LAPTOP' } });
    const desktops = await Inventory.count({ where: { pcType: 'DESKTOP' } });

    // Borrow summary
    const activeBorrows = await BorrowRecord.count({
      where: { status: { [Op.in]: ['Borrowed', 'Extended'] } }
    });
    const overdueItems = await BorrowRecord.count({
      where: { status: 'Overdue' }
    });

    // Upcoming returns (next 7 days)
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

    // Recent activities
    const recentBorrows = await BorrowRecord.findAll({
      include: [
        { model: Inventory, as: 'inventory', attributes: ['pcName', 'pcType'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        inventory: {
          total: totalInventory,
          active: activeItems,
          available: availableItems,
          maintenance: maintenanceItems,
          borrowed: borrowedItems
        },
        pcTypes: {
          laptops,
          desktops
        },
        borrows: {
          active: activeBorrows,
          overdue: overdueItems,
          upcomingReturns
        },
        recentActivity: recentBorrows
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate CSV
function generateCSV(data, columns) {
  if (!data || data.length === 0) {
    return columns.join(',') + '\n';
  }

  const header = columns.join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col] || item.dataValues?.[col] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return header + '\n' + rows.join('\n');
}
