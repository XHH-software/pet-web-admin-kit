<template>
  <div class="p-page">
    <PageHeader title="预约日历">
      <div class="p-calendar-nav">
        <el-button :icon="ArrowLeft" @click="prevDay">前一天</el-button>
        <el-button @click="goToday">今天</el-button>
        <el-button :icon="ArrowRight" @click="nextDay">后一天</el-button>
        <el-date-picker
          v-model="pickerDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 160px; margin-left: 8px"
          @change="handlePickerChange"
        />
      </div>
    </PageHeader>

    <div class="p-card p-calendar-card">
      <!-- 日期标题 -->
      <div class="p-calendar-date-label">{{ dateLabel }}</div>

      <div v-loading="loading" class="p-calendar-scroll" ref="scrollRef">
        <div v-if="calendarData.length" class="p-calendar-inner">
          <!-- 左侧固定列：员工列表 -->
          <div class="p-calendar-staff-col">
            <div class="p-calendar-corner">员工</div>
            <div
              v-for="staff in calendarData"
              :key="staff.staffId"
              class="p-calendar-staff-cell"
            >
              <el-avatar :size="32" :src="staff.avatar">
                {{ staff.staffName?.charAt(0) }}
              </el-avatar>
              <div class="p-calendar-staff-info">
                <span class="p-calendar-staff-name">{{ staff.staffName }}</span>
                <el-tag
                  v-if="getLevelLabel(staff.level)"
                  size="small"
                  effect="light"
                  :type="getLevelType(staff.level)"
                >
                  {{ getLevelLabel(staff.level) }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 右侧：时间网格区域 -->
          <div class="p-calendar-grid-area">
            <!-- 时间刻度表头 -->
            <div class="p-calendar-time-header" :style="{ width: gridWidth + 'px' }">
              <span
                v-for="mark in timeMarks"
                :key="mark.label"
                class="p-calendar-time-mark"
                :style="{ left: mark.left + 'px' }"
              >{{ mark.label }}</span>
            </div>

            <!-- 网格主体 -->
            <div
              class="p-calendar-grid-body"
              :style="{ width: gridWidth + 'px', height: gridBodyHeight + 'px' }"
            >
              <!-- 纵向网格线 -->
              <div
                v-for="line in gridLines"
                :key="line.left"
                class="p-calendar-vline"
                :class="{ 'is-hour': line.isHour }"
                :style="{ left: line.left + 'px' }"
              />

              <!-- 每个员工的行 -->
              <div
                v-for="(staff, idx) in calendarData"
                :key="staff.staffId"
                class="p-calendar-grid-row"
                :style="{ top: idx * ROW_HEIGHT + 'px' }"
              >
                <!-- 空余时段 -->
                <div
                  v-for="slot in emptySlotsMap[staff.staffId]"
                  :key="'e-' + slot.index"
                  class="p-calendar-empty"
                  :style="{ left: slot.left + 'px', width: SLOT_WIDTH + 'px' }"
                  @click="openCreateDialog(staff, slot.time)"
                >
                  <span class="p-calendar-empty__text">+ 代客预约</span>
                </div>

                <!-- 已预约块 -->
                <div
                  v-for="appt in bookedSlotsMap[staff.staffId]"
                  :key="'b-' + appt.appointmentId"
                  class="p-calendar-booked"
                  :style="getBookedStyle(appt)"
                  :title="`${appt.startTime}-${appt.endTime} ${appt.petName} · ${appt.itemSummary}`"
                  @click.stop
                >
                  <div class="p-calendar-booked__time">{{ appt.startTime }}</div>
                  <div class="p-calendar-booked__detail">{{ appt.petName }} · {{ appt.itemSummary }}</div>
                </div>
              </div>

              <!-- 当前时间指示线 -->
              <div
                v-if="isToday && nowLineLeft >= 0"
                class="p-calendar-now-line"
                :style="{ left: nowLineLeft + 'px' }"
              >
                <div class="p-calendar-now-dot" />
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <EmptyState v-if="!loading && calendarData.length === 0" description="暂无员工排班数据" />
      </div>
    </div>

    <!-- 代客预约弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="代客预约"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="预约日期">
          <span class="p-form-readonly">{{ createForm.appointmentDate }}</span>
        </el-form-item>
        <el-form-item label="员工">
          <span class="p-form-readonly">{{ createForm.staffName }}</span>
        </el-form-item>
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="createForm.customerId"
            filterable
            remote
            reserve-keyword
            placeholder="搜索客户姓名/手机号"
            :remote-method="searchCustomers"
            :loading="customerSearchLoading"
            style="width: 100%"
            @change="handleCustomerChange"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="`${c.name} (${c.phone})`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="宠物" prop="petId">
          <el-select
            v-model="createForm.petId"
            placeholder="请选择宠物"
            :disabled="!createForm.customerId"
            :loading="petLoading"
            style="width: 100%"
          >
            <el-option
              v-for="p in petOptions"
              :key="p.id"
              :label="`${p.name}（${getSpeciesLabel(p.species)} ${p.breed || ''}）`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务项目" prop="serviceItemId">
          <el-select
            v-model="createForm.serviceItemId"
            placeholder="请选择服务项目"
            style="width: 100%"
            @change="handleServiceItemChange"
          >
            <el-option
              v-for="item in serviceItemOptions"
              :key="item.id"
              :label="`${item.name}（${item.duration}分钟）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-select
            v-model="createForm.startTime"
            start="09:00"
            step="00:30"
            end="19:30"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-select
            v-model="createForm.endTime"
            start="09:30"
            step="00:30"
            end="20:00"
            placeholder="选择结束时间"
            :min-time="createForm.startTime"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="p-dialog-footer-right">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="createSubmitLoading" @click="handleCreateSubmit">
            确认预约
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { STAFF_LEVEL, PET_SPECIES } from '@/constants/enums'
import { getAppointmentCalendar, createAppointment } from '@/api/appointment'
import { getCustomerPage } from '@/api/customer'
import { getPetPage } from '@/api/pet'
import { getServiceItemPage } from '@/api/serviceItem'

// ========== 常量 ==========
const DAY_START_HOUR = 9
const DAY_END_HOUR = 20
const HOUR_WIDTH = 120       // 每小时像素宽度
const SLOT_MINUTES = 30
const SLOT_WIDTH = HOUR_WIDTH / 2  // 每30分钟 = 60px
const ROW_HEIGHT = 80        // 每行高度
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR // 11
const GRID_WIDTH = TOTAL_HOURS * HOUR_WIDTH       // 1320px

// ========== 日期导航 ==========
const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const pickerDate = ref(currentDate.value)

const isToday = computed(() => currentDate.value === dayjs().format('YYYY-MM-DD'))

const dateLabel = computed(() => {
  const d = dayjs(currentDate.value)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.format('YYYY年MM月DD日')} 星期${weekDays[d.day()]}`
})

function prevDay() {
  currentDate.value = dayjs(currentDate.value).subtract(1, 'day').format('YYYY-MM-DD')
  pickerDate.value = currentDate.value
  loadCalendarData()
}

function nextDay() {
  currentDate.value = dayjs(currentDate.value).add(1, 'day').format('YYYY-MM-DD')
  pickerDate.value = currentDate.value
  loadCalendarData()
}

function goToday() {
  currentDate.value = dayjs().format('YYYY-MM-DD')
  pickerDate.value = currentDate.value
  loadCalendarData()
}

function handlePickerChange(val) {
  if (val) {
    currentDate.value = val
    loadCalendarData()
  }
}

// ========== 时间网格 ==========
const gridWidth = GRID_WIDTH

const timeMarks = computed(() => {
  const marks = []
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    marks.push({
      label: `${String(h).padStart(2, '0')}:00`,
      left: (h - DAY_START_HOUR) * HOUR_WIDTH
    })
  }
  return marks
})

const gridLines = computed(() => {
  const lines = []
  for (let i = 0; i <= TOTAL_HOURS * 2; i++) {
    lines.push({
      left: i * SLOT_WIDTH,
      isHour: i % 2 === 0
    })
  }
  return lines
})

const gridBodyHeight = computed(() => calendarData.value.length * ROW_HEIGHT)

// ========== 当前时间指示线 ==========
const nowTick = ref(Date.now())

const nowLineLeft = computed(() => {
  nowTick.value // 依赖项，驱动每分钟刷新
  const now = dayjs()
  const minutes = now.hour() * 60 + now.minute()
  const startMinutes = DAY_START_HOUR * 60
  const endMinutes = DAY_END_HOUR * 60
  if (minutes < startMinutes || minutes > endMinutes) return -1
  return (minutes - startMinutes) / 60 * HOUR_WIDTH
})

// ========== 数据加载 ==========
const loading = ref(false)
const calendarData = ref([])
const scrollRef = ref(null)

async function loadCalendarData() {
  loading.value = true
  try {
    const res = await getAppointmentCalendar({ date: currentDate.value })
    calendarData.value = res || []
    // 今天自动滚动到当前时间
    if (isToday.value) {
      requestAnimationFrame(() => scrollToNow())
    }
  } catch {
    calendarData.value = []
  } finally {
    loading.value = false
  }
}

function scrollToNow() {
  if (!scrollRef.value) return
  const now = dayjs()
  const minutes = now.hour() * 60 + now.minute()
  const startMinutes = DAY_START_HOUR * 60
  const target = (minutes - startMinutes) / 60 * HOUR_WIDTH - 200
  scrollRef.value.scrollLeft = Math.max(0, target)
}

// ========== 时段计算 ==========
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 已预约块
const bookedSlotsMap = computed(() => {
  const map = {}
  for (const staff of calendarData.value) {
    map[staff.staffId] = (staff.slots || []).filter(s => s.appointmentId)
  }
  return map
})

// 空余时段
const emptySlotsMap = computed(() => {
  const map = {}
  for (const staff of calendarData.value) {
    const booked = (staff.slots || []).filter(s => s.appointmentId)
    const slots = []
    for (let i = 0; i < TOTAL_HOURS * 2; i++) {
      const slotStart = DAY_START_HOUR * 60 + i * SLOT_MINUTES
      const slotEnd = slotStart + SLOT_MINUTES
      const overlaps = booked.some(b => {
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)
        return slotStart < bEnd && slotEnd > bStart
      })
      if (!overlaps) {
        slots.push({
          index: i,
          left: i * SLOT_WIDTH,
          time: minutesToTime(slotStart)
        })
      }
    }
    map[staff.staffId] = slots
  }
  return map
})

// 已预约块定位样式
function getBookedStyle(slot) {
  const startMin = timeToMinutes(slot.startTime)
  const endMin = timeToMinutes(slot.endTime)
  const left = (startMin - DAY_START_HOUR * 60) / 60 * HOUR_WIDTH
  const width = Math.max((endMin - startMin) / 60 * HOUR_WIDTH, SLOT_WIDTH)
  return {
    left: left + 'px',
    width: width + 'px',
    top: '6px',
    height: (ROW_HEIGHT - 12) + 'px'
  }
}

// ========== 工具函数 ==========
function getLevelLabel(level) {
  const item = STAFF_LEVEL.find(l => l.value === level)
  return item?.label || ''
}

function getLevelType(level) {
  const map = { 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level] || 'info'
}

function getSpeciesLabel(species) {
  const item = PET_SPECIES.find(s => s.value === species)
  return item?.label || ''
}

// ========== 代客预约弹窗 ==========
const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createSubmitLoading = ref(false)

const createForm = reactive({
  appointmentDate: '',
  staffId: null,
  staffName: '',
  customerId: null,
  petId: null,
  serviceItemId: null,
  startTime: '',
  endTime: '',
  remark: ''
})

const createFormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  petId: [{ required: true, message: '请选择宠物', trigger: 'change' }],
  serviceItemId: [{ required: true, message: '请选择服务项目', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

function openCreateDialog(staff, time) {
  createForm.appointmentDate = currentDate.value
  createForm.staffId = staff.staffId
  createForm.staffName = staff.staffName
  createForm.customerId = null
  createForm.petId = null
  createForm.serviceItemId = null
  createForm.startTime = time
  // 默认结束时间：开始 + 1 小时
  const startMin = timeToMinutes(time)
  createForm.endTime = minutesToTime(Math.min(startMin + 60, DAY_END_HOUR * 60))
  createForm.remark = ''

  customerOptions.value = []
  petOptions.value = []

  createDialogVisible.value = true
}

// ---------- 客户搜索 ----------
const customerSearchLoading = ref(false)
const customerOptions = ref([])

async function searchCustomers(query) {
  if (!query) {
    customerOptions.value = []
    return
  }
  customerSearchLoading.value = true
  try {
    const res = await getCustomerPage({ keyword: query, page: 1, pageSize: 20 })
    customerOptions.value = res.records || []
  } catch {
    customerOptions.value = []
  } finally {
    customerSearchLoading.value = false
  }
}

function handleCustomerChange(customerId) {
  createForm.petId = null
  petOptions.value = []
  if (customerId) {
    loadPets(customerId)
  }
}

// ---------- 宠物加载 ----------
const petLoading = ref(false)
const petOptions = ref([])

async function loadPets(customerId) {
  petLoading.value = true
  try {
    const res = await getPetPage({ customerId, page: 1, pageSize: 50 })
    petOptions.value = res.records || []
  } catch {
    petOptions.value = []
  } finally {
    petLoading.value = false
  }
}

// ---------- 服务项目 ----------
const serviceItemOptions = ref([])

async function loadServiceItems() {
  try {
    const res = await getServiceItemPage({ page: 1, pageSize: 100, status: 1 })
    serviceItemOptions.value = res.records || []
  } catch {
    serviceItemOptions.value = []
  }
}

function handleServiceItemChange(itemId) {
  const item = serviceItemOptions.value.find(i => i.id === itemId)
  if (item && item.duration && createForm.startTime) {
    const startMin = timeToMinutes(createForm.startTime)
    createForm.endTime = minutesToTime(Math.min(startMin + item.duration, DAY_END_HOUR * 60))
  }
}

// ---------- 提交预约 ----------
async function handleCreateSubmit() {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  createSubmitLoading.value = true
  try {
    await createAppointment({
      appointmentDate: createForm.appointmentDate,
      staffId: createForm.staffId,
      customerId: createForm.customerId,
      petId: createForm.petId,
      serviceItemId: createForm.serviceItemId,
      startTime: createForm.startTime,
      endTime: createForm.endTime,
      remark: createForm.remark
    })
    ElMessage.success('预约成功')
    createDialogVisible.value = false
    loadCalendarData()
  } finally {
    createSubmitLoading.value = false
  }
}

// ========== 定时器：每分钟刷新当前时间线 ==========
let nowTimer = null

onMounted(() => {
  loadCalendarData()
  loadServiceItems()
  nowTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 60000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>

<style scoped lang="scss">
/* ---- 日期导航 ---- */
.p-calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---- 日历卡片 ---- */
.p-calendar-card {
  padding: 0;
  overflow: hidden;
}

.p-calendar-date-label {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--p-text-1);
  border-bottom: 1px solid var(--p-border-light);
}

/* ---- 滚动容器 ---- */
.p-calendar-scroll {
  overflow: auto;
  max-height: calc(100vh - 240px);
  min-height: 400px;
}

.p-calendar-inner {
  display: inline-flex;
  min-width: 100%;
}

/* ---- 左侧员工列 ---- */
.p-calendar-staff-col {
  width: 160px;
  min-width: 160px;
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--p-bg-card);
  border-right: 2px solid var(--p-border);
}

.p-calendar-corner {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--p-text-2);
  border-bottom: 1px solid var(--p-border);
  position: sticky;
  top: 0;
  z-index: 11;
  background: var(--p-bg-card);
}

.p-calendar-staff-cell {
  height: 80px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--p-border-light);
}

.p-calendar-staff-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.p-calendar-staff-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--p-text-1);
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 右侧网格区域 ---- */
.p-calendar-grid-area {
  flex: 1;
  min-width: 0;
}

.p-calendar-time-header {
  height: 44px;
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--p-bg-card);
  border-bottom: 1px solid var(--p-border);
  overflow: hidden;
}

.p-calendar-time-mark {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: var(--p-text-3);
  white-space: nowrap;
  user-select: none;

  &:first-child {
    transform: translate(0, -50%);
  }
}

/* ---- 网格主体 ---- */
.p-calendar-grid-body {
  position: relative;
}

.p-calendar-vline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--p-border-light);
  pointer-events: none;
  z-index: 0;

  &.is-hour {
    background: var(--p-border);
  }
}

.p-calendar-grid-row {
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;
  border-bottom: 1px solid var(--p-border-light);
}

/* ---- 空余时段 ---- */
.p-calendar-empty {
  position: absolute;
  top: 0;
  bottom: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border-right: 1px solid transparent;
  transition: background 0.15s;

  &:hover {
    background: var(--p-primary-light);

    .p-calendar-empty__text {
      opacity: 1;
    }
  }
}

.p-calendar-empty__text {
  opacity: 0;
  font-size: 12px;
  color: var(--p-primary);
  white-space: nowrap;
  transition: opacity 0.15s;
  pointer-events: none;
  font-weight: 500;
}

/* ---- 已预约块 ---- */
.p-calendar-booked {
  position: absolute;
  z-index: 2;
  background: var(--p-primary-light);
  border-left: 3px solid var(--p-primary);
  border-radius: var(--p-radius-sm);
  padding: 4px 8px;
  overflow: hidden;
  cursor: default;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: var(--p-shadow-popup);
  }
}

.p-calendar-booked__time {
  font-size: 12px;
  font-weight: 600;
  color: var(--p-primary);
  line-height: 18px;
  white-space: nowrap;
}

.p-calendar-booked__detail {
  font-size: 12px;
  color: var(--p-text-2);
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- 当前时间线 ---- */
.p-calendar-now-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--p-danger);
  z-index: 4;
  pointer-events: none;
}

.p-calendar-now-dot {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--p-danger);
}

/* ---- 只读文本 ---- */
.p-form-readonly {
  font-size: 14px;
  color: var(--p-text-1);
  line-height: 22px;
}

/* ---- 弹窗底部 ---- */
.p-dialog-footer-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
