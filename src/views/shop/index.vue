<template>
  <div class="p-page">
    <PageHeader title="门店设置" />

    <div class="p-card" v-loading="pageLoading">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="right"
        class="p-shop-form"
      >
        <!-- 门店名称 -->
        <el-form-item label="门店名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入门店名称"
            maxlength="30"
            show-word-limit
            style="max-width: 400px"
          />
        </el-form-item>

        <!-- 门店 logo -->
        <el-form-item label="门店 logo" prop="logo">
          <ImageUpload v-model="form.logo" />
        </el-form-item>

        <!-- 联系电话 -->
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入联系电话"
            maxlength="11"
            style="max-width: 400px"
          />
        </el-form-item>

        <!-- 门店地址 -->
        <el-form-item label="门店地址" prop="address">
          <el-input
            v-model="form.address"
            placeholder="请输入门店地址"
            maxlength="100"
            show-word-limit
            style="max-width: 400px"
          />
        </el-form-item>

        <!-- 营业状态 -->
        <el-form-item label="营业状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="营业中"
            inactive-text="休息中"
          />
        </el-form-item>

        <!-- 营业时间 -->
        <el-form-item label="营业时间">
          <div class="p-shop-hours">
            <div
              v-for="(day, index) in form.businessHours"
              :key="index"
              class="p-shop-hours__row"
            >
              <span class="p-shop-hours__label">{{ WEEK_LABELS[index] }}</span>
              <el-switch
                v-model="day.isRest"
                :active-value="1"
                :inactive-value="0"
                active-text="休息"
                inactive-text="营业"
                class="p-shop-hours__rest-switch"
              />
              <template v-if="!day.isRest">
                <el-time-select
                  v-model="day.openTime"
                  :start="'08:00'"
                  :step="'00:30'"
                  :end="'22:00'"
                  placeholder="开始时间"
                  class="p-shop-hours__time"
                />
                <span class="p-shop-hours__separator">至</span>
                <el-time-select
                  v-model="day.closeTime"
                  :start="'08:00'"
                  :step="'00:30'"
                  :end="'22:00'"
                  :min-time="day.openTime"
                  placeholder="结束时间"
                  class="p-shop-hours__time"
                />
              </template>
            </div>
          </div>
        </el-form-item>

        <!-- 保存按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSave">
            保存
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import PageHeader from '@/components/PageHeader.vue'
import ImageUpload from '@/components/ImageUpload.vue'

// ---- 常量 ----
const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// ---- API ----
const getShopInfo = () => request.get('/admin/shop')
const updateShopInfo = (data) => request.put('/admin/shop', data)

// ---- 状态 ----
const formRef = ref(null)
const pageLoading = ref(false)
const submitLoading = ref(false)

// 默认营业时间行
function createDefaultDay(isRest = 0) {
  return { isRest, openTime: '09:00', closeTime: '21:00' }
}

const form = reactive({
  name: '',
  logo: '',
  phone: '',
  address: '',
  status: 1,
  businessHours: Array.from({ length: 7 }, () => createDefaultDay())
})

// ---- 校验规则 ----
const phonePattern = /^1[3-9]\d{9}$/

const formRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: phonePattern, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }]
}

// ---- 加载数据 ----
async function loadShopInfo() {
  pageLoading.value = true
  try {
    const data = await getShopInfo()
    if (!data) return
    form.name = data.name ?? ''
    form.logo = data.logo ?? ''
    form.phone = data.phone ?? ''
    form.address = data.address ?? ''
    form.status = data.status ?? 1
    if (Array.isArray(data.businessHours) && data.businessHours.length === 7) {
      form.businessHours = data.businessHours.map((d) => ({
        isRest: d.isRest ?? 0,
        openTime: d.openTime ?? '09:00',
        closeTime: d.closeTime ?? '21:00'
      }))
    }
  } finally {
    pageLoading.value = false
  }
}

// ---- 保存 ----
async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await updateShopInfo({
      name: form.name,
      logo: form.logo,
      phone: form.phone,
      address: form.address,
      status: form.status,
      businessHours: form.businessHours
    })
    ElMessage.success('保存成功')
  } finally {
    submitLoading.value = false
  }
}

// ---- 初始化 ----
onMounted(() => {
  loadShopInfo()
})
</script>

<style scoped lang="scss">
.p-shop-form {
  max-width: 700px;
}

.p-shop-hours {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.p-shop-hours__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
}

.p-shop-hours__label {
  width: 40px;
  font-size: 14px;
  color: var(--p-text-2);
  flex-shrink: 0;
}

.p-shop-hours__rest-switch {
  flex-shrink: 0;
}

.p-shop-hours__time {
  width: 130px;
  flex-shrink: 0;
}

.p-shop-hours__separator {
  font-size: 14px;
  color: var(--p-text-3);
  flex-shrink: 0;
}
</style>
