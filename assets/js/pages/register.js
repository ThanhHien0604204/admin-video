// assets/js/pages/register.js — Logic trang đăng ký
import { supabase } from '../supabaseClient.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config.js';
import { redirectIfLoggedIn } from '../auth.js';
import { showToast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isKeyConfigured = SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith('YOUR_');

  // Hiển thị banner nếu chưa cấu hình key
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
    card.insertBefore(warningBanner, document.getElementById('registerForm'));
  }

  if (isKeyConfigured) {
    await redirectIfLoggedIn();
  }

  const form = document.getElementById('registerForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset lỗi
    usernameError.textContent = '';
    emailError.textContent = '';
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    usernameInput.classList.remove('error');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    confirmPasswordInput.classList.remove('error');

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let hasError = false;

    // Validate username
    if (!username) {
      usernameError.textContent = 'Vui lòng nhập tên người dùng';
      usernameInput.classList.add('error');
      hasError = true;
    } else if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
      usernameError.textContent = 'Username phải từ 3–30 ký tự, chỉ gồm chữ, số và gạch dưới';
      usernameInput.classList.add('error');
      hasError = true;
    }

    // Validate email
    if (!email) {
      emailError.textContent = 'Vui lòng nhập email';
      emailInput.classList.add('error');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Email không đúng định dạng';
      emailInput.classList.add('error');
      hasError = true;
    }

    // Validate password
    if (!password) {
      passwordError.textContent = 'Vui lòng nhập mật khẩu';
      passwordInput.classList.add('error');
      hasError = true;
    } else if (password.length < 6) {
      passwordError.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự';
      passwordInput.classList.add('error');
      hasError = true;
    }

    // Validate confirm password
    if (!confirmPassword) {
      confirmPasswordError.textContent = 'Vui lòng xác nhận mật khẩu';
      confirmPasswordInput.classList.add('error');
      hasError = true;
    } else if (password !== confirmPassword) {
      confirmPasswordError.textContent = 'Mật khẩu xác nhận không khớp';
      confirmPasswordInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Kiểm tra key
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('YOUR_')) {
      showToast('Chưa cấu hình SUPABASE_ANON_KEY trong assets/js/config.js', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang kiểm tra...';

    try {
      // 1. Kiểm tra username còn trống qua RPC
      const { data: isAvailable, error: rpcError } = await supabase.rpc('is_username_available', {
        p_username: username
      });

      if (rpcError) {
        console.warn('Lỗi kiểm tra RPC username:', rpcError);
      } else if (isAvailable === false) {
        usernameError.textContent = 'Tên người dùng này đã có người sử dụng';
        usernameInput.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tạo tài khoản';
        return;
      }

      submitBtn.textContent = 'Đang tạo tài khoản...';

      // 2. Thực hiện đăng ký
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          emailError.textContent = 'Email này đã được sử dụng';
          emailInput.classList.add('error');
        } else if (signUpError.message.toLowerCase().includes('api key')) {
          showToast('Khóa API Anon Key không hợp lệ. Vui lòng kiểm tra lại assets/js/config.js', 'error');
        } else {
          showToast(signUpError.message, 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tạo tài khoản';
        return;
      }

      showToast('Đăng ký tài khoản thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        location.replace('login.html');
      }, 1200);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      showToast('Không kết nối được máy chủ, vui lòng thử lại', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Tạo tài khoản';
    }
  });
});
