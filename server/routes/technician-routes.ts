// server/routes/technician-routes.ts - Technikus modul API végpontok
import express from 'express';
import { storage } from '../storage.js';
import { requireAuth, requireTechnicianOrAdmin, requireAdmin } from '../middleware/auth.js';
import { ProtocolErrorSchema } from '../../shared/schema.js';
import { z } from 'zod';

const router = express.Router();

// GET /api/technician/my-assignments
// Visszaadja az aktuálisan bejelentkezett technikushoz rendelt protokollokat (hibalistával együtt)
router.get('/my-assignments', requireAuth, requireTechnicianOrAdmin, async (req, res) => {
  try {
    const user = (req as any).user;
    const technicianId = user.user_id || user.id;

    const protocols = await storage.getProtocolsByTechnicianId(technicianId);

    // Add summary info to each protocol
    const result = protocols.map((p: any) => {
      const errors: any[] = Array.isArray(p.errors) ? p.errors : [];
      const totalErrors = errors.length;
      const doneErrors = errors.filter((e: any) => e.status === 'done').length;
      const pendingErrors = errors.filter((e: any) => !e.status || e.status === 'pending').length;
      const blockedErrors = errors.filter((e: any) => e.status === 'blocked').length;

      return {
        ...p,
        errorSummary: { totalErrors, doneErrors, pendingErrors, blockedErrors },
      };
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching technician assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

// PATCH /api/technician/assignments/:protocolId/errors/:errorId
// Technikus dokumentálja a javítást egy adott hibánál
router.patch('/assignments/:protocolId/errors/:errorId', requireAuth, requireTechnicianOrAdmin, async (req, res) => {
  try {
    const { protocolId, errorId } = req.params;
    const user = (req as any).user;
    const technicianId = user.user_id || user.id;

    const protocol = await storage.getProtocol(protocolId);
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found' });
    }

    // Admins can update any protocol; technicians only their assigned protocols
    if (user.role !== 'admin' && protocol.assigned_technician_id !== technicianId) {
      return res.status(403).json({ message: 'This protocol is not assigned to you' });
    }

    const UpdateSchema = z.object({
      status: z.enum(['pending', 'in_progress', 'done', 'blocked']).optional(),
      technicianComment: z.string().optional(),
      proofPhotoUrl: z.string().optional(),
    });

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid body', errors: parsed.error.errors });
    }

    const { status, technicianComment, proofPhotoUrl } = parsed.data;

    const errors: any[] = Array.isArray(protocol.errors) ? [...protocol.errors] : [];
    const errorIndex = errors.findIndex((e: any) => e.id === errorId);

    if (errorIndex === -1) {
      return res.status(404).json({ message: 'Error not found in protocol' });
    }

    const existingError = errors[errorIndex];
    const now = new Date().toISOString();

    errors[errorIndex] = {
      ...existingError,
      ...(status !== undefined && { status }),
      ...(technicianComment !== undefined && { technicianComment }),
      ...(proofPhotoUrl !== undefined && { proofPhotoUrl }),
      assignedTechnicianId: technicianId,
      assignedTechnicianName: user.name || user.email?.split('@')[0] || technicianId,
      completionDate: status === 'done' ? now : existingError.completionDate,
    };

    const updated = await storage.updateProtocol(protocolId, { errors });
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update protocol' });
    }

    res.json({ success: true, error: errors[errorIndex] });
  } catch (error) {
    console.error('❌ Error documenting repair:', error);
    res.status(500).json({ message: 'Failed to document repair' });
  }
});

// GET /api/technician/technicians  (Admin only — list all technicians)
router.get('/technicians', requireAuth, requireAdmin, async (req, res) => {
  try {
    const technicians = await storage.getTechnicianUsers();
    res.json(technicians);
  } catch (error) {
    console.error('❌ Error fetching technicians:', error);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
});

// POST /api/technician/assign/:protocolId  (Admin only — assign technician to protocol)
router.post('/assign/:protocolId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { protocolId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId && technicianId !== null) {
      return res.status(400).json({ message: 'technicianId is required (or null to unassign)' });
    }

    const protocol = await storage.getProtocol(protocolId);
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found' });
    }

    const updated = await storage.updateProtocol(protocolId, {
      assigned_technician_id: technicianId,
    });

    if (!updated) {
      return res.status(500).json({ message: 'Failed to assign technician' });
    }

    res.json({ success: true, protocol: updated });
  } catch (error) {
    console.error('❌ Error assigning technician:', error);
    res.status(500).json({ message: 'Failed to assign technician' });
  }
});

export default router;
