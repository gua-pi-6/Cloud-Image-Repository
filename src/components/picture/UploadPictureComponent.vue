<template>
  <div id="uploadFileElement">
    <UploadSpaceSelector :teamList="teamList"
                         :hasPrivateSpace="hasPrivateSpace"
                         @change = "handleSpaceChange"
                         v-if="!id"
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
      <img v-if="props.picture?.id" :src="props.picture?.url"  alt="图片加载失败"/>
      <div v-else>
        <p class="ant-upload-drag-icon">
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="ant-upload-text">点击或拖动文件到此区域上传</p>
      </div>

    </a-upload-dragger>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getPictureVoByIdUsingGet, uploadPictureUsingPost } from '@/api/pictureController'
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
const id = useRoute().params.id

const file = ref()
const hasPrivateSpace = ref<boolean>(false)

// 处理是否有私人空间
const handleHasPrivateSpace = () => {
  hasPrivateSpace.value = !!spaceId;
}

// 处理空间选择变化
const params = ref<{spaceId?: number, teamId?: number}>()
const handleSpaceChange = ({type, teamId} : {type: string, teamId?: number}) => {
  if (type === 'public') {
    params.value = {}
  } else if (type === 'team') {
    params.value = { spaceId: teamId }
  } else {
    params.value = { spaceId: spaceId}
  }
}

// 团队空间列表
const teamList = ref<Array<{ id: number, spaceName?: string }>>([])
const fetchTeamList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamList.value = res.data.data.map(item => ({
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
    const res = await uploadPictureUsingPost(params.value || {}, {}, file)
    if (res.data.code === 0 && res.data.data) {
      props.onSuccess?.(res.data.data)
      message.success('上传图片成功')
    } else {
      message.error(res.data.message)
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
