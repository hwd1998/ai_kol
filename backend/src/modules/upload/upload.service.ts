import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';

export interface InitUploadResult {
  uploadId: string;
  chunkSize: number;
  uploadedChunks: number[];
}

export interface MergeResult {
  filePath: string; // 相对路径，用于存入数据库
}

@Injectable()
export class UploadService {
  private readonly baseDir = join(process.cwd(), 'uploads');

  // 简体中文注释：为 Demo 固定一个默认 chunkSize（前端也可通过 init 接口拿到）
  private readonly defaultChunkSize = 5 * 1024 * 1024;

  initUpload(userId: number, chunkSize?: number): InitUploadResult {
    if (!userId) {
      throw new UnauthorizedException('未登录');
    }
    const uploadId = randomBytes(8).toString('hex');
    const safeChunkSize = chunkSize ?? this.defaultChunkSize;

    const chunksDir = this.getChunksDir(userId, uploadId);
    mkdirSync(chunksDir, { recursive: true });

    return { uploadId, chunkSize: safeChunkSize, uploadedChunks: [] };
  }

  listUploadedChunks(userId: number, uploadId: string): number[] {
    const chunksDir = this.getChunksDir(userId, uploadId);
    if (!existsSync(chunksDir)) {
      return [];
    }
    const files = readdirSync(chunksDir);
    return files
      .filter((f) => f.endsWith('.part'))
      .map((f) => Number(f.replace('.part', '')))
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b);
  }

  saveChunk(userId: number, uploadId: string, index: number, buffer: Buffer): void {
    if (!Number.isInteger(index) || index < 0) {
      throw new BadRequestException('index 参数不合法');
    }
    const chunksDir = this.getChunksDir(userId, uploadId);
    mkdirSync(chunksDir, { recursive: true });
    const chunkPath = join(chunksDir, `${index}.part`);
    writeFileSync(chunkPath, buffer);
  }

  async mergeChunks(userId: number, uploadId: string, totalChunks: number, originalName: string): Promise<MergeResult> {
    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      throw new BadRequestException('totalChunks 参数不合法');
    }

    const chunksDir = this.getChunksDir(userId, uploadId);
    if (!existsSync(chunksDir)) {
      throw new BadRequestException('uploadId 不存在或未初始化');
    }

    // 简体中文注释：仅允许 mp4/mov，防止上传任意可执行文件
    const ext = extname(originalName).toLowerCase().replace('.', '');
    if (ext !== 'mp4' && ext !== 'mov') {
      throw new BadRequestException('仅支持 mp4/mov 格式');
    }

    const mergedDir = this.getMergedDir(userId, uploadId);
    mkdirSync(mergedDir, { recursive: true });

    const finalName = `video.${ext}`;
    const finalPathAbs = join(mergedDir, finalName);
    const finalStream = createWriteStream(finalPathAbs);

    // 简体中文注释：顺序拼接分片，避免乱序导致视频损坏
    for (let i = 0; i < totalChunks; i += 1) {
      const partPath = join(chunksDir, `${i}.part`);
      if (!existsSync(partPath) || !statSync(partPath).isFile()) {
        finalStream.close();
        throw new BadRequestException(`缺少分片：${i}`);
      }
      await new Promise<void>((resolve, reject) => {
        const rs = createReadStream(partPath);
        rs.on('error', reject);
        rs.on('end', resolve);
        rs.pipe(finalStream, { end: false });
      });
    }

    await new Promise<void>((resolve) => finalStream.end(resolve));

    // 简体中文注释：合并后保留 chunks 便于排查；若需要可改为合并后清理
    const rel = this.toRelativePath(finalPathAbs);
    return { filePath: rel };
  }

  private getUserDir(userId: number): string {
    return join(this.baseDir, String(userId));
  }

  private getUploadDir(userId: number, uploadId: string): string {
    return join(this.getUserDir(userId), uploadId);
  }

  private getChunksDir(userId: number, uploadId: string): string {
    return join(this.getUploadDir(userId, uploadId), 'chunks');
  }

  private getMergedDir(userId: number, uploadId: string): string {
    return join(this.getUploadDir(userId, uploadId), 'merged');
  }

  private toRelativePath(absPath: string): string {
    const base = this.baseDir;
    const normalized = absPath.replaceAll('\\', '/');
    const normalizedBase = base.replaceAll('\\', '/');
    if (!normalized.startsWith(normalizedBase)) {
      throw new BadRequestException('文件路径不在 uploads 目录下');
    }
    return normalized.slice(normalizedBase.length).replace(/^\/+/, '');
  }
}

