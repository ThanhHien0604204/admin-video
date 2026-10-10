// assets/js/pages/videoForm.js — Logic trang Thêm / Sửa video
import { requireAdmin } from '../auth.js';
import { initAdminLayout, showToast } from '../ui.js';
import { listCategories } from '../services/categoryService.js';
import { getVideoById, createVideo, updateVideo } from '../services/videoService.js';
import { uploadFile, removeFiles } from '../services/storageService.js';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_THUMB_SIZE = 5 * 1024 * 1024;  // 5 MB

let currentProfile = null;
let editVideoId = null;
let originalVideo = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Kiểm tra Admin
  currentProfile = await requireAdmin();
  if (!currentProfile) return;

  initAdminLayout('videos', currentProfile);

  // 2. Nạp danh mục
  await loadCategoriesDropdown();

  // 3. Kiểm tra query param ?id=
  const urlParams = new URLSearchParams(window.location.search);
  editVideoId = urlParams.get('id');

  initFormInteractions();

  if (editVideoId) {
    await loadVideoForEdit(editVideoId);
  }
});

/**
 * Nạp danh mục vào select
 */
async function loadCategoriesDropdown() {
  const select = document.getElementById('categoryId');
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
    console.error('Lỗi nạp categories dropdown:', err);
  }
}

/**
 * Gắn các sự kiện tương tác trên form (toggle radio, preview ảnh)
 */
function initFormInteractions() {
  const form = document.getElementById('videoForm');
  const sourceTypeRadios = document.querySelectorAll('input[name="sourceType"]');
  const thumbSourceRadios = document.querySelectorAll('input[name="thumbSource"]');
  const urlSourcePanel = document.getElementById('urlSourcePanel');
  const uploadSourcePanel = document.getElementById('uploadSourcePanel');
  const thumbUrlPanel = document.getElementById('thumbUrlPanel');
  const thumbUploadPanel = document.getElementById('thumbUploadPanel');

  const thumbUrlInput = document.getElementById('thumbUrlInput');
  const thumbFileInput = document.getElementById('thumbFileInput');
  const thumbPreviewImg = document.getElementById('thumbPreviewImg');
  const thumbPreviewPlaceholder = document.getElementById('thumbPreviewPlaceholder');

  // Toggle Video Source (URL vs Upload)
  sourceTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'URL') {
        urlSourcePanel.classList.remove('hidden');
        uploadSourcePanel.classList.add('hidden');
      } else {
        urlSourcePanel.classList.add('hidden');
        uploadSourcePanel.classList.remove('hidden');
      }
    });
  });

  // Toggle Thumbnail Source (URL vs Upload)
  thumbSourceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'URL') {
        thumbUrlPanel.classList.remove('hidden');
        thumbUploadPanel.classList.add('hidden');
        updateThumbPreview(thumbUrlInput.value);
      } else {
        thumbUrlPanel.classList.add('hidden');
        thumbUploadPanel.classList.remove('hidden');
        if (thumbFileInput.files && thumbFileInput.files[0]) {
          const objectUrl = URL.createObjectURL(thumbFileInput.files[0]);
          updateThumbPreview(objectUrl);
        } else {
          updateThumbPreview('');
        }
      }
    });
  });

  // Preview khi dán URL ảnh
  thumbUrlInput?.addEventListener('input', (e) => {
    updateThumbPreview(e.target.value.trim());
  });

  // Preview khi chọn file ảnh
  thumbFileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_THUMB_SIZE) {
        showToast('Ảnh thumbnail không được vượt quá 5 MB', 'error');
        thumbFileInput.value = '';
        updateThumbPreview('');
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      updateThumbPreview(objectUrl);
    } else {
      updateThumbPreview('');
    }
  });

  function updateThumbPreview(src) {
    if (src) {
      thumbPreviewImg.src = src;
      thumbPreviewImg.classList.remove('hidden');
      thumbPreviewPlaceholder.classList.add('hidden');
    } else {
      thumbPreviewImg.src = '';
      thumbPreviewImg.classList.add('hidden');
      thumbPreviewPlaceholder.classList.remove('hidden');
    }
  }

  // Submit form
  form?.addEventListener('submit', handleFormSubmit);
}

/**
 * Nạp thông tin video khi ở chế độ chỉnh sửa
 */
async function loadVideoForEdit(id) {
  const pageTitle = document.getElementById('formPageTitle');
  const saveBtn = document.getElementById('saveBtn');

  pageTitle.textContent = 'Chỉnh sửa video';
  saveBtn.textContent = 'Cập nhật video';

  try {
    originalVideo = await getVideoById(id);
    if (!originalVideo) {
      showToast('Không tìm thấy video cần sửa', 'error');
      setTimeout(() => location.replace('videos.html'), 1500);
      return;
    }

    // Điền dữ liệu vào form
    document.getElementById('title').value = originalVideo.title || '';
    document.getElementById('description').value = originalVideo.description || '';
    if (originalVideo.category_id) {
      document.getElementById('categoryId').value = originalVideo.category_id;
    }
    document.getElementById('status').value = originalVideo.status || 'PUBLISHED';

    // Nguồn video
    if (originalVideo.source_type === 'UPLOAD') {
      const uploadRadio = document.querySelector('input[name="sourceType"][value="UPLOAD"]');
      if (uploadRadio) uploadRadio.checked = true;
      document.getElementById('urlSourcePanel').classList.add('hidden');
      document.getElementById('uploadSourcePanel').classList.remove('hidden');

      const notice = document.getElementById('currentVideoFileNotice');
      if (notice && originalVideo.video_path) {
        notice.textContent = `Tệp hiện tại: ${originalVideo.video_path.split('/').pop()} (Chọn tệp mới nếu muốn thay thế)`;
        notice.classList.remove('hidden');
      }
    } else {
      document.getElementById('videoUrlInput').value = originalVideo.video_url || '';
    }

    // Thumbnail
    if (originalVideo.thumbnail_url) {
      document.getElementById('thumbUrlInput').value = originalVideo.thumbnail_url;
      const previewImg = document.getElementById('thumbPreviewImg');
      previewImg.src = originalVideo.thumbnail_url;
      previewImg.classList.remove('hidden');
      document.getElementById('thumbPreviewPlaceholder').classList.add('hidden');
    }
  } catch (err) {
    console.error('Lỗi nạp video edit:', err);
    showToast('Lỗi nạp thông tin video', 'error');
  }
}

/**
 * Xử lý submit form thêm/sửa
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const titleInput = document.getElementById('title');
  const titleError = document.getElementById('titleError');
  const videoUrlInput = document.getElementById('videoUrlInput');
  const videoUrlError = document.getElementById('videoUrlError');
  const videoFileInput = document.getElementById('videoFileInput');
  const videoFileError = document.getElementById('videoFileError');
  const saveBtn = document.getElementById('saveBtn');

  // Reset errors
  titleError.textContent = '';
  videoUrlError.textContent = '';
  videoFileError.textContent = '';
  titleInput.classList.remove('error');
  videoUrlInput.classList.remove('error');

  const title = titleInput.value.trim();
  const description = document.getElementById('description').value.trim();
  const categoryIdVal = document.getElementById('categoryId').value;
  const categoryId = categoryIdVal ? Number(categoryIdVal) : null;
  const status = document.getElementById('status').value;
  const sourceType = document.querySelector('input[name="sourceType"]:checked').value;
  const thumbSourceType = document.querySelector('input[name="thumbSource"]:checked').value;

  let hasError = false;

  if (!title) {
    titleError.textContent = 'Vui lòng nhập tiêu đề video';
    titleInput.classList.add('error');
    hasError = true;
  } else if (title.length > 150) {
    titleError.textContent = 'Tiêu đề không được vượt quá 150 ký tự';
    titleInput.classList.add('error');
    hasError = true;
  }

  // Validate video source
  const videoFile = videoFileInput.files ? videoFileInput.files[0] : null;
  let videoUrl = videoUrlInput.value.trim();

  if (sourceType === 'URL') {
    if (!videoUrl) {
      videoUrlError.textContent = 'Vui lòng nhập đường dẫn URL của video';
      videoUrlInput.classList.add('error');
      hasError = true;
    } else if (!/^https?:\/\//i.test(videoUrl)) {
      videoUrlError.textContent = 'Đường dẫn phải bắt đầu bằng http:// hoặc https://';
      videoUrlInput.classList.add('error');
      hasError = true;
    }
  } else {
    // Chế độ UPLOAD
    if (!editVideoId && !videoFile) {
      videoFileError.textContent = 'Vui lòng chọn tệp video để tải lên';
      hasError = true;
    } else if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
      videoFileError.textContent = 'Kích thước tệp video không được vượt quá 50 MB';
      hasError = true;
    }
  }

  if (hasError) return;

  // Bắt đầu quá trình lưu
  saveBtn.disabled = true;
  saveBtn.textContent = 'Đang xử lý...';

  try {
    let videoPath = originalVideo?.video_path || null;
    let videoSize = originalVideo?.file_size_bytes || 0;

    let thumbUrl = originalVideo?.thumbnail_url || null;
    let thumbPath = originalVideo?.thumbnail_path || null;
    let thumbSize = originalVideo?.thumbnail_size_bytes || 0;

    // 1. Upload video nếu có file mới
    if (sourceType === 'UPLOAD' && videoFile) {
      saveBtn.textContent = 'Đang tải lên video...';
      const uploadedVideo = await uploadFile('videos', videoFile, currentProfile.id);

      // Nếu là edit và đã có video_path cũ -> xóa file cũ
      if (editVideoId && originalVideo?.video_path) {
        await removeFiles('videos', [originalVideo.video_path]).catch(err => console.warn('Lỗi dọn file video cũ:', err));
      }

      videoPath = uploadedVideo.path;
      videoUrl = uploadedVideo.publicUrl;
      videoSize = uploadedVideo.size;
    } else if (sourceType === 'URL') {
      // Nếu đổi từ UPLOAD sang URL -> dọn file video cũ trong storage
      if (editVideoId && originalVideo?.video_path) {
        await removeFiles('videos', [originalVideo.video_path]).catch(err => console.warn('Lỗi dọn file video cũ:', err));
      }
      videoPath = null;
      videoSize = 0;
    }

    // 2. Upload thumbnail nếu có chọn file
    const thumbFileInput = document.getElementById('thumbFileInput');
    const thumbFile = thumbFileInput.files ? thumbFileInput.files[0] : null;

    if (thumbSourceType === 'UPLOAD' && thumbFile) {
      saveBtn.textContent = 'Đang tải lên thumbnail...';
      const uploadedThumb = await uploadFile('thumbnails', thumbFile, currentProfile.id);

      // Nếu có thumbnail_path cũ -> dọn file cũ
      if (editVideoId && originalVideo?.thumbnail_path) {
        await removeFiles('thumbnails', [originalVideo.thumbnail_path]).catch(err => console.warn('Lỗi dọn thumbnail cũ:', err));
      }

      thumbPath = uploadedThumb.path;
      thumbUrl = uploadedThumb.publicUrl;
      thumbSize = uploadedThumb.size;
    } else if (thumbSourceType === 'URL') {
      const manualThumbUrl = document.getElementById('thumbUrlInput').value.trim();
      if (editVideoId && originalVideo?.thumbnail_path && manualThumbUrl !== originalVideo.thumbnail_url) {
        await removeFiles('thumbnails', [originalVideo.thumbnail_path]).catch(err => console.warn('Lỗi dọn thumbnail cũ:', err));
        thumbPath = null;
        thumbSize = 0;
      }
      thumbUrl = manualThumbUrl || null;
    }

    // 3. Chuẩn bị payload
    const payload = {
      title,
      description: description || null,
      category_id: categoryId,
      status,
      source_type: sourceType,
      video_url: videoUrl || null,
      video_path: videoPath,
      file_size_bytes: videoSize,
      thumbnail_url: thumbUrl,
      thumbnail_path: thumbPath,
      thumbnail_size_bytes: thumbSize
    };

    saveBtn.textContent = 'Đang lưu dữ liệu...';

    if (editVideoId) {
      await updateVideo(editVideoId, payload);
      showToast('Đã lưu video thành công', 'success');
    } else {
      payload.created_by = currentProfile.id;
      await createVideo(payload);
      showToast('Đã tạo video thành công', 'success');
    }

    setTimeout(() => {
      location.replace('videos.html');
    }, 600);

  } catch (err) {
    console.error('Lỗi khi lưu video:', err);
    showToast('Lỗi lưu video: ' + (err.message || 'Thao tác thất bại'), 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = editVideoId ? 'Cập nhật video' : 'Lưu video';
  }
}
