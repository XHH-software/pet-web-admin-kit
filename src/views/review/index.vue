<template>
  <div class="p-page">
    <PageHeader title="评价管理" />

    <!-- 筛选区 -->
    <FilterBar :filter-model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="评分">
        <el-select v-model="query.rating" placeholder="请选择评分" clearable>
          <el-option label="5星" :value="5" />
          <el-option label="4星" :value="4" />
          <el-option label="3星" :value="3" />
          <el-option label="2星" :value="2" />
          <el-option label="1星" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="评价时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </el-form-item>
      <el-form-item label="回复状态">
        <el-select v-model="query.replied" placeholder="请选择" clearable>
          <el-option label="全部" value="" />
          <el-option label="已回复" :value="1" />
          <el-option label="未回复" :value="0" />
        </el-select>
      </el-form-item>
    </FilterBar>

    <!-- 表格区 -->
    <div class="p-card">
      <div class="p-toolbar">
        <span class="p-toolbar__total">共 {{ total }} 条</span>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="customerName" label="客户姓名" width="120" show-overflow-tooltip />
        <el-table-column prop="petName" label="宠物名称" width="120" show-overflow-tooltip />
        <el-table-column prop="staffName" label="服务员工" width="120" show-overflow-tooltip />
        <el-table-column label="评分" width="160" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.rating" :max="5" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="商家回复" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.replyContent" class="p-reply-text">{{ row.replyContent }}</span>
            <span v-else class="p-text-secondary">暂无回复</span>
          </template>
        </el-table-column>
        <el-table-column label="评价时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="!row.replyContent"
              link
              type="primary"
              @click="openReply(row)"
            >回复</el-button>
            <span v-else class="p-text-secondary">已回复</span>
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

    <!-- 回复弹窗 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评价"
      width="520px"
      destroy-on-close
    >
      <div v-if="replyingRow" class="p-reply-original">
        <div class="p-reply-original__header">
          <span>{{ replyingRow.customerName }}</span>
          <el-rate v-model="replyingRow.rating" :max="5" disabled style="margin-left: 8px" />
        </div>
        <p class="p-reply-original__content">{{ replyingRow.content }}</p>
      </div>
      <el-form
        ref="replyFormRef"
        :model="replyForm"
        :rules="replyRules"
        label-width="0"
      >
        <el-form-item prop="replyContent">
          <el-input
            v-model="replyForm.replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="handleSubmitReply">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getReviewPage, replyReview } from '@/api/review'

// ---------- 查询相关 ----------
const query = reactive({
  page: 1,
  pageSize: 10,
  rating: '',
  startDate: '',
  endDate: '',
  replied: ''
})

const dateRange = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

function handleDateChange(val) {
  if (val) {
    query.startDate = val[0]
    query.endDate = val[1]
  } else {
    query.startDate = ''
    query.endDate = ''
  }
}

// ---------- 数据加载 ----------
async function loadData() {
  loading.value = true
  try {
    const res = await getReviewPage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  dateRange.value = null
  query.rating = ''
  query.startDate = ''
  query.endDate = ''
  query.replied = ''
  handleSearch()
}

// ---------- 工具函数 ----------
function formatTime(val) {
  if (!val) return '-'
  return dayjs(val).format('YYYY-MM-DD HH:mm')
}

// ---------- 回复相关 ----------
const replyDialogVisible = ref(false)
const replyLoading = ref(false)
const replyingRow = ref(null)
const replyFormRef = ref(null)

const replyForm = reactive({
  replyContent: ''
})

const replyRules = {
  replyContent: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

function openReply(row) {
  replyingRow.value = row
  replyForm.replyContent = ''
  replyDialogVisible.value = true
}

async function handleSubmitReply() {
  const valid = await replyFormRef.value.validate().catch(() => false)
  if (!valid) return

  replyLoading.value = true
  try {
    await replyReview(replyingRow.value.id, { replyContent: replyForm.replyContent })
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadData()
  } finally {
    replyLoading.value = false
  }
}

// ---------- 初始化 ----------
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.p-reply-text {
  color: var(--p-text-2);
}

.p-reply-original {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--p-bg-page);
  border-radius: var(--p-radius-sm);

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--p-text-2);
  }

  &__content {
    margin: 0;
    font-size: 14px;
    color: var(--p-text-1);
    line-height: 22px;
    word-break: break-all;
  }
}
</style>
