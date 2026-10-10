// assets/js/pages/forgotPassword.js — Logic trang quên mật khẩu
import { supabase } from '../supabaseClient.js';
import { redirectIfLoggedIn } from '../auth.js';
import { showToast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  await redirectIfLoggedIn();

  const form = document.getElementById('forgotForm');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    emailError.textContent = '';
    emailInput.classList.remove('error');

    const email = emailInput.value.trim();

    if (!email) {
      emailError.textContent = 'Vui lòng nhập email';
      emailInput.classList.add('error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Email không đúng định dạng';
      emailInput.classList.add('error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      const redirectUrl = `${window.location.origin}/reset-password.html`;
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      // Luôn hiển thị thông báo an toàn bất kể email có tồn tại hay không
      showToast('Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu', 'success');

      // Khóa nút 60s đếm ngược chống spam
      let countdown = 60;
      submitBtn.textContent = `Gửi lại sau (${countdown}s)`;

      const timer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(timer);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Gửi yêu cầu';
        } else {
          submitBtn.textContent = `Gửi lại sau (${countdown}s)`;
        }
      }, 1000);
    } catch (err) {
      console.error('Lỗi quên mật khẩu:', err);
      showToast('Không kết nối được máy chủ, vui lòng thử lại', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi yêu cầu';
    }
  });
});
