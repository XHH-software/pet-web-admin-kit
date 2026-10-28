<template>
  <div class="p-page">
    <PageHeader title="员工管理">
      <el-button type="primary" @click="openCreate">新增员工</el-button>
    </PageHeader>

    <!-- 筛选区 -->
    <FilterBar :filter-model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="姓名">
        <el-input v-model="query.name" placeholder="请输入员工姓名" clearable />
      </el-form-item>
      <el-form-item label="职位">
        <el-select v-model="query.position" placeholder="请选择职位" clearable>
          <el-option
            v-for="item in STAFF_POSITION"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="item in COMMON_STATUS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </FilterBar>

    <!-- 表格区 -->
    <div class="p-card">
      <div class="p-toolbar">
        <span class="p-toolbar__total">共 {{ total }} 条</span>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar
              v-if="row.avatar"
              :src="row.avatar"
              :size="40"
              shape="circle"
              fit="cover"
            />
            <el-avatar v-else :size="40" shape="circle" style="background: var(--p-primary-light); color: var(--p-primary)">
              {{ row.name ? row.name.charAt(0) : '' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" show-overflow-tooltip />
        <el-table-column label="职位" width="100" align="center">
          <template #default="{ row }">
            {{ getPositionLabel(row.position) }}
          </template>
        </el-table-column>
        <el-table-column label="职级" width="80" align="center">
          <template #default="{ row }">
            {{ getLevelLabel(row.level) }}
          </template>
        </el-table-column>
        <el-table-column label="擅长项目" min-width="200">
          <template #default="{ row }">
            <div class="p-specialty-tags" v-if="row.specialtyItems && row.specialtyItems.length">
              <el-tag
                v-for="item in row.specialtyItems.slice(0, 2)"
                :key="item.id"
                size="small"
              >{{ item.name }}</el-tag>
              <el-tag
                v-if="row.specialtyItems.length > 2"
                size="small"
                type="info"
              >+{{ row.specialtyItems.length - 2 }}</el-tag>
            </div>
            <span v-else style="color: var(--p-text-4); font-size: 13px">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="(val) => handleStatusChange(row, val)"
              :loading="row._statusLoading"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <EmptyState />
        </template>
      </el-table>
      <div class="p-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadData"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑员工' : '新增员工'"
      width="640px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="头像" prop="avatar">
          <ImageUpload v-model="form.avatar" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入员工姓名" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-select v-model="form.position" placeholder="请选择职位" style="width: 100%">
            <el-option
              v-for="item in STAFF_POSITION"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职级" prop="level">
          <el-select v-model="form.level" placeholder="请选择职级" style="width: 100%">
            <el-option
              v-for="item in STAFF_LEVEL"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="擅长项目" prop="specialtyItemIds">
          <el-select
            v-model="form.specialtyItemIds"
            multiple
            placeholder="请选择擅长项目"
            style="width: 100%"
          >
            <el-option
              v-for="item in specialtyOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            show-password
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { STAFF_POSITION, STAFF_LEVEL, COMMON_STATUS } from '@/constants/enums'
import { getStaffPage, createStaff, updateStaff, updateStaffStatus } from '@/api/staff'
import { getServiceItemPage } from '@/api/serviceItem'

// 查询参数
const query = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  position: '',
  status: ''
})

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const specialtyOptions = ref([])

// 加载列表数据
async function loadData() {
  loading.value = true
  try {
    const res = await getStaffPage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

// 加载擅长项目下拉选项
async function loadSpecialtyOptions() {
  try {
    const res = await getServiceItemPage({ page: 1, pageSize: 200, status: 1 })
    specialtyOptions.value = res.records || []
  } catch {
    specialtyOptions.value = []
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.name = ''
  query.position = ''
  query.status = ''
  handleSearch()
}

// 标签映射
function getPositionLabel(value) {
  const item = STAFF_POSITION.find(s => s.value === value)
  return item?.label || '未知'
}

function getLevelLabel(value) {
  const item = STAFF_LEVEL.find(s => s.value === value)
  return item?.label || '未知'
}

// 切换状态
async function handleStatusChange(row, val) {
  const newStatus = val ? 1 : 0
  row._statusLoading = true
  try {
    await updateStaffStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success('状态更新成功')
  } finally {
    row._statusLoading = false
  }
}

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const form = reactive({
  avatar: '',
  name: '',
  phone: '',
  position: '',
  level: '',
  specialtyItemIds: [],
  password: ''
})

// 手机号校验
const validatePhone = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
    return
  }
  callback()
}

// 密码校验
const validatePassword = (_rule, value, callback) => {
  if (!isEdit.value) {
    if (!value) {
      callback(new Error('请输入密码'))
      return
    }
    if (value.length < 6 || value.length > 20) {
      callback(new Error('密码长度为6-20位'))
      return
    }
  }
  callback()
}

const formRules = {
  name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  position: [{ required: true, message: '请选择职位', trigger: 'change' }],
  level: [{ required: true, message: '请选择职级', trigger: 'change' }],
  specialtyItemIds: [{ required: true, message: '请选择擅长项目', trigger: 'change', type: 'array', min: 1 }],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }]
}

// 动态规则：编辑时密码非必填
const computedRules = computed(() => {
  if (isEdit.value) {
    const { password, ...rest } = formRules
    return rest
  }
  return formRules
})

function resetForm() {
  form.avatar = ''
  form.name = ''
  form.phone = ''
  form.position = ''
  form.level = ''
  form.specialtyItemIds = []
  form.password = ''
  editingId.value = null
}

function openCreate() {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

function openEdit(row) {
  resetForm()
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    avatar: row.avatar || '',
    name: row.name,
    phone: row.phone,
    position: row.position,
    level: row.level,
    specialtyItemIds: (row.specialtyItems || []).map(item => item.id),
    password: ''
  })
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = { ...form }
    if (isEdit.value) {
      delete data.password
      await updateStaff({ id: editingId.value, ...data })
    } else {
      await createStaff(data)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadSpecialtyOptions()
})
</script>

<style scoped lang="scss">
.p-specialty-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
