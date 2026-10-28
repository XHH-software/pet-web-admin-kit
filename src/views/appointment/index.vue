<template>
  <div class="p-page">
    <PageHeader title="预约管理">
      <el-button @click="router.push('/appointment/calendar')">
        <el-icon><Calendar /></el-icon>
        日历视图
      </el-button>
    </PageHeader>

    <!-- 筛选区 -->
    <FilterBar :filter-model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="预约日期">
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
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="item in APPOINTMENT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="员工">
        <el-select v-model="query.staffId" placeholder="请选择员工" clearable>
          <el-option
            v-for="item in staffOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          placeholder="订单号/手机号/宠物名"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
    </FilterBar>

    <!-- 表格区 -->
    <div class="p-card">
      <div class="p-toolbar">
        <span class="p-toolbar__total">共 {{ total }} 条</span>
      </div>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="订单号" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">{{ row.orderNo }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="预约时间" width="160">
          <template #default="{ row }">
            <div class="p-cell-line">{{ row.appointmentDate }}</div>
            <div class="p-cell-line p-text-secondary">{{ row.startTime }}-{{ row.endTime }}</div>
          </template>
        </el-table-column>
        <el-table-column label="客户" width="130">
          <template #default="{ row }">
            <div class="p-cell-line">{{ row.customerName }}</div>
            <div class="p-cell-line p-text-secondary">{{ row.customerPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="宠物" width="130">
          <template #default="{ row }">
            <div class="p-cell-line">
              <el-icon v-if="getSpeciesIcon(row.petSpecies)" class="p-species-icon">
                <component :is="getSpeciesIcon(row.petSpecies)" />
              </el-icon>
              {{ row.petName }}
            </div>
            <div class="p-cell-line p-text-secondary">{{ row.petBreed }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="itemSummary" label="服务项目" min-width="180" show-overflow-tooltip />
        <el-table-column prop="staffName" label="员工" width="100" show-overflow-tooltip />
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">
            <span class="p-amount">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <StatusTag :value="row.status" dict="appointment" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <!-- status 1: 待支付 → cancel -->
            <template v-if="row.status === 1">
              <el-button link type="danger" @click="handleCancel(row)">取消</el-button>
            </template>
            <!-- status 2: 待服务 → checkin + cancel -->
            <template v-else-if="row.status === 2">
              <el-button link type="primary" @click="handleCheckin(row)">核销</el-button>
              <el-button link type="danger" @click="handleCancel(row)">取消</el-button>
            </template>
            <!-- status 3: 服务中 → complete -->
            <template v-else-if="row.status === 3">
              <el-button link type="primary" @click="handleComplete(row)">完成</el-button>
            </template>
            <!-- status 4/5/6: detail only -->
            <template v-else>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            </template>
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

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="预约详情"
      size="640px"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="p-detail-content">
        <template v-if="detailData">
          <!-- 1. 预约信息 -->
          <div class="p-detail-section">
            <h3 class="p-card-title">预约信息</h3>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="订单号">{{ detailData.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <StatusTag :value="detailData.status" dict="appointment" />
              </el-descriptions-item>
              <el-descriptions-item label="预约时间">
                {{ detailData.appointmentDate }} {{ detailData.startTime }}-{{ detailData.endTime }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 2. 客户 & 宠物 -->
          <div class="p-detail-section">
            <h3 class="p-card-title">客户 & 宠物</h3>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="客户姓名">{{ detailData.customerName }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detailData.customerPhone }}</el-descriptions-item>
              <el-descriptions-item label="宠物名">{{ detailData.petName }}</el-descriptions-item>
              <el-descriptions-item label="品种">{{ detailData.petBreed }}</el-descriptions-item>
              <el-descriptions-item label="体重">{{ detailData.petWeight ? detailData.petWeight + ' kg' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="疫苗到期">
                <span :class="{ 'p-text-danger': isVaccineExpired(detailData.vaccineExpiry) }">
                  {{ detailData.vaccineExpiry || '-' }}
                  <el-tag v-if="isVaccineExpired(detailData.vaccineExpiry)" type="danger" size="small" effect="light" style="margin-left: 4px">已过期</el-tag>
                </span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 3. 服务明细 -->
          <div class="p-detail-section">
            <h3 class="p-card-title">服务明细</h3>
            <el-table :data="detailData.items || []" border size="small">
              <el-table-column prop="itemName" label="项目名称" min-width="140" show-overflow-tooltip />
              <el-table-column label="单价" width="90" align="right">
                <template #default="{ row }">
                  <span class="p-amount">¥{{ formatAmount(row.unitPrice) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="时长(分)" width="80" align="center" />
              <el-table-column prop="quantity" label="数量" width="70" align="center" />
              <el-table-column label="小计" width="90" align="right">
                <template #default="{ row }">
                  <span class="p-amount">¥{{ formatAmount(row.subtotal) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 4. 金额 -->
          <div class="p-detail-section">
            <h3 class="p-card-title">金额</h3>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="总金额">
                <span class="p-amount">¥{{ formatAmount(detailData.totalAmount) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="已付金额">
                <span class="p-amount">¥{{ formatAmount(detailData.paidAmount) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="支付状态">
                <StatusTag :value="detailData.payStatus" dict="pay" />
              </el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ detailData.payTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 5. 备注 -->
          <div class="p-detail-section">
            <h3 class="p-card-title">备注</h3>
            <p class="p-detail-remark">{{ detailData.remark || '无' }}</p>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { APPOINTMENT_STATUS_OPTIONS, PAY_STATUS_OPTIONS, PET_SPECIES } from '@/constants/enums'
import {
  getAppointmentPage,
  getAppointmentDetail,
  checkinAppointment,
  completeAppointment,
  cancelAppointment
} from '@/api/appointment'
import { getStaffList } from '@/api/staff'

const router = useRouter()

// ---------- 查询相关 ----------
const query = reactive({
  page: 1,
  pageSize: 10,
  startDate: '',
  endDate: '',
  status: '',
  staffId: '',
  keyword: ''
})

const dateRange = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const staffOptions = ref([])

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
    const res = await getAppointmentPage(query)
    tableData.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function loadStaffOptions() {
  try {
    const res = await getStaffList()
    staffOptions.value = res || []
  } catch {
    staffOptions.value = []
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  dateRange.value = null
  query.startDate = ''
  query.endDate = ''
  query.status = ''
  query.staffId = ''
  query.keyword = ''
  handleSearch()
}

// ---------- 工具函数 ----------
function formatAmount(value) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

function getSpeciesIcon(species) {
  // Return a species label character; actual icon component depends on icon library
  return null
}

function isVaccineExpired(expiry) {
  if (!expiry) return false
  return new Date(expiry) < new Date()
}

// ---------- 操作 ----------
async function handleCheckin(row) {
  try {
    await ElMessageBox.confirm('确认客户已到店？', '核销确认', {
      type: 'info',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await checkinAppointment(row.id)
    ElMessage.success('核销成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm('确认完成本次服务？', '完成确认', {
      type: 'success',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await completeAppointment(row.id)
    ElMessage.success('操作成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function handleCancel(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消预约', {
      confirmButtonText: '确定',
      cancelButtonText: '返回',
      inputPattern: /\S+/,
      inputErrorMessage: '取消原因不能为空',
      inputValidator: (val) => {
        if (!val || !val.trim()) return '取消原因不能为空'
        if (val.length > 100) return '取消原因不能超过100字'
        return true
      },
      inputType: 'textarea',
      inputPlaceholder: '请输入取消原因（最多100字）'
    })
    await cancelAppointment(row.id, { cancelReason: value })
    ElMessage.success('取消成功')
    loadData()
  } catch {
    // cancelled or input invalid
  }
}

// ---------- 详情抽屉 ----------
const drawerVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref(null)

async function openDetail(row) {
  drawerVisible.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    const res = await getAppointmentDetail(row.id)
    detailData.value = res
  } finally {
    detailLoading.value = false
  }
}

// ---------- 初始化 ----------
onMounted(() => {
  loadData()
  loadStaffOptions()
})
</script>

<style scoped lang="scss">
.p-cell-line {
  line-height: 20px;
  white-space: nowrap;
}

.p-species-icon {
  margin-right: 2px;
  font-size: 14px;
  vertical-align: middle;
}

.p-text-danger {
  color: var(--p-danger);
  font-weight: 500;
}

.p-detail-content {
  min-height: 200px;
}

.p-detail-section {
  margin-bottom: 24px;

  .p-card-title {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--p-border-light);
  }
}

.p-detail-remark {
  font-size: 14px;
  color: var(--p-text-2);
  line-height: 22px;
  margin: 0;
  padding: 8px 12px;
  background: var(--p-bg-page);
  border-radius: var(--p-radius-sm);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
