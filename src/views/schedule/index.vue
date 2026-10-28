<template>
  <div class="p-page">
    <PageHeader title="排班管理" />

    <!-- 周导航 -->
    <div class="p-card">
      <div class="p-week-nav">
        <div class="p-week-nav__left">
          <el-button :icon="ArrowLeft" @click="prevWeek">上一周</el-button>
          <span class="p-week-nav__range">{{ weekLabel }}</span>
          <el-button :icon="ArrowRight" @click="nextWeek">下一周</el-button>
          <el-button @click="goToday">今天</el-button>
        </div>
        <div class="p-week-nav__right">
          <el-button @click="handleCopyLastWeek" :loading="copyLoading">
            复制上周排班
          </el-button>
          <el-button type="primary" @click="openBatchDialog">
            批量排班
          </el-button>
        </div>
      </div>

      <!-- 排班表格 -->
      <div class="p-schedule-table" v-loading="loading">
        <!-- 表头 -->
        <div class="p-schedule-header">
          <div class="p-schedule-staff-col">员工</div>
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="p-schedule-day-col"
            :class="{ 'is-today': day.isToday }"
          >
            <div class="p-schedule-day__week">{{ day.weekLabel }}</div>
            <div class="p-schedule-day__date">{{ day.dateLabel }}</div>
          </div>
        </div>

        <!-- 数据行 -->
        <div v-if="staffRows.length" class="p-schedule-body">
          <div
            v-for="staff in staffRows"
            :key="staff.staffId"
            class="p-schedule-row"
          >
            <div class="p-schedule-staff-col">
              <div class="p-staff-info">
                <el-avatar :size="32" :src="staff.avatar">
                  {{ staff.staffName?.charAt(0) }}
                </el-avatar>
                <div class="p-staff-info__text">
                  <span class="p-staff-info__name">{{ staff.staffName }}</span>
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
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="p-schedule-day-col"
              :class="{ 'is-today': day.isToday }"
            >
              <ScheduleCell
                :day-data="getDayData(staff, day.date)"
                @click="openScheduleDialog(staff, day)"
              />
            </div>
          </div>
        </div>
        <EmptyState v-else description="暂无员工数据" />
      </div>
    </div>

    <!-- 排班编辑弹窗 -->
    <el-dialog
      v-model="scheduleDialogVisible"
      :title="scheduleDialogTitle"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="scheduleFormRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="员工">
          <span class="p-form-readonly">{{ scheduleForm.staffName }}</span>
        </el-form-item>
        <el-form-item label="日期">
          <span class="p-form-readonly">{{ scheduleForm.date }}</span>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-select
            v-model="scheduleForm.startTime"
            start="09:00"
            step="00:30"
            end="12:00"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-select
            v-model="scheduleForm.endTime"
            start="13:00"
            step="00:30"
            end="21:00"
            placeholder="选择结束时间"
            :min-time="scheduleForm.startTime"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="scheduleForm.status">
            <el-radio :value="1">可约</el-radio>
            <el-radio :value="2">休息</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-popconfirm
          v-if="scheduleForm.scheduleId"
          title="确定删除该排班？"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="handleDeleteSchedule"
        >
          <template #reference>
            <el-button type="danger" plain>删除排班</el-button>
          </template>
        </el-popconfirm>
        <div class="p-dialog-footer-right">
          <el-button @click="scheduleDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="scheduleSubmitLoading" @click="handleSaveSchedule">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量排班弹窗 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量排班"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="batchFormRef"
        :model="batchForm"
        :rules="batchFormRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="选择员工" prop="staffIds">
          <el-select
            v-model="batchForm.staffIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择员工"
            style="width: 100%"
          >
            <el-option
              v-for="item in staffSelectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="batchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-select
            v-model="batchForm.startTime"
            start="09:00"
            step="00:30"
            end="12:00"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-select
            v-model="batchForm.endTime"
            start="13:00"
            step="00:30"
            end="21:00"
            placeholder="选择结束时间"
            :min-time="batchForm.startTime"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="batchForm.status">
            <el-radio :value="1">可约</el-radio>
            <el-radio :value="2">休息</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitLoading" @click="handleBatchSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import ScheduleCell from './ScheduleCell.vue'
import { SCHEDULE_STATUS, STAFF_LEVEL } from '@/constants/enums'
import {
  getScheduleWeek,
  updateSchedule,
  deleteSchedule,
  batchCreateSchedule,
  copyLastWeekSchedule
} from '@/api/schedule'
import { getStaffList } from '@/api/staff'

// ========== 周导航 ==========
const currentMonday = ref(dayjs().startOf('week').add(1, 'day')) // dayjs 默认周日开始，+1 得到周一

const weekDays = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return Array.from({ length: 7 }, (_, i) => {
    const d = currentMonday.value.add(i, 'day')
    const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return {
      date: d.format('YYYY-MM-DD'),
      dateLabel: d.format('MM-DD'),
      weekLabel: weekLabels[i],
      isToday: d.format('YYYY-MM-DD') === today
    }
  })
})

const weekLabel = computed(() => {
  const start = currentMonday.value.format('YYYY-MM-DD')
  const end = currentMonday.value.add(6, 'day').format('YYYY-MM-DD')
  return `${start} ~ ${end}`
})

function prevWeek() {
  currentMonday.value = currentMonday.value.subtract(7, 'day')
  loadScheduleData()
}

function nextWeek() {
  currentMonday.value = currentMonday.value.add(7, 'day')
  loadScheduleData()
}

function goToday() {
  currentMonday.value = dayjs().startOf('week').add(1, 'day')
  loadScheduleData()
}

// ========== 数据加载 ==========
const loading = ref(false)
const staffRows = ref([])

async function loadScheduleData() {
  loading.value = true
  try {
    const res = await getScheduleWeek({ startDate: currentMonday.value.format('YYYY-MM-DD') })
    staffRows.value = res || []
  } catch {
    staffRows.value = []
  } finally {
    loading.value = false
  }
}

// 根据 staff + date 找到对应的 day 数据
function getDayData(staff, date) {
  if (!staff.days) return null
  return staff.days.find(d => d.date === date) || null
}

// ========== 职级标签 ==========
function getLevelLabel(level) {
  const item = STAFF_LEVEL.find(l => l.value === level)
  return item?.label || ''
}

function getLevelType(level) {
  const map = { 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level] || 'info'
}

// ========== 排班编辑弹窗 ==========
const scheduleDialogVisible = ref(false)
const scheduleDialogTitle = ref('排班')
const scheduleFormRef = ref(null)
const scheduleSubmitLoading = ref(false)

const scheduleForm = reactive({
  scheduleId: null,
  staffId: null,
  staffName: '',
  date: '',
  startTime: '',
  endTime: '',
  status: 1
})

const endTimeValidator = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请选择结束时间'))
    return
  }
  if (scheduleForm.startTime && value <= scheduleForm.startTime) {
    callback(new Error('结束时间必须晚于开始时间'))
    return
  }
  callback()
}

const scheduleFormRules = {
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, validator: endTimeValidator, trigger: 'change' }]
}

function openScheduleDialog(staff, day) {
  const dayData = getDayData(staff, day.date)
  scheduleForm.staffId = staff.staffId
  scheduleForm.staffName = staff.staffName
  scheduleForm.date = day.date
  scheduleForm.scheduleId = dayData?.scheduleId || null
  scheduleForm.startTime = dayData?.startTime || ''
  scheduleForm.endTime = dayData?.endTime || ''
  scheduleForm.status = dayData?.status ?? 1
  scheduleDialogTitle.value = dayData?.scheduleId ? '编辑排班' : '新增排班'
  scheduleDialogVisible.value = true
}

async function handleSaveSchedule() {
  const valid = await scheduleFormRef.value.validate().catch(() => false)
  if (!valid) return

  scheduleSubmitLoading.value = true
  try {
    await updateSchedule(scheduleForm.scheduleId || 'create', {
      staffId: scheduleForm.staffId,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      status: scheduleForm.status
    })
    ElMessage.success('保存成功')
    scheduleDialogVisible.value = false
    loadScheduleData()
  } finally {
    scheduleSubmitLoading.value = false
  }
}

async function handleDeleteSchedule() {
  if (!scheduleForm.scheduleId) return
  try {
    await deleteSchedule(scheduleForm.scheduleId)
    ElMessage.success('删除成功')
    scheduleDialogVisible.value = false
    loadScheduleData()
  } catch {
    // ignore
  }
}

// ========== 批量排班 ==========
const batchDialogVisible = ref(false)
const batchFormRef = ref(null)
const batchSubmitLoading = ref(false)
const staffSelectOptions = ref([])

const batchForm = reactive({
  staffIds: [],
  dateRange: null,
  startTime: '',
  endTime: '',
  status: 1
})

const batchEndTimeValidator = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请选择结束时间'))
    return
  }
  if (batchForm.startTime && value <= batchForm.startTime) {
    callback(new Error('结束时间必须晚于开始时间'))
    return
  }
  callback()
}

const batchFormRules = {
  staffIds: [{ required: true, message: '请选择员工', trigger: 'change', type: 'array', min: 1 }],
  dateRange: [{ required: true, message: '请选择日期范围', trigger: 'change', type: 'array' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, validator: batchEndTimeValidator, trigger: 'change' }]
}

function openBatchDialog() {
  batchForm.staffIds = []
  batchForm.dateRange = null
  batchForm.startTime = ''
  batchForm.endTime = ''
  batchForm.status = 1
  batchDialogVisible.value = true
}

async function handleBatchSubmit() {
  const valid = await batchFormRef.value.validate().catch(() => false)
  if (!valid) return

  batchSubmitLoading.value = true
  try {
    await batchCreateSchedule({
      staffIds: batchForm.staffIds,
      startDate: batchForm.dateRange[0],
      endDate: batchForm.dateRange[1],
      startTime: batchForm.startTime,
      endTime: batchForm.endTime,
      status: batchForm.status
    })
    ElMessage.success('批量排班成功')
    batchDialogVisible.value = false
    loadScheduleData()
  } finally {
    batchSubmitLoading.value = false
  }
}

// ========== 复制上周 ==========
const copyLoading = ref(false)

async function handleCopyLastWeek() {
  try {
    await ElMessageBox.confirm(
      `将复制上周（${dayjs(currentMonday.value).subtract(7, 'day').format('MM-DD')} ~ ${dayjs(currentMonday.value).subtract(1, 'day').format('MM-DD')}）的排班到本周（${weekLabel.value}），确认继续？`,
      '复制上周排班',
      { type: 'info', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  copyLoading.value = true
  try {
    await copyLastWeekSchedule({ startDate: currentMonday.value.format('YYYY-MM-DD') })
    ElMessage.success('复制成功')
    loadScheduleData()
  } finally {
    copyLoading.value = false
  }
}

// ========== 加载员工下拉 ==========
async function loadStaffOptions() {
  try {
    const res = await getStaffList()
    staffSelectOptions.value = (res || []).map(s => ({
      id: s.id,
      name: s.name
    }))
  } catch {
    staffSelectOptions.value = []
  }
}

// ========== 初始化 ==========
onMounted(() => {
  loadScheduleData()
  loadStaffOptions()
})
</script>

<style scoped lang="scss">
/* ---- 周导航 ---- */
.p-week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.p-week-nav__left,
.p-week-nav__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-week-nav__range {
  font-size: 15px;
  font-weight: 600;
  color: var(--p-text-1);
  min-width: 200px;
  text-align: center;
}

/* ---- 排班表格 ---- */
.p-schedule-table {
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  overflow: hidden;
}

.p-schedule-header {
  display: flex;
  background: var(--p-bg-page);
  border-bottom: 1px solid var(--p-border);
}

.p-schedule-body {
  .p-schedule-row {
    display: flex;
    border-bottom: 1px solid var(--p-border-light);

    &:last-child {
      border-bottom: none;
    }
  }
}

.p-schedule-staff-col {
  width: 180px;
  min-width: 180px;
  padding: 12px;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--p-border-light);
}

.p-schedule-day-col {
  flex: 1;
  min-width: 0;
  padding: 8px;
  text-align: center;
  border-right: 1px solid var(--p-border-light);

  &:last-child {
    border-right: none;
  }

  &.is-today {
    background: var(--p-primary-light);
  }
}

.p-schedule-header .p-schedule-day-col {
  padding: 10px 8px;
}

.p-schedule-day__week {
  font-size: 13px;
  color: var(--p-text-2);
  line-height: 20px;
}

.p-schedule-day__date {
  font-size: 14px;
  font-weight: 600;
  color: var(--p-text-1);
  line-height: 22px;
}

/* ---- 员工信息 ---- */
.p-staff-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.p-staff-info__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.p-staff-info__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--p-text-1);
  line-height: 20px;
}

/* ---- 表单只读 ---- */
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
