<template>
  <div id="mySpacePage">
    <!-- 1. 顶部仪表盘区域 -->
    <div v-if="space.id" class="scope-view private-view">
      <div class="dashboard-header">
        <a-row :gutter="24">
          <!-- 左侧:欢迎面板 -->
          <a-col :span="24" :md="16">
            <div class="welcome-panel glass-panel">
              <div class="welcome-text">
                <div class="greeting-badge">
                  <span class="badge-emoji">👋</span>
                  <span>欢迎回来</span>
                </div>
                <h2 class="welcome-title">创作者工作台</h2>
                <p class="welcome-desc">
                  您已累计发布了
                  <!-- 保留 span 包裹数字,用于 GSAP 做数字滚动动画 -->
                  <span class="highlight-number" ref="countRef">0</span>
                  张作品
                </p>
                <div class="action-buttons">
                  <a-button
                    type="primary"
                    size="large"
                    class="gradient-btn"
                    @click="toCreationPage"
                  >
                    <CloudUploadOutlined />
                    <span>上传新作品</span>
                  </a-button>
                </div>
              </div>
              <div class="welcome-illustration">
                <div class="illustration-circle">
                  <RocketTwoTone two-tone-color="#eb2f96" class="rocket-icon" />
                </div>
              </div>
            </div>
          </a-col>

          <!-- 右侧:统计面板 -->
          <a-col :span="24" :md="8">
            <div class="stats-panel glass-panel">
              <div class="stats-header">
                <CloudServerOutlined class="stats-icon" />
                <h4>云端存储概览</h4>
              </div>
              <div class="storage-circle">
                <a-progress
                  type="dashboard"
                  :percent="storagePercent"
                  :width="120"
                  :strokeColor="{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }"
                />
                <div class="storage-info">
                  <div class="stat-row">
                    <span class="stat-label">已用</span>
                    <b class="stat-value">{{ displayTotalSize }}</b>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">总量</span>
                    <b class="stat-value">{{ displayMaxSize }}</b>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- 2. 搜索筛选区域 -->
    <div v-if="space.id" class="search-section">
      <!-- 主搜索栏 -->
      <div class="main-search-bar glass-panel">
        <div class="search-input-wrapper">
          <SearchOutlined class="search-icon" />
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="搜索作品名称、标签或描述..."
            size="large"
            class="main-search-input"
            @pressEnter="handleSearch"
            allow-clear
          >
            <template #suffix>
              <a-button type="text" class="filter-toggle-btn" @click="toggleAdvancedFilter">
                <FilterOutlined :class="{ 'filter-active': isFilterActive }" />
                <span class="filter-text">筛选</span>
                <span v-if="activeFilterCount > 0" class="filter-count">{{
                    activeFilterCount
                  }}</span>
              </a-button>
            </template>
          </a-input>
          <a-button type="primary" size="large" class="search-btn" @click="handleSearch">
            搜索
          </a-button>
        </div>
      </div>

      <!-- 高级筛选面板 -->
      <div v-show="showAdvancedFilter" class="advanced-filter-panel glass-panel">
        <a-row :gutter="[16, 16]">
          <!-- 分类筛选 -->
          <a-col :span="24" :md="12">
            <div class="filter-item">
              <div class="filter-label">
                <AppstoreOutlined class="label-icon" />
                <span>作品分类</span>
              </div>
              <a-select
                v-model:value="searchParams.category"
                placeholder="选择分类"
                size="large"
                style="width: 100%"
                allow-clear
                @change="handleSearch"
              >
                <!-- 动态渲染分类选项 -->
                <a-select-option
                  v-for="opt in categoryOptions"
                  :key="opt.key || opt.value || opt.label"
                  :value="opt.value"
                >
                  <template v-if="opt.icon">
                    <component :is="opt.icon" style="margin-right:6px;" />
                  </template>
                  {{ opt.label }}
                </a-select-option>
              </a-select>
            </div>
          </a-col>

          <!-- 时间范围筛选 -->
          <a-col :span="24" :md="12">
            <div class="filter-item">
              <div class="filter-label">
                <CalendarOutlined class="label-icon" />
                <span>编辑时间</span>
              </div>
              <a-range-picker
                v-model:value="dateRange"
                size="large"
                style="width: 100%"
                :placeholder="['开始时间', '结束时间']"
                format="YYYY-MM-DD"
                @change="handleDateChange"
              />
            </div>
          </a-col>
        </a-row>

        <!-- 快捷时间选择 -->
        <div class="quick-date-filters">
          <span class="quick-label">快捷选择:</span>
          <a-space :size="8">
            <a-tag
              v-for="preset in datePresets"
              :key="preset.key"
              :class="['quick-tag', { active: currentPreset === preset.key }]"
              @click="applyDatePreset(preset)"
            >
              {{ preset.label }}
            </a-tag>
          </a-space>
        </div>

        <!-- 操作按钮 -->
        <div class="filter-actions">
          <a-button @click="handleReset" class="reset-btn">
            <ReloadOutlined />
            重置筛选
          </a-button>
          <div class="filter-summary">
            <span v-if="activeFilterCount > 0">
              已选择 <b class="count-highlight">{{ activeFilterCount }}</b> 个筛选条件
            </span>
            <span v-else class="no-filter">未选择筛选条件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 图片列表区域 -->
    <div v-if="space.id" class="gallery-grid private-grid">
      <a-list
        :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
        :data-source="images"
        :pagination="paginationConfig"
        :loading="loading"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="art-card private-card">
              <div class="card-image-box">
                <img @click="toPictureDetail(item.id)" :src="item.thumbnailUrl" :alt="item.name" />
                <div class="private-actions">
                  <a-tooltip title="编辑">
                    <a-button @click="handleEdit(item)" shape="circle" class="icon-btn">
                      <EditOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="下载">
                    <a-button @click="handleDownload(item)" shape="circle" class="icon-btn">
                      <DownloadOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="以图识图">
                    <a-button @click="handleImageSearch(item)" shape="circle" class="icon-btn">
                      <SearchOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="以图扩图">
                    <a-button @click="handleImageExpand(item)" shape="circle" class="icon-btn">
                      <ExpandOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button @click="handleDelete(item)" shape="circle" danger class="icon-btn">
                      <DeleteOutlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
              <div class="card-info minimal-info">
                <div class="card-title">{{ item.name }}</div>
                <div class="file-meta">
                  <FileImageOutlined />
                  <span
                  >{{ item.picFormat }} · {{ showPictureSize(item.picSize) }} ·
                    {{ dayjs(item.createTime).format('YYYY-MM-DD') }}</span
                  >
                </div>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 4. 无空间提醒页面 -->
    <RemindNoSpaceComponent v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { showPictureSize } from '@/utils'
import dayjs, { Dayjs } from 'dayjs'
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileImageOutlined,
  RocketTwoTone,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ReloadOutlined,
  LayoutOutlined,
  ShoppingOutlined,
  SmileOutlined,
  PictureOutlined,
  ExpandOutlined,
} from '@ant-design/icons-vue'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import RemindNoSpaceComponent from '@/components/space/RemindNoSpaceComponent.vue'
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController'
import router from '@/router'
import gsap from 'gsap'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { saveAs } from 'file-saver'
import { message } from 'ant-design-vue'

// --- 状态定义 ---
const loading = ref(true)
const spaceVoStore = useSpaceVoStore()
const space = computed<API.SpaceVO>(() => spaceVoStore.spaceVo)
const images = ref<API.PictureVO[]>([])
const loginUserStore = useLoginUserStore()

// 数字动画 Ref
const countRef = ref(null)

// 搜索相关状态
const showAdvancedFilter = ref(false) // 是否显示高级筛选面板
const searchParams = reactive({
  searchText: '', // 关键词
  category: '', // 分类
  startEditTime: '', // 开始编辑时间
  endEditTime: '', // 结束编辑时间
})

// 日期范围选择
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const currentPreset = ref('') // 当前选中的快捷时间

// 日期快捷选择预设
const datePresets = [
  { key: 'today', label: '今天', days: 0 },
  { key: 'week', label: '近7天', days: 7 },
  { key: 'month', label: '近30天', days: 30 },
  { key: 'quarter', label: '近3个月', days: 90 },
]

// 分类选项（与团队空间保持一致）
const categoryOptions: Array<{ key?: string; value: string; label: string; icon?: any }> = [
  { key: 'all', value: '', label: '全部分类' },
  { key: 'template', value: '模板', label: '模板', icon: LayoutOutlined },
  { key: 'ecommerce', value: '电商', label: '电商', icon: ShoppingOutlined },
  { key: 'sticker', value: '表情包', label: '表情包', icon: SmileOutlined },
  { key: 'poster', value: '海报', label: '海报', icon: PictureOutlined },
]

// 跳转图片详情页
const toPictureDetail = (id: number) => {
  router.push(`/picture/${id}`)
}

// 以图扩图
const handleImageExpand = (item: API.PictureVO) => {
  router.push(`/expansion/picture/${item.id}`)
}

// 编辑图片
const handleEdit = (item: API.PictureVO) => {
  router.push(`/creation/picture?id=${item.id}`)
}

// 下载图片
const handleDownload = (item: API.PictureVO) => {
  if (!item || !item.url) {
    message.warn('下载地址不可用')
    return
  }
  const filename = item.name ? `${item.name}` : 'picture'
  try {
    saveAs(item.url as any, filename)
  } catch (e) {
    message.error('下载失败，请检查图片地址或稍后重试')
  }
}

// 以图识图
const handleImageSearch = (item: API.PictureVO) => {
  router.push(`/picture/search/${item.id}`)
}

// 删除图片
const handleDelete = async (item: API.PictureVO) => {
  const res = await deletePictureUsingPost({
    id: item.id,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('删除成功')
    fetchPictures()
    spaceVoStore.fetchSpaceVo()
  } else {
    message.error(res.data.message)
  }
}

// --- 分页配置 ---
const paginationConfig = reactive({
  onChange: (page: number) => {
    paginationConfig.current = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchPictures()
  },
  total: 0,
  current: 1,
  pageSize: 12,
  showQuickJumper: true,
})

// 计算当前激活的筛选条件数量
const activeFilterCount = computed(() => {
  let count = 0
  if (searchParams.category) count++
  if (searchParams.startEditTime || searchParams.endEditTime) count++
  return count
})

// 判断筛选是否激活
const isFilterActive = computed(() => {
  return activeFilterCount.value > 0 || showAdvancedFilter.value
})

// 构建搜索条件
const searchCondition = computed((): API.PictureQueryRequest => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: searchParams.searchText,
  tags: [],
  category: searchParams.category,
  spaceId: space.value?.id ?? undefined,
  nullSpaceId: true,
  startEditTime: searchParams.startEditTime,
  endEditTime: searchParams.endEditTime,
}))

// --- 核心逻辑 ---

/**
 * 唯一保留的 GSAP 动画：数字滚动动画
 */
const animateNumber = (targetValue: number) => {
  if (!countRef.value) return
  gsap.to(countRef.value, {
    innerHTML: targetValue,
    duration: 1.5,
    snap: { innerHTML: 1 }, // 保证是整数
    ease: 'power1.out',
  })
}

/**
 * 切换高级筛选面板（剔除复杂动画）
 */
const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

/**
 * 处理日期范围变化
 */
const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates && dates.length === 2) {
    searchParams.startEditTime = dates[0].format('YYYY-MM-DD')
    searchParams.endEditTime = dates[1].format('YYYY-MM-DD')
    currentPreset.value = ''
  } else {
    searchParams.startEditTime = ''
    searchParams.endEditTime = ''
  }
  handleSearch()
}

/**
 * 应用日期快捷预设
 */
const applyDatePreset = (preset: any) => {
  if (currentPreset.value === preset.key) return

  currentPreset.value = preset.key
  const endDate = dayjs()
  const startDate =
    preset.days === 0 ? endDate.startOf('day') : endDate.subtract(preset.days, 'day')

  dateRange.value = [startDate, endDate]
  searchParams.startEditTime = startDate.format('YYYY-MM-DD')
  searchParams.endEditTime = endDate.format('YYYY-MM-DD')
  handleSearch()
}

/**
 * 执行搜索
 */
const handleSearch = () => {
  paginationConfig.current = 1
  fetchPictures()
}

/**
 * 重置所有筛选条件（剔除晃动动画）
 */
const handleReset = () => {
  searchParams.searchText = ''
  searchParams.category = ''
  searchParams.startEditTime = ''
  searchParams.endEditTime = ''
  dateRange.value = null
  currentPreset.value = ''

  handleSearch()
}

/**
 * 获取数据
 */
const fetchPictures = async () => {
  loading.value = true
  searchCondition.value.spaceId = space.value.id
  searchCondition.value.nullSpaceId = false

  const res = await listPictureVoByPageUsingPost(searchCondition.value)

  if (res.data.code === 0 && res.data.data) {
    images.value = res.data.data.records ?? []
    paginationConfig.total = res.data.data.total ?? 0

    // 触发数字滚动动画
    animateNumber(paginationConfig.total)
  }
  loading.value = false
}

/**
 * 跳转到创作页面
 */
const toCreationPage = async () => {
  router.push(`/creation/picture`)
}

// --- 生命周期 ---
onMounted(async () => {
  if (loginUserStore.loginUser?.id && !spaceVoStore.spaceVo?.id) {
    await spaceVoStore.fetchSpaceVo()
  }
  fetchPictures()
})

// 计算显示与防御性类型转换
const storagePercent = computed<number>(() => {
  const used = space.value?.totalSize ?? 0
  const max = space.value?.maxSize ?? 1
  const percent = (used / max) * 100
  return parseFloat(percent.toFixed(2))
})

const displayTotalSize = computed<string>(() => showPictureSize(space.value?.totalSize ?? 0))
const displayMaxSize = computed<string>(() => showPictureSize(space.value?.maxSize ?? 0))
</script>

<style scoped lang="scss">
// --- 变量定义 ---
$primary-color: #1890ff;
$secondary-color: #36cfc9;
$accent-color: #faad14;
$glass-bg: rgba(255, 255, 255, 0.85);
$glass-border: 1px solid rgba(255, 255, 255, 0.6);
$shadow-sm: 0 4px 20px rgba(0, 0, 0, 0.06);
$shadow-md: 0 8px 30px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.15);
$transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

#mySpacePage {
  min-height: 100vh;
  padding-bottom: 40px;
}

// --- 通用玻璃拟态面板 ---
.glass-panel {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: $glass-border;
  border-radius: 20px;
  box-shadow: $shadow-sm;
  padding: 24px;
  margin-bottom: 30px;
  transition: $transition-smooth;

  &:hover {
    box-shadow: $shadow-md;
  }
}

// --- 仪表盘头部 ---
.dashboard-header {
  margin-bottom: 20px;
}

/* 统一的仪表盘面板基类，确保顶部展示组件高度一致（与团队空间统一） */
.dashboard-panel {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 240px;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 50%, #e6f7ff 100%);
  position: relative;
  overflow: hidden;

  // 装饰性背景圆
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(24, 144, 255, 0.1), transparent);
    border-radius: 50%;
  }
}

.welcome-text {
  flex: 1;
  z-index: 1;
  padding-right: 20px;
}

.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: $primary-color;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.welcome-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #1a1a1a;
  background: linear-gradient(135deg, #1a1a1a, $primary-color);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-desc {
  color: #666;
  margin-bottom: 24px;
  font-size: 15px;
  line-height: 1.6;
}

.highlight-number {
  color: $primary-color;
  font-weight: 700;
  font-size: 20px;
  margin: 0 4px;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.gradient-btn {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 25px;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  height: 44px;
  padding: 0 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: $transition-smooth;

  &:hover {
    background: linear-gradient(135deg, #096dd9, #13c2c2);
    box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4);
    transform: translateY(-2px);
  }
}

.welcome-illustration {
  flex-shrink: 0;
  z-index: 1;
}

.illustration-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05), rgba(235, 47, 150, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}

.rocket-icon {
  font-size: 80px;
}

// --- 统计面板 ---
.stats-panel {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  background: linear-gradient(135deg, #fff, #f8fafc);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .stats-icon {
    font-size: 24px;
    color: $primary-color;
  }

  h4 {
    margin: 0;
    color: #1a1a1a;
    font-size: 16px;
    font-weight: 700;
  }
}

.storage-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex: 1;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
}

.stat-label {
  color: #999;
  font-weight: 500;
}

.stat-value {
  color: #1a1a1a;
  font-weight: 700;
  font-size: 16px;
}

// --- 搜索区域样式 (使用团队空间风格) ---
.search-section {
  margin-bottom: 24px;
}

.main-search-bar {
  padding: 16px 24px;
  margin-bottom: 0; // 由于后续可能接高级筛选，取消固定底部外边距

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-icon {
    font-size: 20px;
    color: $primary-color;
    margin-right: 4px;
  }

  .main-search-input {
    flex: 1;
    border-radius: 8px;
    border: 1px solid #e8e8e8;

    &:hover,
    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .search-btn {
    border-radius: 8px;
    background: $primary-color;
    border: none;
    font-weight: 500;

    &:hover {
      background: #096dd9;
    }
  }
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;

  &:hover, .filter-active {
    color: $primary-color;
  }
}

.filter-count {
  background: #ff4d4f;
  color: #fff;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
}

// 高级筛选面板
.advanced-filter-panel {
  margin-top: 16px;
  background: #fff;
  border-top: 3px solid $primary-color;
}

.filter-item {
  .filter-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333;
    font-weight: 500;

    .label-icon {
      color: $primary-color;
    }
  }

  :deep(.ant-select-selector),
  :deep(.ant-picker) {
    border-radius: 8px;
  }
}

// 快捷时间
.quick-date-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;

  .quick-label { font-size: 13px; color: #999; }

  .quick-tag {
    cursor: pointer;
    border-radius: 6px;
    padding: 4px 12px;
    border: 1px solid #e8e8e8;
    background: #fafafa;
    color: #666;
    transition: all 0.2s;

    &:hover { color: $primary-color; border-color: $primary-color; }
    &.active {
      background: $primary-color;
      border-color: $primary-color;
      color: #fff;
    }
  }
}

.filter-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .reset-btn { border-radius: 6px; }
  .filter-summary .count-highlight { color: $primary-color; margin: 0 4px; }
}

// --- 列表与卡片 ---
.gallery-grid {
  margin-top: 10px;
}

.art-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-hover;
    border-color: rgba(24, 144, 255, 0.3);

    .card-image-box img {
      transform: scale(1.08);
    }
  }
}

.card-image-box {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.private-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: $transition-smooth;
}

.art-card:hover .private-actions {
  opacity: 1;
  transform: translateY(0);
}

.icon-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: $primary-color;
    background: #fff;
    transform: scale(1.1);
  }
}

.card-info {
  padding: 14px 16px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

// --- 响应式 ---
@media (max-width: 768px) {
  .welcome-panel {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    min-height: auto;
  }

  .welcome-text {
    padding-right: 0;
    margin-bottom: 24px;
  }

  .action-buttons {
    justify-content: center;
  }

  .storage-circle {
    gap: 16px;
  }

  .search-input-wrapper {
    flex-wrap: wrap;
  }

  .main-search-input {
    min-width: 100%;
    margin-bottom: 8px;
  }

  .search-btn {
    width: 100%;
  }

  .filter-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .reset-btn {
      width: 100%;
    }
  }
}
</style>


