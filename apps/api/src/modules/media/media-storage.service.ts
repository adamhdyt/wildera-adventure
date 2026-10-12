import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface StoredFileResult {
  objectKey: string;
  url: string;
}

const mimeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/**
 * Stores uploaded photos in Supabase Storage when SUPABASE_URL and
 * SUPABASE_SECRET_KEY are set (required on Vercel, which has no persistent
 * disk) and on the local filesystem otherwise (development and tests).
 */
@Injectable()
export class MediaStorageService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');
  private readonly supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  private readonly supabaseKey = process.env.SUPABASE_SECRET_KEY;
  private readonly bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';

  constructor() {
    if (!this.useSupabase) {
      fs.mkdir(this.uploadDir, { recursive: true }).catch(() => {
        // ignore
      });
    }
  }

  private get useSupabase(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseKey);
  }

  private supabaseHeaders(extra?: Record<string, string>) {
    return {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: this.supabaseKey as string,
      ...extra,
    };
  }

  async storeFile(params: {
    filename: string;
    extension: string;
    buffer: Buffer;
  }): Promise<StoredFileResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomId = crypto.randomUUID();
    const safeExt = params.extension.startsWith('.')
      ? params.extension
      : `.${params.extension}`;
    const objectKey = `uploads/${year}/${month}/${randomId}${safeExt}`;

    if (this.useSupabase) {
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectKey}`,
        {
          method: 'POST',
          headers: this.supabaseHeaders({
            'Content-Type':
              mimeByExtension[safeExt.toLowerCase()] ??
              'application/octet-stream',
            'Cache-Control': 'max-age=31536000',
          }),
          body: new Uint8Array(params.buffer),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Supabase Storage upload failed (${response.status}): ${await response.text()}`,
        );
      }
      return {
        objectKey,
        url: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${objectKey}`,
      };
    }

    const fullPath = path.resolve(process.cwd(), objectKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, params.buffer);

    const url = `/api/v1/media/file/${objectKey}`;
    return { objectKey, url };
  }

  async deleteFile(objectKey: string): Promise<void> {
    if (this.useSupabase) {
      // Photos that predate Supabase live in /images (static) and have no
      // object to remove; Supabase answers 200/404 for those keys.
      await fetch(
        `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectKey}`,
        { method: 'DELETE', headers: this.supabaseHeaders() },
      ).catch(() => undefined);
      return;
    }
    const fullPath = this.resolveFullPath(objectKey);
    await fs.rm(fullPath, { force: true });
  }

  resolveFullPath(objectKey: string): string {
    const fullPath = path.resolve(process.cwd(), objectKey);
    // Serve only files inside the uploads directory (blocks ../ traversal).
    if (!fullPath.startsWith(this.uploadDir + path.sep)) {
      return path.join(this.uploadDir, '.missing');
    }
    return fullPath;
  }
}
