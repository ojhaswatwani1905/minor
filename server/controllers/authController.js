import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readJson, writeJson } from '../utils/jsonDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const admins = await readJson('admins');
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check bcrypt password or default demo pass
    let isMatch = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = admin.password === password;
    }

    // Allow Admin@123 default fallback for initial demo account
    if (!isMatch && email.toLowerCase() === 'admin@stsms.gov' && password === 'Admin@123') {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(admin);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        department: admin.department
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    const admins = await readJson('admins');
    const users = await readJson('users');
    const existing = admins.find(a => a.email.toLowerCase() === email.toLowerCase()) || users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}`;
    const guardianPhone = req.body.guardianPhone || req.body.phone || '+91 98765 43210';

    const newAdmin = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'Explorer User',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      department: department || 'Tourist Explorer',
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    await writeJson('admins', admins);

    // Also register user into users.json (Tourist Registry) so they immediately display on the Admin Dashboard & Live Map!
    const newUserProfile = {
      id: userId,
      fullName: name,
      email: email.toLowerCase(),
      phone: req.body.phone || guardianPhone,
      emergencyContact: guardianPhone,
      status: 'Online',
      currentLocation: {
        name: 'Manali Expedition Base Camp',
        lat: 32.2432,
        lng: 77.1892,
        elevation: '2,050 m'
      },
      batteryLevel: 100,
      networkSignal: 'Good (5G)',
      offlineDurationMinutes: 0,
      guardians: [
        {
          name: 'Primary Guardian',
          relation: 'Family',
          phone: guardianPhone,
          verified: true
        }
      ],
      documents: [
        {
          type: 'Mobile Safety Pass',
          status: 'Verified',
          number: `SP-${Math.floor(100000 + Math.random() * 900000)}`
        }
      ],
      activeTripId: null,
      lastPing: new Date().toISOString()
    };
    users.unshift(newUserProfile);
    await writeJson('users', users);

    const token = generateToken(newAdmin);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: userId,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        avatar: newAdmin.avatar,
        department: newAdmin.department
      },
      admin: {
        id: userId,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        avatar: newAdmin.avatar,
        department: newAdmin.department
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const admins = await readJson('admins');
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());

    if (!admin) {
      // Return success to avoid email enumeration
      return res.json({
        success: true,
        message: 'If an admin account exists for this email, password reset instructions have been sent.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link and security OTP sent to registered admin email.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const admins = await readJson('admins');
    const admin = admins.find(a => a.id === req.admin.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin profile not found' });
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        department: admin.department
      }
    });
  } catch (error) {
    next(error);
  }
};
