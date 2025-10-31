// server/middleware/audit-logger.ts
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage.js';
import { InsertAuditLog } from '../db.js';

/**
 * Audit Logger Middleware Factory
 * 
 * Ez a middleware gyár függvény hozza létre az audit naplózó middleware-t.
 * Minden admin műveletet automatikusan naplóz az adatbázisba.
 * 
 * @param action - Az audit akció típusa (pl. "template.upload", "user.delete")
 * @param options - További opciók a naplózáshoz
 * @returns Express middleware függvény
 * 
 * @example
 * router.delete('/users/:id', requireAdmin, auditLog('user.delete'), async (req, res) => {
 *   // A törlési logika
 * });
 */
export function auditLog(
  action: string,
  options: {
    resourceType?: string;
    getResourceId?: (req: Request) => string | undefined;
    getDetails?: (req: Request, res: Response) => Record<string, any> | undefined;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Az eredeti res.json mentése
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    
    let statusCode = 200;
    let responseData: any = null;
    
    // res.status override - rögzítjük a státuszkódot
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus(code);
    };
    
    // res.json override - elkapjuk a választ és naplózunk
    res.json = function(data: any) {
      responseData = data;
      
      // Naplózás aszinkron módon (nem blokkoljuk a választ)
      setImmediate(async () => {
        try {
          const user = (req as any).user; // A requireAuth middleware-ből
          
          if (!user) {
            console.warn('⚠️ Audit log: No user found in request');
            return;
          }
          
          // Meghatározzuk a művelet sikerességét
          const isSuccess = statusCode >= 200 && statusCode < 300;
          
          // Resource ID meghatározása
          let resourceId: string | undefined;
          if (options.getResourceId) {
            resourceId = options.getResourceId(req);
          } else if (req.params.id) {
            resourceId = req.params.id;
          }
          
          // Részletek összegyűjtése
          let details: Record<string, any> | undefined;
          if (options.getDetails) {
            details = options.getDetails(req, res);
          } else {
            // Alapértelmezett részletek
            details = {
              method: req.method,
              path: req.path,
              params: req.params,
              // Body csak POST/PUT/PATCH esetén (ne logoljuk a jelszavakat!)
              body: ['POST', 'PUT', 'PATCH'].includes(req.method) 
                ? sanitizeBody(req.body) 
                : undefined,
            };
          }
          
          // Ha sikertelen, hozzáadjuk a hibaüzenetet
          const errorMessage = !isSuccess && responseData?.message 
            ? responseData.message 
            : undefined;
          
          // Audit log bejegyzés létrehozása
          const auditLogEntry: InsertAuditLog = {
            user_id: user.id,
            user_email: user.email || undefined,
            action: action,
            resource_type: options.resourceType,
            resource_id: resourceId,
            details: details,
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent'] || undefined,
            status: isSuccess ? 'success' : 'failure',
            error_message: errorMessage,
          };
          
          await storage.createAuditLog(auditLogEntry);
          
        } catch (error) {
          console.error('❌ Failed to create audit log:', error);
          // A naplózás hibája nem akaszthatja meg a fő műveletet
        }
      });
      
      // Eredeti válasz küldése
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Szenzitív adatok eltávolítása a request body-ból a naplózás előtt.
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'apiKey'];
  
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Kliens IP cím meghatározása (proxy-k figyelembevételével).
 */
function getClientIp(req: Request): string | undefined {
  // Proxy-k által beállított headerek ellenőrzése
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Az x-forwarded-for lehet egy lista, az első az eredeti IP
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  
  // Cloudflare header
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp as string;
  }
  
  // Express standard
  return req.ip || req.socket.remoteAddress;
}

/**
 * Batch audit logging - több művelet egyszerre történő naplózása
 * Hasznos bulk műveletekhez (pl. több felhasználó törlése egyszerre)
 */
export async function logBatchOperation(
  user: { id: string; email?: string },
  action: string,
  resourceType: string,
  resourceIds: string[],
  details?: Record<string, any>,
  req?: Request
) {
  try {
    const baseLog: Partial<InsertAuditLog> = {
      user_id: user.id,
      user_email: user.email,
      action: action,
      resource_type: resourceType,
      ip_address: req ? getClientIp(req) : undefined,
      user_agent: req ? (req.headers['user-agent'] || undefined) : undefined,
      status: 'success',
    };
    
    // Minden resource ID-re külön log bejegyzés
    for (const resourceId of resourceIds) {
      await storage.createAuditLog({
        ...baseLog,
        resource_id: resourceId,
        details: {
          ...details,
          batch: true,
          total_count: resourceIds.length,
        },
      } as InsertAuditLog);
    }
    
    console.log(`✅ Batch audit log created for ${resourceIds.length} resources`);
  } catch (error) {
    console.error('❌ Failed to create batch audit log:', error);
  }
}

/**
 * Manual audit log helper - közvetlen naplózáshoz route handler-ekből
 * Használd ezt, ha a middleware nem megfelelő (pl. komplex művelet)
 */
export async function createManualAuditLog(
  req: Request,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
) {
  try {
    const user = (req as any).user;
    
    if (!user) {
      console.warn('⚠️ Manual audit log: No user found in request');
      return;
    }
    
    const auditLogEntry: InsertAuditLog = {
      user_id: user.id,
      user_email: user.email || undefined,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || undefined,
      status: status,
      error_message: errorMessage,
    };
    
    await storage.createAuditLog(auditLogEntry);
    console.log(`✅ Manual audit log created: ${action}`);
  } catch (error) {
    console.error('❌ Failed to create manual audit log:', error);
  }
}