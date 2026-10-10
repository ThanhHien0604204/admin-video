// assets/js/services/categoryService.js — Thao tác với bảng video_categories
import { supabase } from '../supabaseClient.js';

/**
 * Lấy danh sách toàn bộ danh mục video
 * @returns {Promise<Array<{id: number, name: string, slug: string}>>}
 */
export async function listCategories() {
  const { data, error } = await supabase
    .from('video_categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}
