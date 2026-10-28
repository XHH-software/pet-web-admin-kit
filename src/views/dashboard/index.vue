<template>
  <div class="p-page">
    <PageHeader title="工作台" />

    <!-- A. 指标卡片 -->
    <el-row :gutter="16" class="p-metric-row">
      <el-col :span="6">
        <div class="p-card p-metric-card">
          <div class="p-metric-card__header">
            <span class="p-metric-card__title">今日预约</span>
            <el-icon class="p-metric-card__icon" style="color: var(--p-primary)">
              <Calendar />
            </el-icon>
          </div>
          <div class="p-metric-card__body">
            <span class="p-metric">{{ summary.todayAppointmentCount ?? '-' }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="p-card p-metric-card">
          <div class="p-metric-card__header">
            <span class="p-metric-card__title">待服务</span>
            <el-icon class="p-metric-card__icon" style="color: var(--p-warning)">
              <Clock />
            </el-icon>
          </div>
          <div class="p-metric-card__body">
            <span class="p-metric">{{ summary.todayPendingCount ?? '-' }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="p-card p-metric-card">
          <div class="p-metric-card__header">
            <span class="p-metric-card__title">今日营业额</span>
            <el-icon class="p-metric-card__icon" style="color: var(--p-success)">
              <Money />
            </el-icon>
          </div>
          <div class="p-metric-card__body">
            <span class="p-metric">¥{{ formatDecimal(summary.todayTurnover) }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="p-card p-metric-card">
          <div class="p-metric-card__header">
            <span class="p-metric-card__title">技师出勤</span>
            <el-icon class="p-metric-card__icon" style="color: var(--p-info)">
              <User />
            </el-icon>
          </div>
          <div class="p-metric-card__body">
            <span class="p-metric">
              {{ summary.staffOnDutyCount ?? '-' }}
              <span class="p-metric-card__divider">/</span>
              {{ summary.staffTotalCount ?? '-' }}
            </span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- B. 7日趋势图 -->
    <div class="p-card">
      <h3 class="p-card-title">近7日趋势</h3>
      <div ref="trendChartRef" class="p-trend-chart"></div>
    </div>

    <!-- C + D: 技师排行 & 今日预约 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="p-card">
          <h3 class="p-card-title">技师排行 Top 5</h3>
          <el-table :data="staffRankData" v-loading="rankLoading" stripe style="width: 100%">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="staffName" label="技师" min-width="100" show-overflow-tooltip />
            <el-table-column prop="appointmentCount" label="预约数" width="90" align="center" />
            <el-table-column label="平均评分" width="100" align="center">
              <template #default="{ row }">
                {{ row.avgScore != null ? Number(row.avgScore).toFixed(1) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="营业额" width="110" align="right">
              <template #default="{ row }">
                <span class="p-amount">¥{{ formatDecimal(row.turnover) }}</span>
              </template>
            </el-table-column>
            <template #empty>
              <EmptyState />
            </template>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="p-card">
          <h3 class="p-card-title">今日预约</h3>
          <el-table :data="todayAppointments" v-loading="todayLoading" stripe style="width: 100%">
            <el-table-column label="时间" width="120">
              <template #default="{ row }">
                {{ row.startTime }}-{{ row.endTime }}
              </template>
            </el-table-column>
            <el-table-column prop="petName" label="宠物" min-width="100" show-overflow-tooltip />
            <el-table-column prop="itemSummary" label="服务项目" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <StatusTag :value="row.status" dict="appointment" />
              </template>
            </el-table-column>
            <template #empty>
              <EmptyState />
            </template>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Calendar, Clock, Money, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getDashboardSummary, getDashboardTrend, getStaffRank } from '@/api/dashboard'
import { getAppointmentPage } from '@/api/appointment'

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

// ---------- 汇总数据 ----------
const summary = ref({})

async function loadSummary() {
  try {
    const res = await getDashboardSummary()
    summary.value = res || {}
  } catch {
    summary.value = {}
  }
}

// ---------- 趋势图 ----------
const trendChartRef = ref(null)
let trendChart = null

async function loadTrend() {
  try {
    const res = await getDashboardTrend()
    const data = res || []
    renderTrendChart(data)
  } catch {
    renderTrendChart([])
  }
}

function renderTrendChart(data) {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const dates = data.map(item => dayjs(item.date).format('MM/DD'))
  const orderCounts = data.map(item => item.orderCount)
  const turnovers = data.map(item => item.turnover)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单数', '营业额'],
      bottom: 0
    },
    grid: {
      left: 50,
      right: 60,
      top: 16,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: { color: '#86909C', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5' } },
        axisLabel: { color: '#86909C' }
      },
      {
        type: 'value',
        name: '营业额(¥)',
        nameTextStyle: { color: '#86909C', fontSize: 12 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#86909C' }
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 0,
        data: orderCounts,
        barWidth: 24,
        itemStyle: {
          color: '#FF7A45',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '营业额',
        type: 'line',
        yAxisIndex: 1,
        data: turnovers,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#52C41A', width: 2 },
        itemStyle: { color: '#52C41A' }
      }
    ]
  })
}

function handleResize() {
  trendChart?.resize()
}

// ---------- 技师排行 ----------
const staffRankData = ref([])
const rankLoading = ref(false)

async function loadStaffRank() {
  rankLoading.value = true
  try {
    const res = await getStaffRank()
    staffRankData.value = (res || []).slice(0, 5)
  } catch {
    staffRankData.value = []
  } finally {
    rankLoading.value = false
  }
}

// ---------- 今日预约 ----------
const todayAppointments = ref([])
const todayLoading = ref(false)

async function loadTodayAppointments() {
  todayLoading.value = true
  try {
    const res = await getAppointmentPage({
      appointmentDate: 'today',
      pageSize: 5,
      page: 1
    })
    todayAppointments.value = res.records || []
  } catch {
    todayAppointments.value = []
  } finally {
    todayLoading.value = false
  }
}

// ---------- 工具函数 ----------
function formatDecimal(value) {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2)
}

// ---------- 生命周期 ----------
onMounted(async () => {
  await loadSummary()
  await nextTick()
  loadTrend()
  loadStaffRank()
  loadTodayAppointments()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  trendChart = null
})
</script>

<style scoped lang="scss">
.p-metric-row {
  margin-bottom: 16px;
}

.p-metric-card {
  display: flex;
  flex-direction: column;
  min-height: 110px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 13px;
    color: var(--p-text-3);
    line-height: 20px;
  }

  &__icon {
    font-size: 24px;
    opacity: 0.2;
  }

  &__body {
    margin-top: 8px;
  }

  &__divider {
    font-size: 18px;
    font-weight: 400;
    color: var(--p-text-3);
    margin: 0 2px;
  }
}

.p-trend-chart {
  width: 100%;
  height: 320px;
}
</style>
