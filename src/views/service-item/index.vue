<template>
  <div class="p-page">
    <PageHeader title="服务项目管理">
      <el-button type="primary" @click="openCreate">新增服务项目</el-button>
    </PageHeader>

    <!-- 筛选区 -->
    <FilterBar :filter-model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="项目名称">
        <el-input v-model="query.name" placeholder="请输入项目名称" clearable />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="query.categoryId" placeholder="请选择分类" clearable>
          <el-option
            v-for="item in categoryOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
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
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="row.image"
              :preview-src-list="[row.image]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: var(--p-radius)"
              preview-teleported
            />
            <span v-else style="color: var(--p-text-4); font-size: 13px">暂无</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" show-overflow-tooltip />
        <el-table-column prop="duration" label="时长(分钟)" width="100" align="center" />
        <el-table-column label="适用体型" width="100" align="center">
          <template #default="{ row }">
            {{ getSizeLabel(row.petSizeLimit) }}
          </template>
        </el-table-column>
        <el-table-column label="价格" width="100" align="right">
          <template #default="{ row }">
            <span class="p-amount">¥{{ formatAmount(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dailyLimit" label="每日上限" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="(val) => handleStatusChange(row, val)"
              :loading="row._statusLoading"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
      :title="isEdit ? '编辑服务项目' : '新增服务项目'"
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
        <el-form-item label="项目图片" prop="image">
          <ImageUpload v-model="form.image" />
        </el-form-item>
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0.01"
            :precision="2"
            :step="1"
            placeholder="请输入价格"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="服务时长" prop="duration">
          <el-select v-model="form.duration" placeholder="请选择服务时长" style="width: 100%">
            <el-option
              v-for="min in durationOptions"
              :key="min"
              :label="`${min} 分钟`"
              :value="min"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="适用体型" prop="petSizeLimit">
          <el-select v-model="form.petSizeLimit" placeholder="请选择适用体型" style="width: 100%">
            <el-option
              v-for="item in PET_SIZE_LIMIT"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="每日上限" prop="dailyLimit">
          <el-input-number
            v-model="form.dailyLimit"
            :min="1"
            :step="1"
            placeholder="请输入每日上限"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { COMMON_STATUS, PET_SIZE_LIMIT } from '@/constants/enums'
import { getServiceItemPage, createServiceItem, updateServiceItem, deleteServiceItem, updateServiceItemStatus } from '@/api/serviceItem'
import { getCategoryList } from '@/api/category'

// 时长选项
const durationOptions = [30, 60, 90, 120, 150, 180]

// 查询参数
const query = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  categoryId: '',
  status: ''
})

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const categoryOptions = ref([])

// 加载列表数据
async function loadData() {
  loading.value = true
  try {
    const res = await getServiceItemPage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

// 加载分类下拉
async function loadCategoryOptions() {
  try {
    const res = await getCategoryList({ type: 1 })
    categoryOptions.value = res || []
  } catch {
    categoryOptions.value = []
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.name = ''
  query.categoryId = ''
  query.status = ''
  handleSearch()
}

// 获取体型标签
function getSizeLabel(value) {
  const item = PET_SIZE_LIMIT.find(s => s.value === value)
  return item?.label || '未知'
}

// 金额格式化
function formatAmount(value) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

// 切换状态
async function handleStatusChange(row, val) {
  const newStatus = val ? 1 : 0
  row._statusLoading = true
  try {
    await updateServiceItemStatus(row.id, newStatus)
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
  image: '',
  name: '',
  categoryId: '',
  price: undefined,
  duration: '',
  petSizeLimit: '',
  dailyLimit: undefined,
  description: '',
  status: 1
})

const formRules = {
  image: [{ required: true, message: '请上传项目图片', trigger: 'change' }],
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  duration: [{ required: true, message: '请选择服务时长', trigger: 'change' }],
  petSizeLimit: [{ required: true, message: '请选择适用体型', trigger: 'change' }],
  dailyLimit: [{ required: true, message: '请输入每日上限', trigger: 'blur' }]
}

function resetForm() {
  form.image = ''
  form.name = ''
  form.categoryId = ''
  form.price = undefined
  form.duration = ''
  form.petSizeLimit = ''
  form.dailyLimit = undefined
  form.description = ''
  form.status = 1
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
    image: row.image || '',
    name: row.name,
    categoryId: row.categoryId,
    price: row.price,
    duration: row.duration,
    petSizeLimit: row.petSizeLimit,
    dailyLimit: row.dailyLimit,
    description: row.description || '',
    status: row.status
  })
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateServiceItem({ id: editingId.value, ...form })
    } else {
      await createServiceItem(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除服务项目「${row.name}」吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await deleteServiceItem(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadData()
  loadCategoryOptions()
})
</script>

<style scoped lang="scss">
</style>
