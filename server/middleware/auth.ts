// server/middleware/auth.ts - JAVÍTOTT VERZIÓ (Automatikus role szinkronizációval)
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
 * AND synchronize local profile role with Supabase role.
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
    // 1. Supabase role lekérése az app_metadata-ból
    const supabaseRole = user.app_metadata?.role || 'user';

    // 2. Helyi profil lekérése
    let localProfile = await storage.getProfileByUserId(user.id);

    // 3. Ha nincs helyi profil, létrehozzuk a helyes role-lal
    if (!localProfile) {
      console.log(`🔄 Creating missing local profile for ${user.id} with role: ${supabaseRole}`);
      localProfile = await storage.createProfile({
        user_id: user.id,
        email: user.email!,
        role: supabaseRole,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
      });
    }
    // 4. Ha van helyi profil, de a role eltér, frissítjük
    else if (localProfile.role !== supabaseRole) {
       console.log(`🔄 Syncing role for ${user.id}: local=${localProfile.role} -> supabase=${supabaseRole}`);
       // Frissítjük a profilt és megvárjuk az eredményt
       const updatedProfile = await storage.updateProfile(user.id, { role: supabaseRole });
       if (updatedProfile) {
         localProfile = updatedProfile; // Használjuk a frissített profilt
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
 * Middleware to ensure the authenticated user can only access their own profile
 * or they have admin role
 */
export async function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const requestedUserId = req.params.userId;
    // Itt már a requireAuth által beállított, szinkronizált user van
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser) {
      return res.status(401).json({ 
        message: 'Unauthorized - User not authenticated' 
      });
    }

    // Allow if user is accessing their own profile
    // Figyelem: a localProfile-ban 'user_id' van, a nyers Supabase userben 'id'
    const currentUserId = authenticatedUser.user_id || authenticatedUser.id;

    if (currentUserId === requestedUserId) {
      return next();
    }

    // Check if user has admin role (már szinkronizálva van)
    if (authenticatedUser.role === 'admin') {
      console.log('✅ Admin access granted for user:', currentUserId);
      return next();
    }

    // User is not admin and not accessing own profile
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

  // Mivel a requireAuth már szinkronizálta a role-t, 
  // itt elég csak a request-re csatolt user objektumot ellenőrizni.
  if (authenticatedUser.role === 'admin') {
    console.log(`✅ Admin access granted for user: ${authenticatedUser.user_id || authenticatedUser.id}`);
    next();
  } else {
    console.warn(`⚠️ requireAdmin: User ${authenticatedUser.user_id || authenticatedUser.id} has role '${authenticatedUser.role}', admin required`);
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
}