// server/middleware/auth.ts - KIBŐVÍTETT VERZIÓ (Email confirmation support)
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { storage } from '../storage.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not set!');
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set!');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

console.log('✅ Supabase Admin Client initialized with service role key');

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to verify Supabase JWT token, attach user to request,
 * AND synchronize local profile role with Supabase role + email confirmation status.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized - No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('❌ Auth error:', error);
      return res.status(401).json({ 
        message: 'Unauthorized - Invalid token' 
      });
    }

    // === AUTOMATIKUS SZINKRONIZÁCIÓ KEZDETE ===
    // 1. Supabase role és email confirmation státusz lekérése
    const supabaseRole = user.app_metadata?.role || 'user';
    const emailConfirmed = user.email_confirmed_at !== null; // ÚJ!

    // 2. Helyi profil lekérése
    let localProfile = await storage.getProfileByUserId(user.id);

    // 3. Ha nincs helyi profil, létrehozzuk a helyes adatokkal
    if (!localProfile) {
      console.log(`🔄 Creating missing local profile for ${user.id} with role: ${supabaseRole}, email_confirmed: ${emailConfirmed}`);
      localProfile = await storage.createProfile({
        user_id: user.id,
        email: user.email!,
        role: supabaseRole,
        email_confirmed: emailConfirmed, // ÚJ!
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
      });
    }
    // 4. Ha van helyi profil, de valami eltér, frissítjük
    else {
      const needsUpdate = 
        localProfile.role !== supabaseRole || 
        localProfile.email_confirmed !== emailConfirmed; // ÚJ!

      if (needsUpdate) {
        console.log(`🔄 Syncing profile for ${user.id}:`, {
          role: `${localProfile.role} -> ${supabaseRole}`,
          email_confirmed: `${localProfile.email_confirmed} -> ${emailConfirmed}`
        });
        
        const updatedProfile = await storage.updateProfile(user.id, { 
          role: supabaseRole,
          email_confirmed: emailConfirmed // ÚJ!
        });
        
        if (updatedProfile) {
          localProfile = updatedProfile;
        }
      }
    }
    // === AUTOMATIKUS SZINKRONIZÁCIÓ VÉGE ===

    // Attach validated (and synced) user profile to request object
    (req as any).user = localProfile || user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error' 
    });
  }
}

/**
 * ÚJ! Middleware to ensure the user has confirmed their email
 * This should be used AFTER requireAuth middleware
 */
export async function requireEmailConfirmed(req: Request, res: Response, next: NextFunction) {
  const authenticatedUser = (req as any).user;

  if (!authenticatedUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (authenticatedUser.email_confirmed === false) {
    return res.status(403).json({ 
      message: 'Email confirmation required. Please check your email and confirm your account.',
      code: 'EMAIL_NOT_CONFIRMED'
    });
  }

  next();
}

/**
 * Middleware to ensure the authenticated user can only access their own profile
 * or they have admin role
 */
export async function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser) {
      return res.status(401).json({ 
        message: 'Unauthorized - User not authenticated' 
      });
    }

    const currentUserId = authenticatedUser.user_id || authenticatedUser.id;

    if (currentUserId === requestedUserId) {
      return next();
    }

    if (authenticatedUser.role === 'admin') {
      console.log('✅ Admin access granted for user:', currentUserId);
      return next();
    }

    return res.status(403).json({ 
      message: 'Forbidden - You can only access your own profile' 
    });
  } catch (error) {
    console.error('❌ Owner/Admin check error:', error);
    return res.status(500).json({ 
      message: 'Authorization error' 
    });
  }
}

/**
 * Middleware to ensure only admin users can access certain routes
 * This should be used AFTER requireAuth middleware
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authenticatedUser = (req as any).user;

  if (!authenticatedUser) {
    console.warn('⚠️ requireAdmin: No authenticated user found');
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (authenticatedUser.role === 'admin') {
    console.log(`✅ Admin access granted for user: ${authenticatedUser.user_id || authenticatedUser.id}`);
    next();
  } else {
    console.warn(`⚠️ requireAdmin: User ${authenticatedUser.user_id || authenticatedUser.id} has role '${authenticatedUser.role}', admin required`);
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
}