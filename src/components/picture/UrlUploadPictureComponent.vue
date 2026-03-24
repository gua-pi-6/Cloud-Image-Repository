<template>
  <div id="urlUploadFileElement">
    <UploadSpaceSelector @change="handleSpaceChange"
                         :teamList="teamList"
                         v-if="!hasId"
    />
    <div class="url-picture-upload">
      <a-input-group compact style="margin-bottom: 16px">
        <a-input v-model:value="fileUrl" style="width: calc(100% - 120px)" placeholder="请输入图片 URL" />
        <a-button type="primary" :loading="loading" @click="handleUpload" style="width: 120px">提交</a-button>
      </a-input-group>
      <div style="text-align: center;">
        <img  v-if="picture?.url" :src="picture?.url" alt="avatar" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import UploadSpaceSelector from '@/components/picture/UploadSpaceSelector.vue'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import { useRoute } from 'vue-router'

interface PictureHandleType {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<PictureHandleType>()

const loading = ref(false)
const fileUrl = ref('')
const pictureId = ref()
const picture = ref<API.PictureVO>({})
// make route params id reactive so template v-if works as expected
const route = useRoute()
// compute a boolean for whether an id exists (avoids string/undefined truthiness pitfalls)
const hasId = computed(() => Boolean(route.params.id))


const teamList = ref<Array<{ id: number, spaceName?: string }>>([])

const fetchTeamList = async () => {
  const res: any = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    const data = res.data.data as any[]
    teamList.value = data.map((item: any) => ({
      id: item?.space?.id || -1,
      spaceName: item?.space?.spaceName || '',
    }))
  }
}
onMounted(() => {
  fetchTeamList()
})
// 处理空间选择变化
const spaceId = useSpaceVoStore().spaceVo.id
const params = ref<{spaceId?: number, teamId?: number}>()
// accept the full payload to match child emit signature exactly
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
/**
 * 上传图片
 */
const handleUpload = async () => {
  try {
    loading.value = true
    const res: any = await uploadPictureUsingPost(params.value || {}, {})
    if (res?.data?.code === 0 && res?.data?.data) {
      loading.value = false
      props.onSuccess?.(res.data?.data)
      picture.value = res.data?.data
      pictureId.value = picture.value.id
      message.success('上传图片成功')
    } else {
      message.warn(res.data.message)
    }
  } catch (e:any) {
    message.error(e.message)
  }
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
