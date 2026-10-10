// assets/js/services/storageService.js — Thao tác với Supabase Storage
import { supabase } from '../supabaseClient.js';

/**
 * Upload file lên bucket Supabase Storage
 * Đường dẫn: <userId>/<randomUUID>.<ext>
 * @param {'videos'|'thumbnails'} bucket - Tên bucket
 * @param {File} file - Đối tượng File từ form
 * @param {string} userId - UUID của người dùng
 * @returns {Promise<{path: string, publicUrl: string, size: number}>}
 */
export async function uploadFile(bucket, file, userId) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, size: file.size };
}

/**
 * Xóa danh sách file trong bucket Supabase Storage
 * @param {'videos'|'thumbnails'} bucket - Tên bucket
 * @param {string[]} paths - Danh sách đường dẫn cần xóa
 */
export async function removeFiles(bucket, paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;

  const { error } = await supabase.storage.from(bucket).remove(list);
  if (error) throw error;
}
