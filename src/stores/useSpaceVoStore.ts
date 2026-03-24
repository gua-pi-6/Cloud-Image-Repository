import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getSpaceVoUsingPost } from '../api/spaceController'

export const useSpaceVoStore = defineStore('useSpaceVoStore', () => {
  const spaceVo = ref<API.SpaceVO>({
    id: undefined,
  })


  const fetchSpaceVo = async () => {
      const res = await getSpaceVoUsingPost({spaceType: 0})
      if (res?.data.code === 0 && res?.data.data){
        spaceVo.value = res.data.data
      }
  }

  const setSpaceVo = async (newSpaceVo: API.SpaceVO) => {
    spaceVo.value = newSpaceVo
  }
  return {spaceVo, fetchSpaceVo, setSpaceVo}

})


