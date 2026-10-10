// assets/js/pages/login.js — Logic trang đăng nhập
import { supabase } from '../supabaseClient.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';
import { redirectIfLoggedIn } from '../auth.js';
import { showToast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isKeyConfigured = SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('YOUR_');

  // Nếu chưa cấu hình Anon Key, hiển thị banner cảnh báo
  if (!isKeyConfigured) {
    const card = document.querySelector('.auth-card');
    const warningBanner = document.createElement('div');
    warningBanner.id = 'configWarningBanner';
    warningBanner.style.cssText = `
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius);
      padding: 12px 14px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    `;
    const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    warningBanner.innerHTML = `
      <strong>⚠️ Chưa cấu hình Supabase Anon Key</strong><br>
      Vui lòng mở <a href="https://supabase.com/dashboard/project/${projectRef}/settings/api" target="_blank" style="color: #b45309; text-decoration: underline; font-weight: 600;">Supabase API Settings</a>, sao chép khóa <strong>anon / public</strong> và dán vào file <code>assets/js/config.js</code>.
    `;
    card.insertBefore(warningBanner, document.getElementById('loginForm'));
  }

  // Kiểm tra nếu đã đăng nhập admin -> chuyển dashboard
  if (isKeyConfigured) {
    await redirectIfLoggedIn();
  }

  // Kiểm tra param ?error=forbidden từ guard
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'forbidden') {
    showToast('Bạn không có quyền truy cập khu vực quản trị', 'error');
  }

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const submitBtn = document.getElementById('submitBtn');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Toggle ẩn/hiện mật khẩu
  togglePasswordBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    togglePasswordBtn.innerHTML = isPassword
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset lỗi
    emailError.textContent = '';
    passwordError.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!email) {
      emailError.textContent = 'Vui lòng nhập email';
      emailInput.classList.add('error');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Email không đúng định dạng';
      emailInput.classList.add('error');
      hasError = true;
    }

    if (!password) {
      passwordError.textContent = 'Vui lòng nhập mật khẩu';
      passwordInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Kiểm tra cấu hình key
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('YOUR_')) {
      showToast('Chưa cấu hình SUPABASE_ANON_KEY trong assets/js/config.js', 'error');
      return;
    }

    // Trạng thái loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang đăng nhập...';

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Chi tiết lỗi đăng nhập:', authError);
        if (authError.message.toLowerCase().includes('api key') || authError.status === 401 && authError.message.includes('API key')) {
          showToast('Khóa API Anon Key không hợp lệ. Vui lòng kiểm tra lại assets/js/config.js', 'error');
        } else {
          showToast('Email hoặc mật khẩu không đúng', 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đang nhập';
        return;
      }

      // Kiểm tra vai trò trong bảng users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'ADMIN' || !profile.is_active) {
        await supabase.auth.signOut();
        showToast('Bạn không có quyền truy cập khu vực quản trị', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập';
        return;
      }

      // Thành công -> chuyển tới dashboard
      showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        location.replace('dashboard.html');
      }, 500);
    } catch (err) {
      console.error('Lỗi kết nối đăng nhập:', err);
      showToast('Không kết nối được máy chủ, vui lòng thử lại', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng nhập';
    }
  });
});
