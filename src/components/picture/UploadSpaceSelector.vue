<template>
  <div class="upload-space-selector">
    <div class="selector-label">
      <FolderOpenOutlined class="label-icon" />
      <span>上传至：</span>
    </div>

    <!-- 空间大类选择 -->
    <a-radio-group
      v-model:value="activeType"
      button-style="solid"
      class="custom-radio-group"
      @change="handleTypeChange"
    >
      <!-- 1. 公共图库：所有人可见 -->
      <a-radio-button value="public">
        <GlobalOutlined /> 公共图库
      </a-radio-button>

      <!-- 2. 私人图库：仅登录用户且已拥有私人空间可见 -->
      <a-radio-button v-if="isLogin && hasPrivateSpace" value="private">
        <LockOutlined /> 私人图库
      </a-radio-button>

      <!-- 3. 团队空间：仅登录且拥有团队的用户可见 -->
      <a-radio-button v-if="isLogin && hasTeamSpace" value="team">
        <TeamOutlined /> 团队空间
      </a-radio-button>
    </a-radio-group>

    <!-- 团队选择下拉框 (只有选中团队空间时出现) -->
    <transition name="slide-fade">
      <div v-if="activeType === 'team'" class="team-select-wrapper">
        <a-select
          v-model:value="selectedTeamId"
          placeholder="请选择具体的团队空间"
          class="team-select"
          :options="teamOptions"
          @change="handleTeamChange"
          allow-clear
        >
        </a-select>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  FolderOpenOutlined
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore' // 引入你的登录状态仓库
const spaceVoStore = useSpaceVoStore()
// --- 定义向外暴露的事件与双向绑定 ---
const props = defineProps<{
  // 接收从父组件传来的团队列表
  teamList?: Array<{ id: number; name?: string; spaceName?: string }>
  // ✨新增：接收父组件通知当前用户是否拥有私人图库 (默认为 false，防止未传值时异常)
}>()
const hasPrivateSpace = computed(async () => {
  return !!spaceVoStore.spaceVo.id;
})
onMounted(async () => {
  if (!spaceVoStore.spaceVo.id) {
    await spaceVoStore.fetchSpaceVo()
  }
})

const emit = defineEmits<{
  (e: 'change', payload: { type: string; teamId?: number | null }): void
}>()


// --- 状态获取 ---
const loginUserStore = useLoginUserStore()
const isLogin = computed(() => !!loginUserStore.loginUser?.id) // 判断是否登录
const hasTeamSpace = computed(() => props.teamList && props.teamList.length > 0) // 判断是否有团队空间

// --- 内部状态 ---
const activeType = ref<string>('public') // 默认选中公共图库
const selectedTeamId = ref<number | null>(null) // 选中的团队ID

// 计算属性：将父组件传来的团队列表转换为 a-select 需要的格式
const teamOptions = computed(() => {
  return (props.teamList || []).map(team => ({
    value: team.id,
    label: team.spaceName || team.name || '未命名团队'
  }))
})

// --- 监听状态变化，防止出现非法选中 ---
watch(
  [isLogin, hasTeamSpace, hasPrivateSpace],
  async ([newIsLogin, newHasTeam, newHasPrivate]) => {
    // 1. 如果用户退出登录，强制重置为公共图库
    if (!newIsLogin && activeType.value !== 'public') {
      activeType.value = 'public'
      handleTypeChange()
    }
    // 2. 如果当前处于私人图库，但因为某种原因(如账号被重置)失去了私人图库，退回公共
    else if (activeType.value === 'private' && !newHasPrivate) {
      activeType.value = 'public'
      handleTypeChange()
    }
    // 3. 如果当前处于团队空间，但失去了所有团队，根据情况退回
    else if (activeType.value === 'team' && !newHasTeam) {
      // 优先退回到私人图库，如果没有私人图库则退回公共
      activeType.value = newHasPrivate ? 'private' : 'public'
      handleTypeChange()
    }
  }
)

// --- 方法 ---
// 切换大类
const handleTypeChange = () => {
  // 如果切回了非团队空间，清空选中的团队ID
  if (activeType.value !== 'team') {
    selectedTeamId.value = null
  } else {
    // 如果切到团队空间，且列表有值，默认选中第一个团队
    if (teamOptions.value.length > 0 && !selectedTeamId.value) {
      selectedTeamId.value = teamOptions.value[0].value
    }
  }
  emitChange()
}

// 切换具体团队
const handleTeamChange = () => {
  emitChange()
}

// 统一向外派发事件
const emitChange = () => {
  emit('change', {
    type: activeType.value,
    teamId: activeType.value === 'team' ? selectedTeamId.value : null
  })
}
</script>

<style scoped lang="scss">
.upload-space-selector {
  display: flex;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 16px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-right: 16px;

  .label-icon {
    font-size: 16px;
    color: #1890ff;
  }
}

.custom-radio-group {
  :deep(.ant-radio-button-wrapper) {
    border-radius: 6px;
    margin-right: 8px;
    border: 1px solid #d9d9d9;

    // 隐藏默认的相邻边框重叠样式，让按钮看起来是独立的
    &::before {
      display: none !important;
    }

    &:last-child {
      margin-right: 0;
    }

    &.ant-radio-button-wrapper-checked {
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }
  }
}

.team-select-wrapper {
  margin-left: 12px;
}

.team-select {
  width: 220px;

  :deep(.ant-select-selector) {
    border-radius: 6px;
  }
}

/* 团队下拉框出现的丝滑过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>
