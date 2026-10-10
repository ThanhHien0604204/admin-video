// assets/js/ui.js — Các thành phần UI dùng chung: Toast, Modal xác nhận, Layout Admin
import { signOut } from './auth.js';
import { escapeHtml } from './utils.js';

/**
 * Hiển thị thông báo Toast ở góc trên phải
 * @param {string} message - Nội dung thông báo
 * @param {'success'|'error'} [type='success'] - Loại thông báo
 */
export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-message">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 250);
  }, 4000);
}

/**
 * Hiển thị hộp thoại xác nhận (Modal)
 * @param {Object} options
 * @param {string} options.title - Tiêu đề modal
 * @param {string} options.message - Nội dung xác nhận
 * @param {string} [options.confirmText='Xác nhận']
 * @param {string} [options.cancelText='Hủy']
 * @param {boolean} [options.danger=false]
 * @returns {Promise<boolean>}
 */
export function showConfirmModal({
  title = 'Xác nhận thao tác',
  message = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const confirmBtnClass = danger ? 'btn btn-danger-solid' : 'btn btn-primary';

    backdrop.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <div class="modal-body">${escapeHtml(message)}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary cancel-btn">${escapeHtml(cancelText)}</button>
          <button type="button" class="${confirmBtnClass} confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    // Kích hoạt animation
    requestAnimationFrame(() => backdrop.classList.add('open'));

    const cleanup = (result) => {
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
        document.removeEventListener('keydown', handleKeydown);
      }, 200);
      resolve(result);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') cleanup(false);
    };
    document.addEventListener('keydown', handleKeydown);

    backdrop.querySelector('.cancel-btn').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('.confirm-btn').addEventListener('click', () => cleanup(true));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
  });
}

/**
 * Khởi tạo khung giao diện Admin (Sidebar, Topbar, Tên admin, Logout)
 * @param {'dashboard'|'videos'} activeKey
 * @param {Object} userProfile
 */
export function initAdminLayout(activeKey = 'dashboard', userProfile = null) {
  const username = userProfile?.username || 'Admin';
  const initial = username.charAt(0).toUpperCase();

  const sidebarEl = document.querySelector('.sidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="sidebar-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        <span>Video Admin</span>
      </div>
      <nav class="sidebar-nav">
        <a href="dashboard.html" class="nav-item ${activeKey === 'dashboard' ? 'active' : ''}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </a>
        <a href="videos.html" class="nav-item ${activeKey === 'videos' ? 'active' : ''}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Videos</span>
        </a>
      </nav>
    `;
  }

  const topbarEl = document.querySelector('.topbar');
  if (topbarEl) {
    topbarEl.innerHTML = `
      <div class="topbar-left">
        <button class="menu-toggle" id="menuToggle" aria-label="Mở menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      <div class="topbar-right">
        <div class="user-badge">
          <div class="user-avatar">${escapeHtml(initial)}</div>
          <span>${escapeHtml(username)}</span>
        </div>
        <button class="btn btn-secondary btn-sm" id="logoutBtn">Đăng xuất</button>
      </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await signOut();
    });

    // Mobile menu toggle
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    const menuToggle = document.getElementById('menuToggle');
    menuToggle?.addEventListener('click', () => {
      sidebarEl?.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebarEl?.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}
