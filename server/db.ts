import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, cnpjHistory, InsertCNPJHistory, companyAliases, InsertCompanyAlias } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function saveCNPJHistory(data: InsertCNPJHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save CNPJ history: database not available");
    return;
  }

  try {
    // Verificar se o CNPJ já existe
    const existing = await db.select().from(cnpjHistory).where(eq(cnpjHistory.cnpj, data.cnpj)).limit(1);
    
    if (existing.length > 0) {
      // Se existe, atualizar o timestamp (mover para o topo)
      await db.delete(cnpjHistory).where(eq(cnpjHistory.cnpj, data.cnpj));
    }
    
    // Inserir o novo registro
    await db.insert(cnpjHistory).values(data);
    
    // Manter apenas os últimos 1000 registros
    const allRecords = await db.select().from(cnpjHistory).orderBy(desc(cnpjHistory.createdAt));
    if (allRecords.length > 1000) {
      const recordsToDelete = allRecords.slice(1000);
      for (const record of recordsToDelete) {
        await db.delete(cnpjHistory).where(eq(cnpjHistory.id, record.id));
      }
    }
  } catch (error) {
    console.error("[Database] Failed to save CNPJ history:", error);
  }
}

export async function getCNPJHistory() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get CNPJ history: database not available");
    return [];
  }

  try {
    const records = await db.select().from(cnpjHistory).orderBy(desc(cnpjHistory.createdAt));
    return records;
  } catch (error) {
    console.error("[Database] Failed to get CNPJ history:", error);
    return [];
  }
}

export async function deleteCNPJHistory(cnpj: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete CNPJ history: database not available");
    return false;
  }

  try {
    const result = await db.delete(cnpjHistory).where(eq(cnpjHistory.cnpj, cnpj));
    console.log(`[Database] Deleted CNPJ ${cnpj} from history`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete CNPJ history:", error);
    return false;
  }
}

// ============ Company Aliases Functions ============

export async function addCompanyAlias(cnpj: string, alias: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add alias: database not available");
    return false;
  }

  try {
    await db.insert(companyAliases).values({ cnpj, alias });
    console.log(`[Database] Added alias "${alias}" for CNPJ ${cnpj}`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to add alias:", error);
    return false;
  }
}

export async function getCompanyAliases(cnpj: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get aliases: database not available");
    return [];
  }

  try {
    const records = await db.select().from(companyAliases).where(eq(companyAliases.cnpj, cnpj));
    return records;
  } catch (error) {
    console.error("[Database] Failed to get aliases:", error);
    return [];
  }
}

export async function getAllAliases() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all aliases: database not available");
    return [];
  }

  try {
    const records = await db.select().from(companyAliases);
    return records;
  } catch (error) {
    console.error("[Database] Failed to get all aliases:", error);
    return [];
  }
}

export async function updateCompanyAlias(id: number, newAlias: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update alias: database not available");
    return false;
  }

  try {
    const trimmedAlias = newAlias.trim();
    if (trimmedAlias.length === 0) {
      throw new Error('Apelido não pode estar vazio');
    }
    
    await db.update(companyAliases).set({ alias: trimmedAlias }).where(eq(companyAliases.id, id));
    console.log(`[Database] Updated alias with id ${id} to "${trimmedAlias}"`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to update alias:", error);
    return false;
  }
}

export async function deleteCompanyAlias(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete alias: database not available");
    return false;
  }

  try {
    await db.delete(companyAliases).where(eq(companyAliases.id, id));
    console.log(`[Database] Deleted alias with id ${id}`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete alias:", error);
    return false;
  }
}
