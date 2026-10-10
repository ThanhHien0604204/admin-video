// assets/js/services/dashboardService.js — Thao tác với các RPC thống kê Dashboard
import { supabase } from '../supabaseClient.js';

/**
 * Lấy 3 chỉ số tổng quan: tổng video, tổng lượt xem, dung lượng storage
 * @returns {Promise<{total_videos: number, total_views: number, storage_bytes: number}>}
 */
export async function getStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw error;
  return data;
}

/**
 * Lấy top video có nhiều lượt xem nhất
 * @param {number} [limit=10]
 * @returns {Promise<Array<{id: number, title: string, views_count: number}>>}
 */
export async function getTopVideos(limit = 10) {
  const { data, error } = await supabase.rpc('get_top_videos', { p_limit: limit });
  if (error) throw error;
  return data || [];
}

/**
 * Lấy chuỗi dữ liệu lượt xem theo thời gian (ngày hoặc tháng)
 * @param {'day'|'month'} granularity
 * @param {string} from - Định dạng 'YYYY-MM-DD'
 * @param {string} to - Định dạng 'YYYY-MM-DD'
 * @returns {Promise<Array<{bucket_date: string, view_count: number}>>}
 */
export async function getViewsSeries(granularity, from, to) {
  const { data, error } = await supabase.rpc('get_views_timeseries', {
    p_granularity: granularity,
    p_from: from,
    p_to: to
  });
  if (error) throw error;
  return data || [];
}
