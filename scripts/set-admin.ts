// scripts/set-admin.ts
import { db } from '../server/db.js';
import { profiles } from '../server/db.js';
import { eq } from 'drizzle-orm';

const USER_ID = 'bec0aba7-dc26-4093-b504-11053a66730e'; // A te user_id-d

async function setAdmin() {
  try {
    console.log(`🔑 Setting admin role for user: ${USER_ID}`);
    
    // Check if profile exists
    const existingProfiles = await (db as any).select().from(profiles).where(eq(profiles.user_id, USER_ID));
    
    if (existingProfiles.length === 0) {
      console.log('❌ Profile not found in database');
      console.log('Creating profile...');
      
      // Create profile if it doesn't exist
      const [created] = await (db as any).insert(profiles).values({
        user_id: USER_ID,
        email: 'admin@otis.com', // Change this to your email
        role: 'admin',
      }).returning();
      
      console.log('✅ Admin profile created:', created);
    } else {
      // Update existing profile to admin
      const [updated] = await (db as any)
        .update(profiles)
        .set({ role: 'admin', updated_at: new Date() })
        .where(eq(profiles.user_id, USER_ID))
        .returning();
      
      console.log('✅ Admin role set successfully:', updated);
    }
    
    // Verify
    const [profile] = await (db as any).select().from(profiles).where(eq(profiles.user_id, USER_ID));
    console.log('📊 Current profile:', profile);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setAdmin();
