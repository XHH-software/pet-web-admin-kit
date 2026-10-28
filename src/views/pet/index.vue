<template>
  <div class="p-page">
    <PageHeader title="宠物档案" />

    <!-- 只读提示 -->
    <div class="pet-notice">
      <el-icon><InfoFilled /></el-icon>
      宠物信息由客户在小程序端维护，此处仅供查看
    </div>

    <!-- 左右两栏布局 -->
    <div class="pet-layout">
      <!-- 左栏：客户列表 -->
      <div class="pet-sidebar">
        <div class="pet-sidebar__search">
          <el-input
            v-model="customerKeyword"
            placeholder="搜索客户昵称/手机号"
            clearable
            :prefix-icon="Search"
            @input="handleCustomerSearch"
            @clear="handleCustomerSearch"
          />
        </div>
        <el-scrollbar class="pet-sidebar__scroll">
          <div v-loading="customerLoading" class="pet-customer-list">
            <div
              v-for="item in customerList"
              :key="item.id"
              class="pet-customer-card"
              :class="{ 'is-active': selectedCustomer?.id === item.id }"
              @click="handleSelectCustomer(item)"
            >
              <el-avatar :size="44" :src="item.avatar" class="pet-customer-card__avatar">
                {{ item.nickname?.charAt(0) || '?' }}
              </el-avatar>
              <div class="pet-customer-card__info">
                <div class="pet-customer-card__name">{{ item.nickname }}</div>
                <div class="pet-customer-card__meta">{{ item.phone }}</div>
              </div>
              <div class="pet-customer-card__count">
                <span class="pet-customer-card__count-num">{{ item.petCount ?? 0 }}</span>
                <span class="pet-customer-card__count-label">只宠物</span>
              </div>
            </div>
            <EmptyState v-if="!customerLoading && customerList.length === 0" description="暂无客户" />
          </div>
        </el-scrollbar>
        <div class="pet-sidebar__pagination">
          <el-pagination
            v-model:current-page="customerQuery.page"
            :page-size="customerQuery.pageSize"
            :total="customerTotal"
            layout="prev, pager, next"
            small
            @change="loadCustomers"
          />
        </div>
      </div>

      <!-- 右栏：宠物卡片 -->
      <div class="pet-main">
        <template v-if="selectedCustomer">
          <div class="pet-main__header">
            <span class="p-card-title">{{ selectedCustomer.nickname }} 的宠物</span>
            <span class="p-text-secondary">共 {{ petTotal }} 只</span>
          </div>
          <div v-loading="petLoading" class="pet-grid">
            <el-card
              v-for="pet in petList"
              :key="pet.id"
              class="pet-card"
              shadow="hover"
              @click="openPetDetail(pet)"
            >
              <!-- 疫苗过期标签 -->
              <div v-if="isVaccineExpired(pet.vaccineExpiry)" class="pet-card__expired-tag">
                <el-tag type="danger" effect="dark" size="small">疫苗过期</el-tag>
              </div>
              <div class="pet-card__body">
                <el-avatar :size="64" :src="pet.avatar" class="pet-card__avatar">
                  {{ pet.name?.charAt(0) || '?' }}
                </el-avatar>
                <div class="pet-card__info">
                  <div class="pet-card__name">{{ pet.name }}</div>
                  <div class="pet-card__detail-row">
                    <span class="pet-card__species">{{ getSpeciesLabel(pet.species) }}</span>
                    <span v-if="pet.breed" class="pet-card__breed">{{ pet.breed }}</span>
                  </div>
                  <div class="pet-card__detail-row">
                    <span v-if="pet.weight">体重 {{ pet.weight }} kg</span>
                    <span v-if="pet.weight && pet.gender"> · </span>
                    <span v-if="pet.gender">{{ pet.gender === 1 ? '公' : '母' }}</span>
                  </div>
                  <div class="pet-card__vaccine" :class="{ 'is-expired': isVaccineExpired(pet.vaccineExpiry) }">
                    疫苗有效期至 {{ pet.vaccineExpiry ? dayjs(pet.vaccineExpiry).format('YYYY-MM-DD') : '—' }}
                  </div>
                </div>
              </div>
            </el-card>
            <EmptyState v-if="!petLoading && petList.length === 0" description="暂无宠物档案" />
          </div>
          <div v-if="petTotal > petQuery.pageSize" class="p-pagination">
            <el-pagination
              v-model:current-page="petQuery.page"
              v-model:page-size="petQuery.pageSize"
              :total="petTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next"
              small
              @change="loadPets"
            />
          </div>
        </template>
        <template v-else>
          <div class="pet-main__placeholder">
            <EmptyState description="请从左侧选择一位客户查看宠物档案" />
          </div>
        </template>
      </div>
    </div>

    <!-- 宠物详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="宠物详情"
      size="640px"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="pet-detail">
        <template v-if="detailData">
          <!-- 宠物基本信息 -->
          <div class="pet-detail__section">
            <h3 class="p-card-title">基本信息</h3>
            <div class="pet-detail__profile">
              <el-avatar :size="72" :src="detailData.avatar" class="pet-detail__avatar">
                {{ detailData.name?.charAt(0) || '?' }}
              </el-avatar>
              <div class="pet-detail__profile-info">
                <div class="pet-detail__profile-name">{{ detailData.name }}</div>
                <div class="pet-detail__profile-tags">
                  <el-tag size="small">{{ getSpeciesLabel(detailData.species) }}</el-tag>
                  <el-tag v-if="detailData.breed" size="small" type="info">{{ detailData.breed }}</el-tag>
                  <el-tag v-if="detailData.gender" size="small" type="info">
                    {{ detailData.gender === 1 ? '公' : '母' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-descriptions :column="2" border size="small" class="pet-detail__desc">
              <el-descriptions-item label="体重">
                {{ detailData.weight ? detailData.weight + ' kg' : '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="生日">
                {{ detailData.birthday ? dayjs(detailData.birthday).format('YYYY-MM-DD') : '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="绝育状态">
                {{ detailData.neutered === 1 ? '已绝育' : detailData.neutered === 0 ? '未绝育' : '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="疫苗到期">
                <span :class="{ 'p-text-danger': isVaccineExpired(detailData.vaccineExpiry) }">
                  {{ detailData.vaccineExpiry ? dayjs(detailData.vaccineExpiry).format('YYYY-MM-DD') : '—' }}
                  <el-tag
                    v-if="isVaccineExpired(detailData.vaccineExpiry)"
                    type="danger"
                    size="small"
                    effect="light"
                    style="margin-left: 4px"
                  >已过期</el-tag>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="过敏史" :span="2">
                {{ detailData.allergies || '无' }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ detailData.remark || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 关联客户 -->
          <div class="pet-detail__section">
            <h3 class="p-card-title">所属客户</h3>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="客户昵称">{{ detailData.customerNickname || '—' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detailData.customerPhone || '—' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 预约记录 -->
          <div class="pet-detail__section">
            <h3 class="p-card-title">预约记录</h3>
            <el-table
              :data="detailData.appointments || []"
              border
              size="small"
              :empty-text="'暂无预约记录'"
            >
              <el-table-column prop="orderNo" label="订单号" min-width="150" show-overflow-tooltip />
              <el-table-column label="预约时间" width="160">
                <template #default="{ row }">
                  <div>{{ row.appointmentDate }}</div>
                  <div class="p-text-secondary">{{ row.startTime }}-{{ row.endTime }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="itemSummary" label="服务项目" min-width="140" show-overflow-tooltip />
              <el-table-column prop="staffName" label="员工" width="90" show-overflow-tooltip />
              <el-table-column label="金额" width="90" align="right">
                <template #default="{ row }">
                  <span class="p-amount">¥{{ formatAmount(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <StatusTag :value="row.status" dict="appointment" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusTag from '@/components/StatusTag.vue'
import { PET_SPECIES } from '@/constants/enums'
import { getCustomerPage } from '@/api/customer'
import { getPetPage, getPetDetail } from '@/api/pet'

// ===================== 客户列表 =====================
const customerKeyword = ref('')
const customerQuery = reactive({
  page: 1,
  pageSize: 20,
  keyword: ''
})
const customerLoading = ref(false)
const customerList = ref([])
const customerTotal = ref(0)
const selectedCustomer = ref(null)

let customerSearchTimer = null
function handleCustomerSearch() {
  clearTimeout(customerSearchTimer)
  customerSearchTimer = setTimeout(() => {
    customerQuery.page = 1
    customerQuery.keyword = customerKeyword.value
    loadCustomers()
  }, 300)
}

async function loadCustomers() {
  customerLoading.value = true
  try {
    const res = await getCustomerPage(customerQuery)
    customerList.value = res.records || []
    customerTotal.value = res.total || 0
  } catch {
    customerList.value = []
    customerTotal.value = 0
  } finally {
    customerLoading.value = false
  }
}

function handleSelectCustomer(customer) {
  if (selectedCustomer.value?.id === customer.id) return
  selectedCustomer.value = customer
  petQuery.page = 1
  petQuery.customerId = customer.id
  loadPets()
}

// ===================== 宠物列表 =====================
const petQuery = reactive({
  page: 1,
  pageSize: 12,
  customerId: ''
})
const petLoading = ref(false)
const petList = ref([])
const petTotal = ref(0)

async function loadPets() {
  if (!petQuery.customerId) return
  petLoading.value = true
  try {
    const res = await getPetPage(petQuery)
    petList.value = res.records || []
    petTotal.value = res.total || 0
  } catch {
    petList.value = []
    petTotal.value = 0
  } finally {
    petLoading.value = false
  }
}

// ===================== 工具函数 =====================
function getSpeciesLabel(value) {
  const item = PET_SPECIES.find(s => s.value === value)
  return item?.label || '未知'
}

function isVaccineExpired(expiry) {
  if (!expiry) return false
  return dayjs(expiry).isBefore(dayjs(), 'day')
}

function formatAmount(value) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

// ===================== 详情抽屉 =====================
const drawerVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref(null)

async function openPetDetail(pet) {
  drawerVisible.value = true
  detailLoading.value = true
  detailData.value = null
  try {
    const res = await getPetDetail(pet.id)
    detailData.value = res
  } finally {
    detailLoading.value = false
  }
}

// ===================== 初始化 =====================
onMounted(() => {
  loadCustomers()
})
</script>

<style scoped lang="scss">
.pet-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--p-text-3);
  background: var(--p-bg-page);
  border-radius: var(--p-radius-sm);

  .el-icon {
    font-size: 15px;
    color: var(--p-info);
  }
}

/* ---- 左右布局 ---- */
.pet-layout {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 200px);
}

/* ---- 左栏：客户列表 ---- */
.pet-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--p-bg-card);
  border-radius: var(--p-radius);
  box-shadow: var(--p-shadow-card);
  overflow: hidden;
}

.pet-sidebar__search {
  padding: 12px;
  border-bottom: 1px solid var(--p-border-light);
}

.pet-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.pet-customer-list {
  padding: 8px;
}

.pet-customer-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: var(--p-radius);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--p-bg-page);
  }

  &.is-active {
    background: var(--p-primary-light);
  }
}

.pet-customer-card__avatar {
  flex-shrink: 0;
  background: var(--p-primary);
  color: #fff;
  font-size: 16px;
}

.pet-customer-card__info {
  flex: 1;
  min-width: 0;
}

.pet-customer-card__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--p-text-1);
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pet-customer-card__meta {
  font-size: 12px;
  color: var(--p-text-3);
  line-height: 18px;
}

.pet-customer-card__count {
  flex-shrink: 0;
  text-align: center;
}

.pet-customer-card__count-num {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--p-primary);
  line-height: 24px;
  font-variant-numeric: tabular-nums;
}

.pet-customer-card__count-label {
  display: block;
  font-size: 11px;
  color: var(--p-text-3);
  line-height: 16px;
}

.pet-sidebar__pagination {
  display: flex;
  justify-content: center;
  padding: 8px;
  border-top: 1px solid var(--p-border-light);
}

/* ---- 右栏：宠物卡片 ---- */
.pet-main {
  flex: 1;
  min-width: 0;
}

.pet-main__header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.pet-main__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--p-bg-card);
  border-radius: var(--p-radius);
  box-shadow: var(--p-shadow-card);
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pet-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.pet-card__expired-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.pet-card__body {
  display: flex;
  gap: 14px;
}

.pet-card__avatar {
  flex-shrink: 0;
  background: var(--p-primary-light);
  color: var(--p-primary);
  font-size: 22px;
}

.pet-card__info {
  flex: 1;
  min-width: 0;
}

.pet-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--p-text-1);
  line-height: 24px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pet-card__detail-row {
  font-size: 13px;
  color: var(--p-text-2);
  line-height: 20px;

  .pet-card__species {
    margin-right: 6px;
  }

  .pet-card__breed {
    color: var(--p-text-3);
  }
}

.pet-card__vaccine {
  margin-top: 4px;
  font-size: 12px;
  color: var(--p-text-3);
  line-height: 18px;

  &.is-expired {
    color: var(--p-danger);
    font-weight: 500;
  }
}

/* ---- 详情抽屉 ---- */
.pet-detail {
  padding: 0 4px;
}

.pet-detail__section {
  margin-bottom: 24px;

  .p-card-title {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--p-border-light);
  }
}

.pet-detail__profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.pet-detail__avatar {
  flex-shrink: 0;
  background: var(--p-primary-light);
  color: var(--p-primary);
  font-size: 26px;
}

.pet-detail__profile-info {
  flex: 1;
}

.pet-detail__profile-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--p-text-1);
  line-height: 28px;
  margin-bottom: 6px;
}

.pet-detail__profile-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pet-detail__desc {
  margin-top: 8px;
}

.p-text-danger {
  color: var(--p-danger);
  font-weight: 500;
}
</style>
