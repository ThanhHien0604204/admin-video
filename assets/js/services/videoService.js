// assets/js/services/videoService.js — Thao tác với bảng videos
import { supabase } from '../supabaseClient.js';

/**
 * Lấy danh sách video kèm phân trang, tìm kiếm và sắp xếp
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=10]
 * @param {string} [options.search='']
 * @param {number|null} [options.categoryId=null]
 * @param {string} [options.sortBy='created_at']
 * @param {boolean} [options.ascending=false]
 * @returns {Promise<{rows: Array, total: number}>}
 */
export async function listVideos({
  page = 1,
  pageSize = 10,
  search = '',
  categoryId = null,
  sortBy = 'created_at',
  ascending = false,
  limit = null
} = {}) {
  const from = (page - 1) * pageSize;
  const to = limit ? from + limit - 1 : from + pageSize - 1;

  let query = supabase
    .from('videos')
    .select('id, title, thumbnail_url, thumbnail_path, video_url, video_path, views_count, status, created_at, category:video_categories(id, name)', { count: 'exact' })
    .order(sortBy, { ascending })
    .range(from, to);

  if (search && search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const actualRows = limit ? (data || []).slice(0, limit) : (data || []);
  const actualTotal = limit ? actualRows.length : (count || 0);

  return { rows: actualRows, total: actualTotal };
}

/**
 * Lấy chi tiết một video theo id
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getVideoById(id) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, category:video_categories(id, name)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Tạo video mới
 * @param {Object} videoData
 * @returns {Promise<Object>}
 */
export async function createVideo(videoData) {
  const { data, error } = await supabase
    .from('videos')
    .insert([videoData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cập nhật video
 * @param {number|string} id
 * @param {Object} videoData
 * @returns {Promise<Object>}
 */
export async function updateVideo(id, videoData) {
  const { data, error } = await supabase
    .from('videos')
    .update(videoData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Xóa một video theo id
 * @param {number|string} id
 */
export async function deleteVideo(id) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
