// assets/js/auth.js — Quản lý phiên đăng nhập và bảo vệ trang (Guard)
import { supabase } from './supabaseClient.js';

/**
 * Guard bảo vệ các trang Admin: Chỉ cho phép người dùng có role ADMIN và is_active = true
 * Nếu chưa đăng nhập -> chuyển hướng login.html
 * Nếu là role USER hoặc bị khóa -> đăng xuất và chuyển hướng login.html?error=forbidden
 * @returns {Promise<Object|null>} Trả về thông tin profile của Admin nếu hợp lệ
 */
export async function requireAdmin() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      location.replace('login.html');
      return null;
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_active')
      .eq('id', session.user.id)
      .single();

    if (error || !profile || profile.role !== 'ADMIN' || !profile.is_active) {
      await supabase.auth.signOut();
      location.replace('login.html?error=forbidden');
      return null;
    }

    return profile;
  } catch (err) {
    console.error('Lỗi kiểm tra quyền admin:', err);
    location.replace('login.html');
    return null;
  }
}

/**
 * Dùng ở trang login/register: Nếu đã đăng nhập với role ADMIN thì tự chuyển tới Dashboard
 */
export async function redirectIfLoggedIn() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', session.user.id)
      .single();

    if (profile && profile.role === 'ADMIN' && profile.is_active) {
      location.replace('dashboard.html');
    }
  } catch (err) {
    console.error('Lỗi kiểm tra phiên đăng nhập:', err);
  }
}

/**
 * Đăng xuất và đưa về trang login
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Lỗi khi đăng xuất:', err);
  } finally {
    location.replace('login.html');
  }
}
