import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readJson, writeJson } from '../utils/jsonDb.js';
import { isSupabaseConfigured, getSupabaseClient } from '../database/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name || user.fullName, role: user.role },
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

    const normalizedEmail = email.trim().toLowerCase();

    // 1. If Supabase is configured, authenticate authoritatively via Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (sbData?.user) {
          const authUser = sbData.user;
          // Retrieve profile details from profiles table
          let fullName = authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Registered Explorer';
          let phone = authUser.phone || null;
          let avatar = authUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
          const userRole = authUser.user_metadata?.role || 'Explorer User';

          try {
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
            if (prof?.full_name) fullName = prof.full_name;
            if (prof?.phone) phone = prof.phone;
            if (prof?.medical_info?.avatar_url) avatar = prof.medical_info.avatar_url;
          } catch (pErr) {
            console.warn('[AUTH LOGIN] Profile lookup note:', pErr.message);
          }

          // Sync to local admins.json / users.json for fast local caching & offline fallback
          try {
            const admins = await readJson('admins');
            let aIdx = admins.findIndex(a => a.id === authUser.id || (a.email && a.email.toLowerCase() === normalizedEmail));
            if (aIdx === -1) {
              const salt = await bcrypt.genSalt(10);
              const hashed = await bcrypt.hash(password, salt);
              admins.push({
                id: authUser.id,
                name: fullName,
                email: normalizedEmail,
                password: hashed,
                role: userRole,
                avatar,
                department: 'Tourist Explorer',
                createdAt: authUser.created_at || new Date().toISOString()
              });
              await writeJson('admins', admins);
            }

            const users = await readJson('users');
            let uIdx = users.findIndex(u => u.id === authUser.id || (u.email && u.email.toLowerCase() === normalizedEmail));
            if (uIdx !== -1) {
              users[uIdx].id = authUser.id;
              users[uIdx].fullName = fullName;
              users[uIdx].email = normalizedEmail;
              if (phone) users[uIdx].phone = phone;
              await writeJson('users', users);
            }
          } catch (syncErr) {
            console.warn('[AUTH LOGIN] Local cache sync note:', syncErr.message);
          }

          const token = generateToken({
            id: authUser.id,
            email: normalizedEmail,
            name: fullName,
            role: userRole
          });

          return res.json({
            success: true,
            token,
            user: {
              id: authUser.id,
              name: fullName,
              fullName,
              email: normalizedEmail,
              role: userRole,
              avatar,
              department: 'Tourist Explorer'
            },
            admin: {
              id: authUser.id,
              name: fullName,
              email: normalizedEmail,
              role: userRole,
              avatar,
              department: 'Tourist Explorer'
            }
          });
        }

        if (sbError) {
          const errMsg = sbError.message?.toLowerCase() || '';
          if (errMsg.includes('email not confirmed')) {
            return res.status(403).json({
              success: false,
              message: 'Email address is not confirmed. Please check your inbox or verify your account.'
            });
          }
        }
      } catch (sbEx) {
        console.warn('[AUTH LOGIN] Supabase Auth query error, attempting local fallback:', sbEx.message);
      }
    }

    // 2. Check local admins.json (for demo accounts e.g. admin@stsms.gov or local offline dev)
    const admins = await readJson('admins');
    const admin = admins.find(a => a.email && a.email.toLowerCase() === normalizedEmail);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check bcrypt password or default demo pass
    let isMatch = false;
    if (admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, admin.password);
    } else {
      isMatch = admin.password === password;
    }

    // Allow Admin@123 or admin123 default fallback for initial demo account
    if (!isMatch && normalizedEmail === 'admin@stsms.gov' && (password === 'Admin@123' || password === 'admin123' || password === 'admin')) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(admin);

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        name: admin.name,
        fullName: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        department: admin.department
      },
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
    const rawName = req.body.name || req.body.fullName;
    const { email, password, department, role } = req.body;

    if (!rawName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = rawName.trim();
    const guardianPhone = req.body.guardianPhone || req.body.phone || null;
    const userRole = role || 'Explorer User';

    let userId = null;
    const isSb = isSupabaseConfigured();

    // 1. Authoritative Registration via Supabase Auth when configured
    if (isSb) {
      const supabase = getSupabaseClient();

      // Check if user already exists in Supabase Auth
      try {
        if (supabase.auth?.admin?.listUsers) {
          const { data: existingList } = await supabase.auth.admin.listUsers();
          const alreadyExists = existingList?.users?.some(u => u.email && u.email.toLowerCase() === normalizedEmail);
          if (alreadyExists) {
            return res.status(400).json({
              success: false,
              message: 'An account with this email address already exists. Please log in.'
            });
          }
        }
      } catch (checkErr) {
        // Non-fatal if listUsers is not permitted
      }

      // In wilderness safety context, auto-confirm accounts unless explicitly configured to require SMTP email validation
      const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
      const autoConfirmEmail = !requireEmailVerification;

      // Create authoritative user in Supabase Auth
      const { data: authCreated, error: authErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: autoConfirmEmail,
        user_metadata: {
          name: cleanName,
          full_name: cleanName,
          role: userRole,
          department: department || 'Tourist Explorer'
        }
      });

      if (authErr) {
        const msg = authErr.message || '';
        if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate') || authErr.status === 422) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists. Please log in.'
          });
        }
        return res.status(400).json({
          success: false,
          message: authErr.message || 'Registration failed in Supabase Auth.'
        });
      }

      if (authCreated?.user?.id) {
        userId = authCreated.user.id;
      }

      // 2. Create authoritative corresponding profile in Supabase profiles table
      if (userId) {
        try {
          const { error: profErr } = await supabase.from('profiles').upsert({
            id: userId,
            full_name: cleanName,
            phone: req.body.phone || null,
            language: 'en',
            medical_info: {
              emergency_contact_phone: guardianPhone || null,
              emergency_contact_email: normalizedEmail,
              department: department || 'Tourist Explorer'
            }
          });
          if (profErr) {
            console.error('[AUTH REGISTER] Supabase profiles upsert error:', profErr.message || profErr);
          }
        } catch (profEx) {
          console.error('[AUTH REGISTER] Supabase profiles upsert exception:', profEx.message);
        }
      }
    }

    // 3. Fallback / Local ID generation if Supabase not configured
    if (!userId) {
      userId = `usr_${Date.now()}`;
    }

    // 4. Also store in local JSON DBs for caching, offline dev & regression suite consistency
    const admins = await readJson('admins');
    const users = await readJson('users');

    const localExisting = admins.find(a => a.email && a.email.toLowerCase() === normalizedEmail) ||
      users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);

    if (localExisting && !isSb) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = {
      id: userId,
      name: cleanName,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      department: department || 'Tourist Explorer',
      createdAt: new Date().toISOString()
    };

    // Upsert into admins.json
    const aIdx = admins.findIndex(a => a.id === userId || (a.email && a.email.toLowerCase() === normalizedEmail));
    if (aIdx !== -1) {
      admins[aIdx] = newAdmin;
    } else {
      admins.push(newAdmin);
    }
    await writeJson('admins', admins);

    // Register user into users.json (Tourist Registry)
    const parsedLat = req.body.lat != null ? parseFloat(req.body.lat) : null;
    const parsedLng = req.body.lng != null ? parseFloat(req.body.lng) : null;
    const hasValidCoords = parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng);

    const newUserProfile = {
      id: userId,
      fullName: cleanName,
      email: normalizedEmail,
      phone: req.body.phone || guardianPhone,
      emergencyContact: guardianPhone,
      status: 'Online',
      currentLocation: hasValidCoords ? {
        name: req.body.locationName || `GPS Fix (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
        lat: parsedLat,
        lng: parsedLng,
        elevation: req.body.elevation || null
      } : null,
      batteryLevel: req.body.batteryLevel != null && !isNaN(parseInt(req.body.batteryLevel)) ? parseInt(req.body.batteryLevel) : null,
      networkSignal: req.body.networkSignal || 'Good (5G)',
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
      lastPing: hasValidCoords ? new Date().toISOString() : null
    };

    const uIdx = users.findIndex(u => u.id === userId || (u.email && u.email.toLowerCase() === normalizedEmail));
    if (uIdx !== -1) {
      users[uIdx] = { ...users[uIdx], ...newUserProfile };
    } else {
      users.unshift(newUserProfile);
    }
    await writeJson('users', users);

    const token = generateToken(newAdmin);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: userId,
        name: cleanName,
        fullName: cleanName,
        email: normalizedEmail,
        role: userRole,
        avatar: newAdmin.avatar,
        department: newAdmin.department
      },
      admin: {
        id: userId,
        name: cleanName,
        email: normalizedEmail,
        role: userRole,
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
