// assets/js/pages/resetPassword.js — Logic trang đặt lại mật khẩu
import { supabase } from '../supabaseClient.js';
import { showToast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('resetForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const submitBtn = document.getElementById('submitBtn');
  const invalidLinkNotice = document.getElementById('invalidLinkNotice');

  let hasValidSession = false;

  // Lắng nghe sự kiện auth PASSWORD_RECOVERY
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
      hasValidSession = true;
    }
  });

  // Kiểm tra session hiện tại
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    hasValidSession = true;
  }

  // Chờ ngắn để Supabase xử lý hash URL nếu có
  setTimeout(() => {
    // Nếu trong URL không có hash hoặc access_token và không có session
    const hash = window.location.hash;
    const hasToken = hash.includes('access_token') || hash.includes('type=recovery');
    if (!hasValidSession && !hasToken) {
      form.classList.add('hidden');
      invalidLinkNotice.classList.remove('hidden');
    }
  }, 1000);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    passwordInput.classList.remove('error');
    confirmPasswordInput.classList.remove('error');

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let hasError = false;

    if (!password) {
      passwordError.textContent = 'Vui lòng nhập mật khẩu mới';
      passwordInput.classList.add('error');
      hasError = true;
    } else if (password.length < 6) {
      passwordError.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự';
      passwordInput.classList.add('error');
      hasError = true;
    }

    if (!confirmPassword) {
      confirmPasswordError.textContent = 'Vui lòng xác nhận mật khẩu mới';
      confirmPasswordInput.classList.add('error');
      hasError = true;
    } else if (password !== confirmPassword) {
      confirmPasswordError.textContent = 'Mật khẩu xác nhận không khớp';
      confirmPasswordInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang cập nhật...';

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Cập nhật mật khẩu';
        return;
      }

      await supabase.auth.signOut();
      showToast('Đặt lại mật khẩu thành công! Đang chuyển về đăng nhập...', 'success');
      setTimeout(() => {
        location.replace('login.html');
      }, 1500);
    } catch (err) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      showToast('Không kết nối được máy chủ, vui lòng thử lại', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cập nhật mật khẩu';
    }
  });
});
