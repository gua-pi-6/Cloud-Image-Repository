<template>
  <div id="teamSpacePage">
    <!-- 1. 顶部仪表盘区域 (团队版简洁设计) -->
    <div class="scope-view team-view">
      <div class="dashboard-header">
        <a-row :gutter="24">
          <!-- 面板1: 团队欢迎与快捷操作 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="team-panel glass-panel">
              <div class="panel-content">
                <div class="team-badge">
                  <TeamOutlined /> 团队协作空间
                </div>
                <h2 class="team-title">共享云图库</h2>
                <p class="team-desc">在这里与团队成员共享、管理高质量资产</p>
              </div>
              <div class="panel-footer">
                <a-button
                  type="primary"
                  size="large"
                  class="action-btn"
                  @click="toCreationPage"
                >
                  <CloudUploadOutlined />
                  <span>上传新作品</span>
                </a-button>
              </div>
            </div>
          </a-col>

          <!-- 面板2: 团队作品总数统计 (融合数字滚动) -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="stats-panel glass-panel">
              <div class="stats-header">
                <PictureOutlined class="stats-icon text-blue" />
                <h4>团队总作品数</h4>
              </div>
              <div class="stats-body count-body">
                <div class="count-wrapper">
                  <!-- GSAP 数字滚动目标 -->
                  <span class="highlight-number" ref="countRef">0</span>
                  <span class="count-unit">张</span>
                </div>
                <p class="stats-subtext">团队累计创造的价值资产</p>
              </div>
            </div>
          </a-col>

          <!-- 面板3: 团队存储概览 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="stats-panel glass-panel">
              <div class="stats-header">
                <CloudServerOutlined class="stats-icon text-green" />
                <h4>团队存储概览</h4>
              </div>
              <div class="stats-body storage-body">
                <a-progress
                  type="dashboard"
                  :percent="storagePercent"
                  :width="90"
                  :strokeColor="{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }"
                />
                <div class="storage-info">
                  <div class="stat-row">
                    <span class="stat-label">已用容量</span>
                      <b class="stat-value">{{ displayTotalSize }}</b>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">团队总量</span>
                      <b class="stat-value">{{ displayMaxSize }}</b>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- 2. 搜索筛选区域 (保留原有逻辑，样式微调适配团队版) -->
    <div class="search-section">
      <!-- 主搜索栏 -->
      <div class="main-search-bar glass-panel">
        <div class="search-input-wrapper">
          <SearchOutlined class="search-icon" />
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="搜索团队作品名称、标签或描述..."
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
                <!-- 动态渲染分类列表 -->
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
    <div class="gallery-grid team-grid">
      <a-list
        :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
        :data-source="images"
        :pagination="paginationConfig"
        :loading="loading"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="art-card team-card">
              <div class="card-image-box">
                <img @click="toPictureDetail(item.id)" :src="item.thumbnailUrl" :alt="item.name" />
                <div class="team-actions">
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
                      <search-outlined />
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
                  <span>
                    {{ item.picFormat }} · {{ showPictureSize(item.picSize) }} ·
                    {{ dayjs(item.createTime).format('YYYY-MM-DD') }}
                  </span>
                </div>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
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
  TeamOutlined,
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
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController'
import router from '@/router'
import gsap from 'gsap'
import { saveAs } from 'file-saver'
import { message } from 'ant-design-vue'
import { getSpaceVoUsingPost } from '@/api/spaceController'

// --- 状态定义 ---
const loading = ref(true)

// 团队空间详情
const space = ref<API.SpaceVO>({
  id: 0,
  spaceName: '',
  spaceLevel: 0,
  maxSize: 1, // 关键：给 1 防止除以 0
  maxCount: 0,
  totalSize: 0,
  totalCount: 0,
})
const images = ref<API.PictureVO[]>([])

interface spaceId {
  id: number,
}
const props = defineProps<spaceId>()

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

// 分类选项（用于动态渲染，下方可按需扩展）
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

// 下载图片（带空值校验与默认文件名）
const handleDownload = (item: API.PictureVO) => {
  if (!item || !item.url) {
    message.warn('下载地址不可用')
    return
  }
  const filename = item.name ? `${item.name}` : 'picture'
  try {
    saveAs(item.url, filename)
  } catch (e) {
    // 当 url 直接为链接时部分环境下 saveAs 可能报错，提醒用户
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
const searchCondition = computed<API.PictureQueryRequest>(() => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: searchParams.searchText,
  tags: [],
  category: searchParams.category,
  spaceId: props.id,
  nullSpaceId: true, // 同样用于规避部分后端的默认查公海逻辑，依赖接口具体实现
  startEditTime: searchParams.startEditTime,
  endEditTime: searchParams.endEditTime,
}))

// --- 核心逻辑 ---

/**
 * 数字滚动动画 (用于团队作品总数)
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
 * 切换高级筛选面板
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
 * 重置所有筛选条件
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

  const res = await listPictureVoByPageUsingPost(searchCondition.value)

  if (res.data.code === 0 && res.data.data) {
    images.value = res.data.data.records ?? []
    paginationConfig.total = res.data.data.total ?? 0

    // 触发仪表盘的总数动画
    animateNumber(paginationConfig.total)
  }
  loading.value = false
}

/**
 * 获取团队空间详情
 * @returns 团队空间详情
 */
const fetchSpaceVo = async () => {
  const res = await getSpaceVoUsingPost({id: props.id})
  if (res.data.code === 0 && res.data.data) {
    space.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}
/**
 * 跳转到创作页面 (上传)
 */
const toCreationPage = async () => {
  router.push(`/creation/picture`)
}

// --- 生命周期 ---
onMounted(async () => {
  await fetchSpaceVo()
  fetchPictures()
})

// 计算显示与防御性类型转换
const storagePercent = computed(() => {
  const used = space.value?.totalSize ?? 0
  const max = space.value?.maxSize ?? 1
  const percent = (used / max) * 100
  return parseFloat(percent.toFixed(2))
})

const displayTotalSize = computed(() => showPictureSize(space.value?.totalSize ?? 0))
const displayMaxSize = computed(() => showPictureSize(space.value?.maxSize ?? 0))
</script>

<style scoped lang="scss">
// --- 变量定义 ---
$primary-color: #1890ff;
$team-primary: #2f54eb; // 区别于个人空间的偏深蓝，符合团队严谨感
$secondary-color: #597ef7;
$accent-color: #faad14;
$glass-bg: rgba(255, 255, 255, 0.9);
$glass-border: 1px solid rgba(0, 0, 0, 0.04);
$shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.04);
$shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
$shadow-hover: 0 12px 32px rgba(47, 84, 235, 0.12);
$transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

#teamSpacePage {
  min-height: 100vh;
  padding-bottom: 40px;
}

// 辅助布局类
.flex-col {
  display: flex;
}

// --- 通用玻璃拟态面板 ---
.glass-panel {
  background: $glass-bg;
  border: $glass-border;
  border-radius: 16px;
  box-shadow: $shadow-sm;
  padding: 24px;
  margin-bottom: 24px;
  width: 100%;
  transition: $transition-smooth;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: $shadow-md;
  }
}

// --- 仪表盘头部结构 ---
.dashboard-header {
  margin-bottom: 8px;
}

/* 统一的仪表盘面板基类，确保顶部展示组件高度一致 */
.dashboard-panel {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 面板1: 团队欢迎区 */
.team-panel {
  justify-content: space-between;
  background: linear-gradient(145deg, #ffffff, #f0f5ff);
  position: relative;
  overflow: hidden;

  // 右下角装饰图案
  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(47, 84, 235, 0.05) 0%, transparent 70%);
    border-radius: 50%;
  }

  .team-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: $team-primary;
    background: rgba(47, 84, 235, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .team-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  .team-desc {
    color: #666;
    font-size: 14px;
    margin-bottom: 0;
  }

  .panel-footer {
    margin-top: 24px;
    z-index: 1;
  }

  .action-btn {
    background: $team-primary;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: $transition-smooth;

    &:hover {
      background: #1d39c4;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(47, 84, 235, 0.3);
    }
  }
}

/* 面板2 & 面板3: 统计面板通用样式 */
.stats-panel {
  justify-content: flex-start;

  .stats-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;

    .stats-icon {
      font-size: 18px;
      &.text-blue { color: $team-primary; }
      &.text-green { color: #52c41a; }
    }

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .stats-body {
    flex: 1;
    display: flex;
  }
}

/* 数量统计专项样式 */
.count-body {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;

  .count-wrapper {
    margin-bottom: 8px;
  }

  .highlight-number {
    font-size: 36px;
    font-weight: 800;
    color: $team-primary;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .count-unit {
    font-size: 14px;
    color: #666;
    margin-left: 4px;
    font-weight: 500;
  }

  .stats-subtext {
    font-size: 13px;
    color: #999;
    margin: 0;
  }
}

/* 存储统计专项样式 */
.storage-body {
  align-items: center;
  gap: 20px;

  .storage-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #f0f0f0;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .stat-label {
    color: #666;
  }

  .stat-value {
    color: #333;
    font-weight: 600;
  }
}


// --- 搜索区域样式 (针对团队版进行色调微调) ---
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
    color: $team-primary;
    margin-right: 4px;
  }

  .main-search-input {
    flex: 1;
    border-radius: 8px;
    border: 1px solid #e8e8e8;

    &:hover,
    &:focus {
      border-color: $team-primary;
      box-shadow: 0 0 0 2px rgba(47, 84, 235, 0.1);
    }
  }

  .search-btn {
    border-radius: 8px;
    background: $team-primary;
    border: none;
    font-weight: 500;

    &:hover {
      background: #1d39c4;
    }
  }
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;

  &:hover, .filter-active {
    color: $team-primary;
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
  border-top: 3px solid $team-primary;
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
      color: $team-primary;
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

    &:hover { color: $team-primary; border-color: $team-primary; }
    &.active {
      background: $team-primary;
      border-color: $team-primary;
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
  .filter-summary .count-highlight { color: $team-primary; margin: 0 4px; }
}


// --- 列表与卡片 ---
.team-grid {
  margin-top: 10px;
}

.team-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-6px);
    box-shadow: $shadow-hover;
    border-color: rgba(47, 84, 235, 0.2);

    .card-image-box img { transform: scale(1.05); }
    .team-actions { opacity: 1; transform: translateY(0); }
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
    transition: transform 0.5s ease;
  }
}

.team-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(10px);
  transition: $transition-smooth;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #666;
  width: 32px;
  height: 32px;

  &:hover {
    color: $team-primary;
    background: #fff;
    transform: scale(1.05);
  }
}

.card-info {
  padding: 12px 16px;
}

.card-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
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
  .dashboard-header .ant-col {
    margin-bottom: 16px;
  }

  .glass-panel {
    margin-bottom: 0;
  }

  .storage-body {
    flex-direction: column;
    text-align: center;

    .storage-info { width: 100%; }
  }

  .search-input-wrapper {
    flex-wrap: wrap;
    .main-search-input { min-width: 100%; margin-bottom: 8px; }
    .search-btn { width: 100%; }
  }
}
</style>
