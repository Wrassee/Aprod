// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

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

console.log('✅ Supabase Admin Client initialized');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key exists:', supabaseServiceKey.length > 0 ? 'YES' : 'NO');
console.log('🔑 Service Role Key length:', supabaseServiceKey.length);

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to verify Supabase JWT token and attach user to request
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

    // Attach user to request object
    (req as any).user = user;
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
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser) {
      return res.status(401).json({ 
        message: 'Unauthorized - User not authenticated' 
      });
    }

    // Allow if user is accessing their own profile
    if (authenticatedUser.id === requestedUserId) {
      return next();
    }

    // Check if user has admin role (optional - implement if needed)
    // For now, only allow users to access their own profiles
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
