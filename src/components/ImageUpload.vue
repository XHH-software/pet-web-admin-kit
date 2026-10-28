<template>
  <div class="p-image-upload" @paste="handlePaste">
    <div v-if="previewUrl" class="p-image-upload__preview">
      <img :src="previewUrl" alt="预览" />
      <div class="p-image-upload__mask">
        <el-icon class="p-image-upload__action" @click.stop="triggerUpload"><Refresh /></el-icon>
        <el-icon class="p-image-upload__action" @click.stop="handleRemove"><Delete /></el-icon>
      </div>
    </div>
    <div v-else class="p-image-upload__trigger" @click="triggerUpload">
      <el-icon :size="24" color="var(--p-text-4)"><Plus /></el-icon>
      <span class="p-image-upload__hint">点击上传</span>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Delete } from '@element-plus/icons-vue'
import request from '@/api/request'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const previewUrl = ref(props.modelValue || '')
const uploading = ref(false)

watch(() => props.modelValue, (val) => {
  previewUrl.value = val || ''
})

function triggerUpload() {
  fileInput.value?.click()
}

// 校验文件类型和大小
function validateFile(file) {
  const isImage = ['image/jpeg', 'image/png'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传 jpg/png 格式的图片')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 上传文件到服务器
async function uploadFile(file) {
  if (!validateFile(file)) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const url = await request.post('/admin/common/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    previewUrl.value = url
    emit('update:modelValue', url)
  } catch {
    // 拦截器已处理错误提示
  } finally {
    uploading.value = false
    // 清空 input 以便重复选择同一文件
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) uploadFile(file)
}

// 粘贴上传
function handlePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) uploadFile(file)
      break
    }
  }
}

function handleRemove() {
  previewUrl.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped lang="scss">
.p-image-upload {
  display: inline-block;
}

.p-image-upload__preview {
  width: 60px;
  height: 60px;
  border-radius: var(--p-radius);
  overflow: hidden;
  position: relative;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.p-image-upload__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.p-image-upload__preview:hover .p-image-upload__mask {
  opacity: 1;
}

.p-image-upload__action {
  color: #FFFFFF;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    color: var(--p-primary);
  }
}

.p-image-upload__trigger {
  width: 60px;
  height: 60px;
  border: 1px dashed var(--p-border);
  border-radius: var(--p-radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 2px;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--p-primary);
  }
}

.p-image-upload__hint {
  font-size: 12px;
  color: var(--p-text-4);
}
</style>
