# pet-web-admin-kit

宠物服务预约平台 · 商家管理端（Vue 3 + Element Plus + Vite）。

配套项目：

- 后端：[pet-service-platform](https://github.com/XHH-software/pet-service-platform)
- 小程序端：[pet-wx-users-kit](https://github.com/XHH-software/pet-wx-users-kit)

## 功能模块

- **工作台**：今日预约、待服务、今日营业额、技师出勤、近 7 日趋势、技师排行
- **预约管理**：分页筛选、详情抽屉、核销、完成、取消、代客预约
- **预约日历**：按员工 × 时段查看当天预约，点击空白时段代客下单
- **排班管理**：周视图、单日排班、批量排班、复制上周
- **服务项目 / 服务套餐 / 分类**：CRUD、上下架、图片上传
- **宠物档案**：客户列表 → 宠物列表 → 宠物详情与预约记录
- **员工管理**：新增、编辑、启用/停用、擅长项目
- **评价管理**：评分筛选、商家回复
- **门店设置**：门店信息、营业状态、营业时间
- **账号**：登录、退出、修改密码

## 技术栈

| 组件 | 说明 |
| --- | --- |
| Vue | 3.4 |
| Vite | 5.4 |
| Element Plus | 2.8 |
| Pinia | 2.2 |
| Vue Router | 4.4 |
| Axios | 1.7 |
| ECharts | 5.5 |
| Day.js | 1.11 |

## 快速开始

要求：Node.js 18+，并先启动后端 `pet-service-platform`（默认 `http://localhost:8080`）。

```bash
npm install
npm run dev
```

访问 `http://localhost:8081`。

开发环境通过 Vite 代理访问后端：

- 前端请求前缀：`/api`
- 代理目标：`http://localhost:8080`
- 转发时去掉 `/api`

配置见 `vite.config.js` 与 `.env.development`。

### 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `123456` | 店长 |
| `13800000002` | `123456` | 美容师 |

## 构建

```bash
npm run build
npm run preview
```

## 目录结构

```
src/
├─ api/            # 接口封装（auth / appointment / schedule / service ...）
├─ assets/styles/  # reset / variables / common
├─ components/     # 通用组件（PageHeader / StatusTag / 上传等）
├─ constants/      # 预约状态、支付状态等枚举
├─ layout/         # 侧边栏、Navbar、修改密码
├─ router/         # 路由与登录守卫
├─ stores/         # Pinia（登录态持久化）
├─ views/          # 业务页面
├─ App.vue
└─ main.js
```

## 接口文档

- [接口清单](docs/api-reference.md)
- [业务说明](docs/business-description.md)

后端统一响应：

```json
{ "code": 1, "msg": null, "data": {} }
```

- `code=1` 成功
- `code=0` 业务失败
- `code=401` 未登录 / 登录过期

管理端请求头使用 `token: <jwt>`。
