import { mkdirSync } from 'fs';
import { rm } from 'fs/promises';
import { diskStorage } from 'multer';
import { customAlphabet } from 'nanoid';
import { basename, extname, join } from 'path';

const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12,
);

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export type UploadSubfolder = 'companies' | 'products';

export interface MulterUploadFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function getUploadDir(subfolder: UploadSubfolder): string {
  return join(UPLOAD_DIR, subfolder);
}

export function getMulterOptions(subfolder: UploadSubfolder) {
  const dest: string = getUploadDir(subfolder);
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (_req, file: MulterUploadFile, cb) => {
        const originalname =
          typeof file.originalname === 'string' ? file.originalname : '';
        const ext = extname(originalname) || '.jpg';
        const name = `${nanoid()}${ext}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (
      _req: unknown,
      file: MulterUploadFile,
      cb: (err: Error | null, accept?: boolean) => void,
    ) => {
      const mimetype = typeof file.mimetype === 'string' ? file.mimetype : '';
      if (ALLOWED_MIME.includes(mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
      }
    },
  };
}

export function toRelativePath(
  subfolder: UploadSubfolder,
  filename: string,
): string {
  return `${subfolder}/${filename}`;
}

export async function removeUploadedFile(
  subfolder: UploadSubfolder,
  relativePath: string | null | undefined,
): Promise<void> {
  if (!relativePath) return;

  const prefix = `${subfolder}/`;
  if (!relativePath.startsWith(prefix)) return;

  const filename = relativePath.slice(prefix.length);
  if (!filename || filename !== basename(filename)) return;

  await rm(join(getUploadDir(subfolder), filename), { force: true });
}
