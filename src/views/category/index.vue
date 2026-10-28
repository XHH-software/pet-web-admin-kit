<template>
  <div class="p-page">
    <PageHeader title="分类管理">
      <el-button type="primary" @click="openCreate">新增分类</el-button>
    </PageHeader>

    <!-- Tab 切换 -->
    <div class="p-card">
      <el-tabs v-model="activeType" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="item in CATEGORY_TYPE"
          :key="item.value"
          :label="item.label"
          :name="String(item.value)"
        />
      </el-tabs>
    </div>

    <!-- 表格区 -->
    <div class="p-card">
      <div class="p-toolbar">
        <span class="p-toolbar__total">共 {{ total }} 条</span>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="分类名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="100" align="center" />
        <el-table-column label="类型" width="120" align="center">
          <template #default="{ row }">
            {{ getTypeLabel(row.type) }}
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
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="0"
            :step="1"
            placeholder="请输入排序值"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-input :model-value="currentTypeLabel" disabled />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { CATEGORY_TYPE } from '@/constants/enums'
import { getCategoryPage, createCategory, updateCategory, deleteCategory, updateCategoryStatus } from '@/api/category'

// 当前 Tab 类型
const activeType = ref(String(CATEGORY_TYPE[0].value))

// 查询参数
const query = reactive({
  page: 1,
  pageSize: 10,
  type: Number(activeType.value)
})

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 加载列表数据
async function loadData() {
  loading.value = true
  try {
    const res = await getCategoryPage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

// Tab 切换
function handleTabChange() {
  query.type = Number(activeType.value)
  query.page = 1
  loadData()
}

// 获取类型标签
function getTypeLabel(value) {
  const item = CATEGORY_TYPE.find(t => t.value === value)
  return item?.label || '未知'
}

// 当前类型标签（弹窗用）
const currentTypeLabel = computed(() => getTypeLabel(Number(activeType.value)))

// 切换状态
async function handleStatusChange(row, val) {
  const newStatus = val ? 1 : 0
  row._statusLoading = true
  try {
    await updateCategoryStatus(row.id, newStatus)
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
  name: '',
  sort: 0
})

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

function resetForm() {
  form.name = ''
  form.sort = 0
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
    name: row.name,
    sort: row.sort ?? 0
  })
  dialogVisible.value = true
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = { ...form, type: Number(activeType.value) }
    if (isEdit.value) {
      await updateCategory({ id: editingId.value, ...payload })
    } else {
      await createCategory(payload)
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
      `确定删除分类「${row.name}」吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style>
