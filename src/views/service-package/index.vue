<template>
  <div class="p-page">
    <PageHeader title="服务套餐管理">
      <el-button type="primary" @click="openCreate">新增套餐</el-button>
    </PageHeader>

    <!-- 筛选区 -->
    <FilterBar :filter-model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="套餐名称">
        <el-input v-model="query.name" placeholder="请输入套餐名称" clearable />
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
        <el-table-column prop="name" label="套餐名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" show-overflow-tooltip />
        <el-table-column label="包含项目" width="100" align="center">
          <template #default="{ row }">
            {{ row.details ? row.details.length : 0 }} 项
          </template>
        </el-table-column>
        <el-table-column label="原价" width="100" align="right">
          <template #default="{ row }">
            <span class="p-amount">¥{{ formatAmount(row.originalPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="售价" width="100" align="right">
          <template #default="{ row }">
            <span class="p-amount p-amount--selling">¥{{ formatAmount(row.sellingPrice) }}</span>
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
      :title="isEdit ? '编辑套餐' : '新增套餐'"
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
        <!-- 基本信息 -->
        <div class="p-dialog-section">
          <h4 class="p-dialog-section__title">基本信息</h4>
          <el-form-item label="套餐图片" prop="image">
            <ImageUpload v-model="form.image" />
          </el-form-item>
          <el-form-item label="套餐名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入套餐名称" maxlength="30" show-word-limit />
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
          <el-form-item label="售价" prop="sellingPrice">
            <el-input-number
              v-model="form.sellingPrice"
              :min="0.01"
              :precision="2"
              :step="1"
              placeholder="请输入售价"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="原价" prop="originalPrice">
            <el-input-number
              v-model="form.originalPrice"
              :min="0.01"
              :precision="2"
              :step="1"
              placeholder="请输入原价"
              style="width: 100%"
              controls-position="right"
            />
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
              placeholder="请输入套餐描述（选填）"
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
        </div>

        <!-- 套餐明细 -->
        <div class="p-dialog-section">
          <div class="p-dialog-section__header">
            <h4 class="p-dialog-section__title">套餐明细</h4>
            <el-button type="primary" link @click="addDetailItem">+ 添加项目</el-button>
          </div>
          <el-table :data="form.details" border size="small" class="p-detail-table">
            <el-table-column label="服务项目" min-width="180">
              <template #default="{ row, $index }">
                <el-select
                  v-model="row.serviceItemId"
                  placeholder="请选择服务项目"
                  filterable
                  style="width: 100%"
                  @change="(val) => handleServiceItemChange(val, $index)"
                >
                  <el-option
                    v-for="item in serviceItemOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                    :disabled="isServiceItemDisabled(item.id, $index)"
                  >
                    <span>{{ item.name }}</span>
                    <span style="float: right; color: var(--p-text-3); font-size: 12px">
                      {{ item.duration }}分钟 / ¥{{ formatAmount(item.price) }}
                    </span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="120" align="center">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :max="99"
                  size="small"
                  controls-position="right"
                  style="width: 90px"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计时长" width="100" align="center">
              <template #default="{ row }">
                {{ getDetailDuration(row) }} 分钟
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeDetailItem($index)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <span style="color: var(--p-text-4); font-size: 13px">请点击"添加项目"按钮</span>
            </template>
          </el-table>
          <div class="p-detail-summary">
            总时长合计：<strong>{{ totalDuration }}</strong> 分钟
          </div>
        </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import { COMMON_STATUS, PET_SIZE_LIMIT } from '@/constants/enums'
import { getPackagePage, createPackage, updatePackage, deletePackage, updatePackageStatus } from '@/api/servicePackage'
import { getCategoryList } from '@/api/category'
import { getServiceItemPage } from '@/api/serviceItem'

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
const serviceItemOptions = ref([])

// 加载列表数据
async function loadData() {
  loading.value = true
  try {
    const res = await getPackagePage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

// 加载分类下拉（type=2 为套餐分类）
async function loadCategoryOptions() {
  try {
    const res = await getCategoryList({ type: 2 })
    categoryOptions.value = res || []
  } catch {
    categoryOptions.value = []
  }
}

// 加载服务项目选项（用于套餐明细选择）
async function loadServiceItemOptions() {
  try {
    const res = await getServiceItemPage({ page: 1, pageSize: 500, status: 1 })
    serviceItemOptions.value = res.records || []
  } catch {
    serviceItemOptions.value = []
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
    await updatePackageStatus(row.id, newStatus)
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
  sellingPrice: undefined,
  originalPrice: undefined,
  dailyLimit: undefined,
  description: '',
  status: 1,
  details: []
})

// 自定义校验：套餐明细至少 1 项
const validateDetails = (_rule, _value, callback) => {
  if (!form.details || form.details.length === 0) {
    callback(new Error('请至少添加一个套餐明细项目'))
  } else {
    const invalid = form.details.some(d => !d.serviceItemId)
    if (invalid) {
      callback(new Error('请选择所有明细项目的服务项目'))
    } else {
      callback()
    }
  }
}

const formRules = {
  image: [{ required: true, message: '请上传套餐图片', trigger: 'change' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  sellingPrice: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  originalPrice: [{ required: true, message: '请输入原价', trigger: 'blur' }],
  dailyLimit: [{ required: true, message: '请输入每日上限', trigger: 'blur' }],
  details: [{ required: true, validator: validateDetails, trigger: 'change' }]
}

function resetForm() {
  form.image = ''
  form.name = ''
  form.categoryId = ''
  form.sellingPrice = undefined
  form.originalPrice = undefined
  form.dailyLimit = undefined
  form.description = ''
  form.status = 1
  form.details = []
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
    sellingPrice: row.sellingPrice,
    originalPrice: row.originalPrice,
    dailyLimit: row.dailyLimit,
    description: row.description || '',
    status: row.status,
    details: (row.details || []).map(d => ({
      serviceItemId: d.serviceItemId,
      quantity: d.quantity || 1
    }))
  })
  dialogVisible.value = true
}

// 套餐明细操作
function addDetailItem() {
  form.details.push({
    serviceItemId: '',
    quantity: 1
  })
}

function removeDetailItem(index) {
  form.details.splice(index, 1)
}

function handleServiceItemChange(_val, _index) {
  // 选择服务项目后触发校验清除
  formRef.value?.clearValidate('details')
}

function isServiceItemDisabled(itemId, currentIndex) {
  // 已在其他行选中的项目禁用，避免重复
  return form.details.some((d, i) => i !== currentIndex && d.serviceItemId === itemId)
}

function getDetailDuration(row) {
  const item = serviceItemOptions.value.find(s => s.id === row.serviceItemId)
  if (!item) return 0
  return (item.duration || 0) * (row.quantity || 1)
}

const totalDuration = computed(() => {
  return form.details.reduce((sum, d) => sum + getDetailDuration(d), 0)
})

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = {
      ...form,
      details: form.details.map(d => ({
        serviceItemId: d.serviceItemId,
        quantity: d.quantity
      }))
    }
    if (isEdit.value) {
      await updatePackage({ id: editingId.value, ...payload })
    } else {
      await createPackage(payload)
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
      `确定删除服务套餐「${row.name}」吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await deletePackage(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadData()
  loadCategoryOptions()
  loadServiceItemOptions()
})
</script>

<style scoped lang="scss">
.p-dialog-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.p-dialog-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.p-dialog-section__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--p-text-1);
  margin: 0 0 16px 0;

  .p-dialog-section__header & {
    margin: 0;
  }
}

.p-detail-table {
  width: 100%;

  :deep(.el-input-number) {
    width: 90px;
  }
}

.p-detail-summary {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: var(--p-text-2);

  strong {
    color: var(--p-primary);
    font-size: 16px;
  }
}

.p-amount--selling {
  color: var(--p-primary);
  font-weight: 500;
}
</style>
