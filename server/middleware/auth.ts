// server/middleware/auth.ts - JAVÍTOTT ÉS ROBUSZTUS VERZIÓ (Email confirmation support + ID FIX)
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

// Service role client az admin műveletekhez
// Backend oldalon nem kell persistSession és autoRefreshToken
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Middleware to verify Supabase JWT token, attach user to request,
 * AND synchronize local profile role with Supabase role + email confirmation status.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // 1. Token kinyerése (Robusztus módon)
    if (!authHeader) {
      console.warn(`[Auth] Missing Authorization header on ${req.path}`);
      return res.status(401).json({ message: 'No token provided' });
    }

    // Levágjuk a "Bearer " előtagot, függetlenül a kis/nagybetűtől
    // és kezeljük, ha véletlenül többször szerepelne
    let token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      console.warn(`[Auth] Empty token on ${req.path}`);
      return res.status(401).json({ message: 'Empty token' });
    }

    // 2. Token ellenőrzése a Supabase-nél
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error(`[Auth] Invalid token on ${req.path}:`, error?.message);
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    console.log(`✅ [Auth] User authenticated: ${user.id} (${user.email})`);

    // === AUTOMATIKUS SZINKRONIZÁCIÓ KEZDETE ===
    // 3. Supabase role és email confirmation státusz lekérése
    const supabaseRole = user.app_metadata?.role || 'user';
    const emailConfirmed = user.email_confirmed_at !== null;

    console.log(`🔍 [Auth] Supabase metadata - Role: ${supabaseRole}, Email confirmed: ${emailConfirmed}`);

    // 4. Helyi profil lekérése
    let localProfile = await storage.getProfileByUserId(user.id);

    // 5. Ha nincs helyi profil, létrehozzuk a helyes adatokkal
    if (!localProfile) {
      console.log(`🔄 [Auth] Creating missing local profile for ${user.id} with role: ${supabaseRole}, email_confirmed: ${emailConfirmed}`);
      localProfile = await storage.createProfile({
        user_id: user.id,
        email: user.email!,
        role: supabaseRole,
        email_confirmed: emailConfirmed,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
      });
    }
    // 6. Ha van helyi profil, de valami eltér, frissítjük
    else {
      const needsUpdate = 
        localProfile.role !== supabaseRole || 
        localProfile.email_confirmed !== emailConfirmed;

      if (needsUpdate) {
        console.log(`🔄 [Auth] Syncing profile for ${user.id}:`, {
          role: `${localProfile.role} -> ${supabaseRole}`,
          email_confirmed: `${localProfile.email_confirmed} -> ${emailConfirmed}`
        });

        const updatedProfile = await storage.updateProfile(user.id, { 
          role: supabaseRole,
          email_confirmed: emailConfirmed
        });

        if (updatedProfile) {
          localProfile = updatedProfile;
        }
      }
    }
    // === AUTOMATIKUS SZINKRONIZÁCIÓ VÉGE ===

    // 🔥 KRITIKUS JAVÍTÁS: req.user.id MINDIG AZ AUTH USER ID LEGYEN!
    // A localProfile.id a Profile tábla ID-ja (más UUID)
    // De nekünk mindenhol az Auth User ID kell (user.id)
    (req as any).user = {
      ...user,                    // Supabase Auth User adatai (id, email, stb.)
      ...localProfile,            // Profil adatok (role, name, email_confirmed, stb.)
      id: user.id,                // 🔥 KÉNYSZERÍTJÜK: az id MINDIG az AUTH USER ID
      user_id: user.id,           // 🔥 Biztonsági másolat: user_id is az AUTH USER ID
      profile_id: localProfile?.id // Ha kell a Profile tábla ID-ja, itt van
    };

    console.log(`✅ [Auth] User object attached to request:`, {
      id: (req as any).user.id,
      user_id: (req as any).user.user_id,
      profile_id: (req as any).user.profile_id,
      email: (req as any).user.email,
      role: (req as any).user.role
    });

    next();

  } catch (error) {
    console.error('❌ [Auth] Middleware fatal error:', error);
    return res.status(500).json({ message: 'Internal Authentication Error' });
  }
}

/**
 * Middleware to ensure the user has confirmed their email
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

    // 🔥 JAVÍTÁS: Mindig a user_id-t használjuk (ami most már az Auth User ID)
    const currentUserId = authenticatedUser.user_id || authenticatedUser.id;

    if (currentUserId === requestedUserId) {
      console.log(`✅ [Auth] Owner access granted for user: ${currentUserId}`);
      return next();
    }

    if (authenticatedUser.role === 'admin') {
      console.log(`✅ [Auth] Admin access granted for user: ${currentUserId}`);
      return next();
    }

    console.warn(`⚠️ [Auth] Access denied for user ${currentUserId} to resource ${requestedUserId}`);
    return res.status(403).json({ 
      message: 'Forbidden - You can only access your own profile' 
    });
  } catch (error) {
    console.error('❌ [Auth] Owner/Admin check error:', error);
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
    console.warn('⚠️ [Auth] requireAdmin: No authenticated user found');
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (authenticatedUser.role === 'admin') {
    console.log(`✅ [Auth] Admin access granted for user: ${authenticatedUser.user_id || authenticatedUser.id}`);
    next();
  } else {
    console.warn(`⚠️ [Auth] requireAdmin: User ${authenticatedUser.user_id || authenticatedUser.id} has role '${authenticatedUser.role}', admin required`);
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
}