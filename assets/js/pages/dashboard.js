// assets/js/pages/dashboard.js — Logic trang Dashboard
import { requireAdmin } from '../auth.js';
import { initAdminLayout, showToast } from '../ui.js';
import { formatNumber, formatBytes, escapeHtml } from '../utils.js';
import { getStats, getTopVideos, getViewsSeries } from '../services/dashboardService.js';

let topVideosChartInstance = null;
let viewsSeriesChartInstance = null;
let currentGranularity = 'day';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Kiểm tra quyền Admin
  const profile = await requireAdmin();
  if (!profile) return;

  // 2. Render layout sidebar/topbar
  initAdminLayout('dashboard', profile);

  // 3. Nạp dữ liệu
  loadAllDashboardData();

  // 4. Gắn sự kiện chuyển đổi Ngày / Tháng
  const btnDay = document.getElementById('btnGranularityDay');
  const btnMonth = document.getElementById('btnGranularityMonth');

  btnDay?.addEventListener('click', () => {
    if (currentGranularity === 'day') return;
    currentGranularity = 'day';
    btnDay.classList.add('active');
    btnMonth?.classList.remove('active');
    loadViewsTimeseries();
  });

  btnMonth?.addEventListener('click', () => {
    if (currentGranularity === 'month') return;
    currentGranularity = 'month';
    btnMonth.classList.add('active');
    btnDay?.classList.remove('active');
    loadViewsTimeseries();
  });
});

async function loadAllDashboardData() {
  await Promise.allSettled([
    loadStatsCards(),
    loadTopVideos(),
    loadViewsTimeseries()
  ]);
}

/**
 * Nạp 3 thẻ số liệu tổng quan
 */
async function loadStatsCards() {
  const cardVideos = document.getElementById('cardTotalVideos');
  const cardViews = document.getElementById('cardTotalViews');
  const cardStorage = document.getElementById('cardStorageBytes');

  try {
    const stats = await getStats();
    if (cardVideos) cardVideos.querySelector('.stat-value').outerHTML = `<span class="stat-value">${formatNumber(stats.total_videos)}</span>`;
    if (cardViews) cardViews.querySelector('.stat-value').outerHTML = `<span class="stat-value">${formatNumber(stats.total_views)}</span>`;
    if (cardStorage) cardStorage.querySelector('.stat-value').outerHTML = `<span class="stat-value">${formatBytes(stats.storage_bytes)}</span>`;
  } catch (err) {
    console.error('Lỗi nạp thống kê cards:', err);
    showToast('Không tải được số liệu tổng quan', 'error');
    if (cardVideos) cardVideos.querySelector('.stat-value').outerHTML = `<span class="stat-value text-muted">—</span>`;
    if (cardViews) cardViews.querySelector('.stat-value').outerHTML = `<span class="stat-value text-muted">—</span>`;
    if (cardStorage) cardStorage.querySelector('.stat-value').outerHTML = `<span class="stat-value text-muted">—</span>`;
  }
}

/**
 * Nạp biểu đồ Top 10 Video
 */
async function loadTopVideos() {
  const container = document.getElementById('topVideosContainer');
  const canvas = document.getElementById('topVideosChart');
  if (!canvas) return;

  try {
    const topVideos = await getTopVideos(10);

    if (!topVideos || topVideos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">Chưa có dữ liệu video</p>
          <p class="empty-desc">Hãy thêm video mới để bắt đầu theo dõi thống kê lượt xem.</p>
        </div>
      `;
      return;
    }

    const labels = topVideos.map(v => v.title);
    const shortLabels = labels.map(t => (t.length > 14 ? t.slice(0, 14) + '…' : t));
    const views = topVideos.map(v => v.views_count);

    if (topVideosChartInstance) {
      topVideosChartInstance.destroy();
    }

    topVideosChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: shortLabels,
        datasets: [{
          data: views,
          backgroundColor: '#2563eb',
          borderRadius: 4,
          maxBarThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => labels[items[0].dataIndex],
              label: (item) => `Lượt xem: ${formatNumber(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 12 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 12 },
              callback: (val) => formatNumber(val)
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Lỗi nạp top video:', err);
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-danger" style="margin-bottom: 8px;">Không thể tải dữ liệu Top video</p>
        <button type="button" class="btn btn-secondary btn-sm" id="retryTopVideosBtn">Thử lại</button>
      </div>
    `;
    document.getElementById('retryTopVideosBtn')?.addEventListener('click', () => {
      container.innerHTML = `<div class="chart-wrapper"><canvas id="topVideosChart"></canvas></div>`;
      loadTopVideos();
    });
  }
}

/**
 * Nạp biểu đồ Lượt xem theo thời gian (Ngày hoặc Tháng)
 */
async function loadViewsTimeseries() {
  const container = document.getElementById('viewsSeriesContainer');
  let canvas = document.getElementById('viewsSeriesChart');

  // Đảm bảo canvas tồn tại
  if (!canvas) {
    container.innerHTML = `<div class="chart-wrapper"><canvas id="viewsSeriesChart"></canvas></div>`;
    canvas = document.getElementById('viewsSeriesChart');
  }

  const now = new Date();
  let fromDate = new Date();

  if (currentGranularity === 'day') {
    // 30 ngày gần nhất
    fromDate.setDate(now.getDate() - 30);
  } else {
    // 12 tháng gần nhất
    fromDate.setMonth(now.getMonth() - 11);
    fromDate.setDate(1);
  }

  const formatDateStr = (d) => d.toISOString().split('T')[0];
  const fromStr = formatDateStr(fromDate);
  const toStr = formatDateStr(now);

  try {
    const series = await getViewsSeries(currentGranularity, fromStr, toStr);

    if (!series || series.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">Chưa có dữ liệu lượt xem</p>
          <p class="empty-desc">Chưa có lượt xem nào được ghi nhận trong khoảng thời gian này.</p>
        </div>
      `;
      return;
    }

    const labels = series.map(item => {
      const parts = item.bucket_date.split('-');
      if (currentGranularity === 'day') {
        return `${parts[2]}/${parts[1]}`; // DD/MM
      } else {
        return `${parts[1]}/${parts[0]}`; // MM/YYYY
      }
    });

    const values = series.map(item => Number(item.view_count));

    if (viewsSeriesChartInstance) {
      viewsSeriesChartInstance.destroy();
    }

    viewsSeriesChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `Lượt xem: ${formatNumber(item.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 12 },
              maxTicksLimit: 15
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter', size: 12 },
              callback: (val) => formatNumber(val)
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Lỗi nạp timeseries:', err);
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-danger" style="margin-bottom: 8px;">Không thể tải dữ liệu lượt xem</p>
        <button type="button" class="btn btn-secondary btn-sm" id="retrySeriesBtn">Thử lại</button>
      </div>
    `;
    document.getElementById('retrySeriesBtn')?.addEventListener('click', () => {
      loadViewsTimeseries();
    });
  }
}
