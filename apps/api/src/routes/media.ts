// ============================================================
// Media Routes — Upload/Download file via R2
// ============================================================

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { getDb, generateId, getNow } from "./helpers";
import type { AppEnv } from "../index";

const media = new Hono<AppEnv>();
media.use("*", authMiddleware);

// POST /upload — Upload file to R2
media.post("/upload", async (c) => {
  const db = getDb(c);
  const tenantId = c.get("tenantId");
  const now = getNow();

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "other";
  const entityType = formData.get("entity_type") as string | null;
  const entityId = formData.get("entity_id") as string | null;

  if (!file) {
    return c.json({ success: false, error: "File tidak ditemukan" }, 400);
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ success: false, error: "Ukuran file maksimal 10MB" }, 400);
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: "Tipe file tidak didukung" }, 400);
  }

  const fileId = generateId();
  const ext = file.name.split(".").pop() || "bin";
  const filename = `${tenantId}/${category}/${fileId}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.MEDIA_BUCKET.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Save metadata to D1
  const url = `/api/media/${fileId}`;
  await db.insert(schema.mediaFiles).values({
    id: fileId,
    tenant_id: tenantId,
    filename,
    original_name: file.name,
    mime_type: file.type,
    size: file.size,
    category,
    url,
    entity_type: entityType,
    entity_id: entityId,
    created_at: now,
  });

  return c.json({ success: true, data: { id: fileId, url, filename: file.name } }, 201);
});

// GET /:id — Serve file from R2
media.get("/:id", async (c) => {
  const db = getDb(c);
  const id = c.req.param("id");

  const fileRecord = await db
    .select()
    .from(schema.mediaFiles)
    .where(eq(schema.mediaFiles.id, id))
    .limit(1);

  if (fileRecord.length === 0) {
    return c.json({ success: false, error: "File tidak ditemukan" }, 404);
  }

  const object = await c.env.MEDIA_BUCKET.get(fileRecord[0].filename);
  if (!object) {
    return c.json({ success: false, error: "File tidak ditemukan di storage" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", fileRecord[0].mime_type);
  headers.set("Cache-Control", "public, max-age=31536000");

  return new Response(object.body, { headers });
});

export { media as mediaRoutes };
