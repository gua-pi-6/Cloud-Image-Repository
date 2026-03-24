<template>
  <div id="uploadFileElement">
    <!-- 上传相关 UI 只有在没有 id 的时候显示 -->
    <div v-if="!hasId">
      <UploadSpaceSelector :teamList="teamList"
                           :hasPrivateSpace="hasPrivateSpace"
                           @change="onSpaceChange"
      />
      <a-upload-dragger
        class="ant-upload"
        v-model:file="file"
        name="file"
        :multiple="false"
        :show-upload-list="false"
        :custom-request="handleUpload"
        :before-upload="beforeUpload"
      >
        <div>
          <p class="ant-upload-drag-icon">
            <inbox-outlined></inbox-outlined>
          </p>
          <p class="ant-upload-text">点击或拖动文件到此区域上传</p>
        </div>
      </a-upload-dragger>
    </div>

    <!-- 图片预览：无论是否有 id 都显示（只要 props.picture 有 url） -->
    <div style="text-align:center; margin-top:12px;">
      <img v-if="props.picture?.url" :src="props.picture?.url" alt="图片加载失败" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import UploadSpaceSelector from '@/components/picture/UploadSpaceSelector.vue'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { useRoute } from 'vue-router'


interface PictureHandleType {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<PictureHandleType>()
const spaceId = useSpaceVoStore().spaceVo.id
const route = useRoute()
// compute whether an "id" exists in params or query (supports string|number|array)
const hasId = computed(() => {
  const p = route.params.id
  if (p !== undefined && p !== null && String(p) !== '') return true
  const q = route.query.id
  if (q !== undefined && q !== null) {
    if (Array.isArray(q)) return q.length > 0 && q.some(v => String(v) !== '')
    return String(q) !== ''
  }
  return false
})

const file = ref()
const hasPrivateSpace = ref<boolean>(false)

// 处理是否有私人空间
const handleHasPrivateSpace = () => {
  hasPrivateSpace.value = !!spaceId;
}

// 处理空间选择变化
const params = ref<{spaceId?: number, teamId?: number}>()
// accept the full payload to match child emit signature (teamId can be number|null|undefined)
const handleSpaceChange = (payload: { type: string, teamId?: number | null | undefined }) => {
  const { type, teamId } = payload
  if (type === 'public') {
    params.value = {}
  } else if (type === 'team') {
    params.value = { spaceId: teamId ?? undefined }
  } else {
    params.value = { spaceId: spaceId }
  }
}

// template handler wrapper: accept any payload (avoids template type mismatch) and forward to typed handler
const onSpaceChange = (payload: any) => {
  handleSpaceChange(payload)
}

// 团队空间列表
const teamList = ref<Array<{ id: number, spaceName?: string }>>([])
const fetchTeamList = async () => {
  const res: any = await listMyTeamSpaceUsingPost()
  if (res.data && res.data.code === 0 && res.data.data) {
    const data = res.data.data as any[]
    teamList.value = data.map((item: any) => ({
      id: item?.space?.id || -1,
      spaceName: item?.space?.spaceName || '',
    }))
  }
}
onMounted(() => {
  fetchTeamList()
  handleHasPrivateSpace()
})


/**
 * 上传图片
 * @param file 图片文件
 */
const handleUpload = async ({ file }: any) => {
  try {
    // 可以做一些优化防止用户把一张照片上传多次
    // const params = props.picture ? { id: props.picture.id, spaceId: spaceId} : {}
    const res: any = await uploadPictureUsingPost(params.value || {}, {}, file)
    if (res?.data && res.data.code === 0 && res.data.data) {
      props.onSuccess?.(res.data.data)
      message.success('上传图片成功')
    } else {
      message.error(res?.data?.message || '上传失败')
    }
  } catch (e:any) {
    message.error(e.message)
  }
}

/**
 * 图片效验
 * @param file 图片文件
 */
const beforeUpload = (file: any) => {
  console.log(file)
  const isJpgOrPng = file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('你只能  上传 JPG 或 PNG 文件!')
  }
  const isLt2M = file.size / 1024 / 1024 < 10
  if (!isLt2M) {
    message.error('图片必须小于 10MB!')
  }
  return isJpgOrPng && isLt2M
}
</script>

<style  scoped>
#uploadFileElement :deep(.ant-upload-drag) {
  max-height: 100%;
  max-width: 100%;
  min-height: 152px;
  min-width: 152px;
}

#uploadFileElement img {
  max-width: 100%;
  max-height: 430px;
}
</style>
