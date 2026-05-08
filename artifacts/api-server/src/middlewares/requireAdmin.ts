import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userRolesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [adminRow] = await db
    .select()
    .from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, userId), eq(userRolesTable.role, "admin")))
    .limit(1);

  if (!adminRow) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
