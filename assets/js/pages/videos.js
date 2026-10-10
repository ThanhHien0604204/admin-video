// assets/js/pages/videos.js — Logic trang danh sách video
import { requireAdmin } from '../auth.js';
import { initAdminLayout, showToast, showConfirmModal } from '../ui.js';
import { formatNumber, escapeHtml, debounce } from '../utils.js';
import { listVideos, deleteVideo } from '../services/videoService.js';
import { listCategories } from '../services/categoryService.js';
import { removeFiles } from '../services/storageService.js';

let currentPage = 1;
const pageSize = 10;
let currentSearch = '';
let currentCategory = '';
let currentSortBy = 'created_at';
let currentAscending = false;

document.addEventListener('DOMContentLoaded', async () => {
  const profile = await requireAdmin();
  if (!profile) return;

  initAdminLayout('videos', profile);

  await loadCategoriesFilter();
  bindFilterEvents();
  loadVideoList();
});

/**
 * Nạp danh mục vào dropdown lọc
 */
async function loadCategoriesFilter() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  try {
    const categories = await listCategories();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Lỗi nạp categories:', err);
  }
}

/**
 * Gắn sự kiện cho tìm kiếm và bộ lọc
 */
function bindFilterEvents() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');

  const onSearchChange = debounce((val) => {
    currentSearch = val;
    currentPage = 1;
    loadVideoList();
  }, 300);

  searchInput?.addEventListener('input', (e) => {
    onSearchChange(e.target.value);
  });

  categoryFilter?.addEventListener('change', (e) => {
    currentCategory = e.target.value ? Number(e.target.value) : null;
    currentPage = 1;
    loadVideoList();
  });

  sortFilter?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'created_at_desc') {
      currentSortBy = 'created_at';
      currentAscending = false;
    } else if (val === 'created_at_asc') {
      currentSortBy = 'created_at';
      currentAscending = true;
    } else if (val === 'views_count_desc') {
      currentSortBy = 'views_count';
      currentAscending = false;
    } else if (val === 'views_count_asc') {
      currentSortBy = 'views_count';
      currentAscending = true;
    } else if (val === 'title_asc') {
      currentSortBy = 'title';
      currentAscending = true;
    }
    currentPage = 1;
    loadVideoList();
  });
}

/**
 * Nạp dữ liệu danh sách video từ server
 */
async function loadVideoList() {
  const tbody = document.getElementById('videoTableBody');
  const paginationWrapper = document.getElementById('paginationWrapper');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
        <p class="text-muted" style="margin-top: 12px;">Đang tải danh sách video...</p>
      </td>
    </tr>
  `;

  try {
    const { rows, total } = await listVideos({
      page: currentPage,
      pageSize,
      search: currentSearch,
      categoryId: currentCategory,
      sortBy: currentSortBy,
      ascending: currentAscending
    });

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              <p class="empty-title">Chưa có video nào</p>
              <p class="empty-desc">${currentSearch || currentCategory ? 'Không tìm thấy video nào phù hợp với bộ lọc.' : 'Hãy thêm video đầu tiên vào hệ thống.'}</p>
              ${!currentSearch && !currentCategory ? '<a href="video-form.html" class="btn btn-primary btn-sm">+ Thêm video đầu tiên</a>' : ''}
            </div>
          </td>
        </tr>
      `;
      paginationWrapper.style.display = 'none';
      return;
    }

    paginationWrapper.style.display = 'flex';

    // Placeholder SVG dạng data URI
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="54" viewBox="0 0 96 54" fill="%23f1f5f9"><rect width="96" height="54" fill="%23f1f5f9"/><polygon points="40,20 40,34 56,27" fill="%23cbd5e1"/></svg>`;

    tbody.innerHTML = rows.map(video => {
      const thumb = video.thumbnail_url || placeholderSvg;
      const categoryName = video.category?.name || 'Chưa phân loại';

      let statusBadge = '';
      if (video.status === 'PUBLISHED') {
        statusBadge = '<span class="badge badge-published">Published</span>';
      } else if (video.status === 'DRAFT') {
        statusBadge = '<span class="badge badge-draft">Draft</span>';
      } else {
        statusBadge = '<span class="badge badge-hidden">Hidden</span>';
      }

      return `
        <tr data-id="${video.id}">
          <td style="font-weight: 500; color: var(--text-muted);">${video.id}</td>
          <td>
            <img src="${escapeHtml(thumb)}"
                 alt="${escapeHtml(video.title)}"
                 class="table-thumbnail"
                 onerror="this.src='${placeholderSvg}'">
          </td>
          <td class="video-title-cell">
            <div class="video-title-text">${escapeHtml(video.title)}</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="text-muted" style="font-size: 12px;">${escapeHtml(categoryName)}</span>
              ${statusBadge}
            </div>
          </td>
          <td style="font-weight: 500;">${formatNumber(video.views_count)}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 8px; justify-content: flex-end;">
              <a href="video-form.html?id=${video.id}" class="btn btn-secondary btn-sm">Sửa</a>
              <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${video.id}" data-title="${escapeHtml(video.title)}" data-thumb-path="${escapeHtml(video.thumbnail_path || '')}" data-video-path="${escapeHtml(video.video_path || '')}">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Gắn sự kiện xóa
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        handleDeleteVideo({
          id: btn.dataset.id,
          title: btn.dataset.title,
          thumbPath: btn.dataset.thumbPath,
          videoPath: btn.dataset.videoPath
        });
      });
    });

    // Render thông tin và nút phân trang
    renderPagination(total);

  } catch (err) {
    console.error('Lỗi nạp video list:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <p class="text-danger" style="margin-bottom: 8px;">Không thể tải danh sách video</p>
            <button type="button" class="btn btn-secondary btn-sm" id="retryVideosBtn">Thử lại</button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('retryVideosBtn')?.addEventListener('click', loadVideoList);
    paginationWrapper.style.display = 'none';
  }
}

/**
 * Xử lý xóa video
 */
async function handleDeleteVideo({ id, title, thumbPath, videoPath }) {
  const confirmed = await showConfirmModal({
    title: 'Xác nhận xóa video',
    message: `Bạn có chắc muốn xóa video "${title}"? Hành động này không thể hoàn tác.`,
    confirmText: 'Xóa vĩnh viễn',
    cancelText: 'Hủy',
    danger: true
  });

  if (!confirmed) return;

  try {
    // 1. Dọn file Storage nếu có
    const pathsToRemoveVideos = videoPath ? [videoPath] : [];
    const pathsToRemoveThumbs = thumbPath ? [thumbPath] : [];

    await Promise.allSettled([
      removeFiles('videos', pathsToRemoveVideos),
      removeFiles('thumbnails', pathsToRemoveThumbs)
    ]);

    // 2. Xóa bản ghi trong Database
    await deleteVideo(id);

    showToast('Đã xóa video thành công', 'success');

    // Nếu trang hiện tại không còn phần tử nào sau khi xóa (trừ trang 1) -> lùi 1 trang
    const rowCount = document.querySelectorAll('#videoTableBody tr').length;
    if (rowCount <= 1 && currentPage > 1) {
      currentPage--;
    }

    loadVideoList();
  } catch (err) {
    console.error('Lỗi khi xóa video:', err);
    showToast('Xóa video thất bại: ' + (err.message || 'Lỗi hệ thống'), 'error');
  }
}

/**
 * Hiển thị các nút phân trang
 */
function renderPagination(total) {
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');

  const totalPages = Math.ceil(total / pageSize) || 1;
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  paginationInfo.textContent = `Hiển thị ${total === 0 ? 0 : from}–${to} trên tổng ${formatNumber(total)}`;

  let buttonsHtml = '';

  // Nút trước
  buttonsHtml += `
    <button type="button" class="page-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Trang trước">
      ‹
    </button>
  `;

  // Các nút số trang
  for (let i = 1; i <= totalPages; i++) {
    // Hiển thị trang đầu, trang cuối, và xung quanh currentPage
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      buttonsHtml += `
        <button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      buttonsHtml += `<span style="padding: 0 4px; color: var(--text-muted);">…</span>`;
    }
  }

  // Nút sau
  buttonsHtml += `
    <button type="button" class="page-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Trang sau">
      ›
    </button>
  `;

  paginationControls.innerHTML = buttonsHtml;

  document.getElementById('prevPageBtn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadVideoList();
    }
  });

  document.getElementById('nextPageBtn')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadVideoList();
    }
  });

  paginationControls.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page);
      if (page !== currentPage) {
        currentPage = page;
        loadVideoList();
      }
    });
  });
}
