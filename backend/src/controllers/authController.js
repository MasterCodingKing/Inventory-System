const { User } = require('../models');
const { generateToken } = require('../middleware/auth');

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { 
        [require('sequelize').Op.or]: [{ email }, { username }] 
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Only admins can create admin/manager accounts
    let userRole = 'user';
    if (req.user && req.user.role === 'admin') {
      userRole = role || 'user';
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: userRole,
      department
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, department } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }

    await user.update({
      fullName: fullName || user.fullName,
      email: email || user.email,
      department: department || user.department
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where[require('sequelize').Op.or] = [
        { username: { [require('sequelize').Op.like]: `%${search}%` } },
        { email: { [require('sequelize').Op.like]: `%${search}%` } },
        { fullName: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users,
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

// Get user by ID (Admin only)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { fullName, email, role, department, isActive } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }

    await user.update({
      fullName: fullName !== undefined ? fullName : user.fullName,
      email: email !== undefined ? email : user.email,
      role: role !== undefined ? role : user.role,
      department: department !== undefined ? department : user.department,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (user.id === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
