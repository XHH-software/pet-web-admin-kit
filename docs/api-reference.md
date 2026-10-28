# 宠物服务预约平台 · 管理端接口文档

> 本文档基于前端已实现的页面和 API 调用，供后端开发参考。
> 前端项目位置：`D:\pet-web-admin-kit`

---

## 目录

1. [通用约定](#1-通用约定)
2. [认证模块](#2-认证模块)
3. [员工管理](#3-员工管理)
4. [分类管理](#4-分类管理)
5. [服务项目管理](#5-服务项目管理)
6. [服务套餐管理](#6-服务套餐管理)
7. [排班管理](#7-排班管理)
8. [预约管理](#8-预约管理)
9. [客户/宠物档案](#9-客户宠物档案)
10. [评价管理](#10-评价管理)
11. [工作台统计](#11-工作台统计)
12. [门店设置](#12-门店设置)
13. [通用接口](#13-通用接口)
14. [数据字典](#14-数据字典)
15. [数据库表设计建议](#15-数据库表设计建议)

---

## 1. 通用约定

### 1.1 基础路径

- 开发环境：`http://localhost:8080`（前端通过 Vite proxy 将 `/api` 转发到此地址，并去掉 `/api` 前缀）
- 所有接口以 `/admin/` 开头

### 1.2 统一响应体

```json
{
  "code": 1,
  "msg": null,
  "data": {}
}
```

| code | 含义 |
|------|------|
| 1 | 成功 |
| 0 | 业务失败（msg 包含错误信息） |
| 401 | 未登录 / token 过期 |

### 1.3 分页约定

**请求参数**：`page`（默认 1）、`pageSize`（默认 10，可选 10/20/50）

**响应格式**：
```json
{
  "code": 1,
  "msg": null,
  "data": {
    "total": 137,
    "records": []
  }
}
```

> **注意**：字段名固定为 `total` + `records`，不要用 `list`/`rows`/`items`。

### 1.4 认证方式

请求头携带 `token` 字段：
```
token: eyJhbGciOiJIUzI1NiJ9...
```

### 1.5 日期时间格式

- 日期：`YYYY-MM-DD`（如 `2026-11-05`）
- 时刻：`HH:mm`（如 `14:00`）
- 完整时间：`YYYY-MM-DD HH:mm:ss`（如 `2026-11-04 20:13:22`）
- 金额：保留两位小数

---

## 2. 认证模块

### 2.1 员工登录

```
POST /admin/staff/login
```

**请求体**：
```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**响应 data**：
```json
{
  "id": 1,
  "name": "张三",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**业务逻辑**：
- 校验账号密码
- 校验员工状态为启用（status=1）
- 生成 JWT token，建议有效期 7 天
- 返回员工基本信息 + token

### 2.2 退出登录

```
POST /admin/staff/logout
```

**请求头**：携带 token

**响应 data**：`null`

**业务逻辑**：
- 将 token 加入黑名单（如使用 Redis）
- 或简单实现：前端清除 token 即可，后端无需处理

### 2.3 修改密码

```
PUT /admin/staff/password
```

**请求体**：
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**响应 data**：`null`

**业务逻辑**：
- 通过 token 获取当前登录员工
- 校验旧密码
- 更新新密码（需加密存储）

---

## 3. 员工管理

### 3.1 员工分页列表

```
GET /admin/staff/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页条数，默认 10 |
| name | string | 否 | 姓名模糊搜索 |
| position | int | 否 | 职位筛选 |
| status | int | 否 | 状态筛选（1启用/0停用） |

**响应 data**：
```json
{
  "total": 5,
  "records": [
    {
      "id": 1,
      "name": "张三",
      "avatar": "https://xxx/avatar.jpg",
      "phone": "13800138000",
      "position": 2,
      "level": 2,
      "specialtyItems": [
        { "id": 1, "name": "中型犬基础洗护" },
        { "id": 3, "name": "精剪造型" }
      ],
      "status": 1,
      "createTime": "2026-10-01 10:00:00"
    }
  ]
}
```

### 3.2 员工下拉列表

```
GET /admin/staff/list
```

**请求参数**：无

**响应 data**：
```json
[
  { "id": 1, "name": "张三" },
  { "id": 2, "name": "李四" }
]
```

> 用于排班、预约等页面的下拉选择。只返回启用状态的员工。

### 3.3 员工详情

```
GET /admin/staff/{id}
```

**响应 data**：同 3.1 单条记录结构

### 3.4 新增员工

```
POST /admin/staff
```

**请求体**：
```json
{
  "name": "王五",
  "avatar": "https://xxx/avatar.jpg",
  "phone": "13900139000",
  "password": "123456",
  "position": 2,
  "level": 1,
  "specialtyItemIds": [1, 3]
}
```

**响应 data**：`null`

**业务逻辑**：
- 手机号唯一校验
- 密码加密存储
- 默认状态为启用

### 3.5 编辑员工

```
PUT /admin/staff
```

**请求体**：
```json
{
  "id": 1,
  "name": "张三",
  "avatar": "https://xxx/avatar-new.jpg",
  "phone": "13800138000",
  "position": 2,
  "level": 3,
  "specialtyItemIds": [1, 2, 3]
}
```

> 编辑时不传 password 字段，不修改密码。

**响应 data**：`null`

### 3.6 修改员工状态

```
POST /admin/staff/status/{status}
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数，员工 ID |

**响应 data**：`null`

---

## 4. 分类管理

### 4.1 分类列表（下拉用）

```
GET /admin/category/list
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | int | 否 | 1=服务项目分类，2=服务套餐分类 |

**响应 data**：
```json
[
  { "id": 1, "name": "洗护", "type": 1, "sort": 1 },
  { "id": 2, "name": "美容", "type": 1, "sort": 2 }
]
```

### 4.2 分类分页列表

```
GET /admin/category/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| type | int | 是 | 1/2 |
| name | string | 否 | 名称模糊搜索 |
| status | int | 否 | 状态筛选 |

**响应 data**：
```json
{
  "total": 5,
  "records": [
    {
      "id": 1,
      "name": "洗护",
      "type": 1,
      "sort": 1,
      "status": 1,
      "createTime": "2026-10-01 10:00:00"
    }
  ]
}
```

### 4.3 新增分类

```
POST /admin/category
```

**请求体**：
```json
{
  "name": "保健",
  "type": 1,
  "sort": 3
}
```

**响应 data**：`null`

### 4.4 编辑分类

```
PUT /admin/category
```

**请求体**：
```json
{
  "id": 1,
  "name": "基础洗护",
  "sort": 1
}
```

**响应 data**：`null`

### 4.5 删除分类

```
DELETE /admin/category
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

**业务逻辑**：
- 检查是否有关联的服务项目/套餐，有则不允许删除

### 4.6 修改分类状态

```
POST /admin/category/status/{status}
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

---

## 5. 服务项目管理

### 5.1 服务项目分页列表

```
GET /admin/service-item/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| name | string | 否 | 名称模糊搜索 |
| categoryId | long | 否 | 分类 ID |
| status | int | 否 | 状态筛选 |

**响应 data**：
```json
{
  "total": 10,
  "records": [
    {
      "id": 1,
      "name": "中型犬基础洗护",
      "image": "https://xxx/service1.jpg",
      "categoryId": 1,
      "categoryName": "洗护",
      "price": 168.00,
      "duration": 60,
      "petSizeLimit": 2,
      "dailyLimit": 10,
      "description": "包含洗澡、吹干、基础修剪",
      "status": 1,
      "createTime": "2026-10-01 10:00:00"
    }
  ]
}
```

### 5.2 服务项目详情

```
GET /admin/service-item/{id}
```

**响应 data**：同 5.1 单条结构

### 5.3 新增服务项目

```
POST /admin/service-item
```

**请求体**：
```json
{
  "name": "中型犬基础洗护",
  "image": "https://xxx/service1.jpg",
  "categoryId": 1,
  "price": 168.00,
  "duration": 60,
  "petSizeLimit": 2,
  "dailyLimit": 10,
  "description": "包含洗澡、吹干、基础修剪",
  "status": 1
}
```

**响应 data**：`null`

### 5.4 编辑服务项目

```
PUT /admin/service-item
```

**请求体**：
```json
{
  "id": 1,
  "name": "中型犬基础洗护",
  "image": "https://xxx/service1-new.jpg",
  "categoryId": 1,
  "price": 188.00,
  "duration": 60,
  "petSizeLimit": 2,
  "dailyLimit": 10,
  "description": "包含洗澡、吹干、基础修剪、指甲修剪",
  "status": 1
}
```

**响应 data**：`null`

### 5.5 删除服务项目

```
DELETE /admin/service-item
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

**业务逻辑**：
- 检查是否被套餐引用，有则不允许删除

### 5.6 修改服务项目状态

```
POST /admin/service-item/status/{status}
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

---

## 6. 服务套餐管理

### 6.1 套餐分页列表

```
GET /admin/package/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| name | string | 否 | 名称模糊搜索 |
| categoryId | long | 否 | 分类 ID |
| status | int | 否 | 状态筛选 |

**响应 data**：
```json
{
  "total": 3,
  "records": [
    {
      "id": 1,
      "name": "尊享洗护套餐",
      "image": "https://xxx/package1.jpg",
      "categoryId": 1,
      "categoryName": "洗护",
      "originalPrice": 336.00,
      "sellingPrice": 288.00,
      "dailyLimit": 5,
      "description": "两次基础洗护 + 一次精剪",
      "status": 1,
      "details": [
        { "serviceItemId": 1, "serviceName": "中型犬基础洗护", "quantity": 2, "duration": 60 },
        { "serviceItemId": 3, "serviceName": "精剪造型", "quantity": 1, "duration": 90 }
      ],
      "createTime": "2026-10-01 10:00:00"
    }
  ]
}
```

### 6.2 套餐详情

```
GET /admin/package/{id}
```

**响应 data**：同 6.1 单条结构

### 6.3 新增套餐

```
POST /admin/package
```

**请求体**：
```json
{
  "name": "尊享洗护套餐",
  "image": "https://xxx/package1.jpg",
  "categoryId": 1,
  "originalPrice": 336.00,
  "sellingPrice": 288.00,
  "dailyLimit": 5,
  "description": "两次基础洗护 + 一次精剪",
  "status": 1,
  "details": [
    { "serviceItemId": 1, "quantity": 2 },
    { "serviceItemId": 3, "quantity": 1 }
  ]
}
```

**响应 data**：`null`

**业务逻辑**：
- 根据 details 中的 serviceItemId 和 quantity 计算 originalPrice（各项目价格 × 数量之和）
- 或 originalPrice 由前端传入，后端存储

### 6.4 编辑套餐

```
PUT /admin/package
```

**请求体**：
```json
{
  "id": 1,
  "name": "尊享洗护套餐",
  "image": "https://xxx/package1.jpg",
  "categoryId": 1,
  "originalPrice": 336.00,
  "sellingPrice": 268.00,
  "dailyLimit": 5,
  "description": "两次基础洗护 + 一次精剪",
  "status": 1,
  "details": [
    { "serviceItemId": 1, "quantity": 2 },
    { "serviceItemId": 3, "quantity": 1 }
  ]
}
```

**响应 data**：`null`

**业务逻辑**：
- 先删除旧的 details，再插入新的

### 6.5 删除套餐

```
DELETE /admin/package
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

**业务逻辑**：
- 同时删除关联的 details 记录

### 6.6 修改套餐状态

```
POST /admin/package/status/{status}
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | long | 是 | Query 参数 |

**响应 data**：`null`

---

## 7. 排班管理

### 7.1 获取一周排班

```
GET /admin/schedule/week
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 周一日期，格式 YYYY-MM-DD |

**响应 data**：
```json
[
  {
    "staffId": 1,
    "staffName": "张三",
    "level": 2,
    "avatar": "https://xxx/avatar.jpg",
    "days": [
      {
        "date": "2026-11-02",
        "scheduleId": 11,
        "startTime": "09:00",
        "endTime": "18:00",
        "status": 1,
        "bookedCount": 5
      },
      {
        "date": "2026-11-03",
        "scheduleId": null,
        "startTime": null,
        "endTime": null,
        "status": 2,
        "bookedCount": 0
      }
    ]
  }
]
```

**业务逻辑**：
- 返回所有启用状态的员工
- 每个员工返回 7 天的排班数据
- `status`: 1=可约，2=休息
- `bookedCount`: 当天已预约数量

### 7.2 批量排班

```
POST /admin/schedule/batch
```

**请求体**：
```json
{
  "staffIds": [1, 2, 3],
  "startDate": "2026-11-02",
  "endDate": "2026-11-08",
  "startTime": "09:00",
  "endTime": "18:00",
  "status": 1
}
```

**响应 data**：`null`

**业务逻辑**：
- 为指定员工在日期范围内的每一天创建排班
- 如果已存在排班，则覆盖

### 7.3 编辑单个排班

```
PUT /admin/schedule/{id}
```

**请求体**：
```json
{
  "startTime": "10:00",
  "endTime": "19:00",
  "status": 1
}
```

**响应 data**：`null`

### 7.4 删除排班

```
DELETE /admin/schedule/{id}
```

**响应 data**：`null`

### 7.5 复制上周排班

```
POST /admin/schedule/copy
```

**请求体**：
```json
{
  "targetStartDate": "2026-11-09"
}
```

**响应 data**：`null`

**业务逻辑**：
- 将 targetStartDate 所在周的前一周排班复制到 targetStartDate 所在周
- 同一天同一员工的排班如果已存在则覆盖

---

## 8. 预约管理

### 8.1 预约分页列表

```
GET /admin/appointment/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| startDate | string | 否 | 预约日期范围起始 |
| endDate | string | 否 | 预约日期范围结束 |
| status | int | 否 | 预约状态 |
| staffId | long | 否 | 技师 ID |
| keyword | string | 否 | 关键词（单号/手机号/宠物名） |
| appointmentDate | string | 否 | 指定日期（工作台今日预约用） |

**响应 data**：
```json
{
  "total": 42,
  "records": [
    {
      "id": 1001,
      "orderNo": "AP202611050001",
      "appointmentDate": "2026-11-05",
      "startTime": "14:00",
      "endTime": "15:30",
      "customerName": "张女士",
      "customerPhone": "138****1234",
      "petName": "豆豆",
      "petSpecies": 1,
      "petBreed": "金毛",
      "staffId": 3,
      "staffName": "王美容师",
      "itemSummary": "中型犬基础洗护 ×1",
      "totalAmount": 168.00,
      "payStatus": 1,
      "status": 2,
      "createTime": "2026-11-04 20:13:22"
    }
  ]
}
```

### 8.2 预约详情

```
GET /admin/appointment/{id}
```

**响应 data**：
```json
{
  "id": 1001,
  "orderNo": "AP202611050001",
  "appointmentDate": "2026-11-05",
  "startTime": "14:00",
  "endTime": "15:30",
  "status": 2,
  "createTime": "2026-11-04 20:13:22",
  "customerName": "张女士",
  "customerPhone": "13812341234",
  "petName": "豆豆",
  "petSpecies": 1,
  "petBreed": "金毛",
  "petWeight": 25.5,
  "vaccineExpiryDate": "2027-03-15",
  "staffId": 3,
  "staffName": "王美容师",
  "items": [
    {
      "serviceName": "中型犬基础洗护",
      "price": 168.00,
      "duration": 60,
      "quantity": 1,
      "subtotal": 168.00
    }
  ],
  "totalAmount": 168.00,
  "paidAmount": 168.00,
  "payStatus": 1,
  "payTime": "2026-11-04 20:15:00",
  "cancelReason": null,
  "remark": "请注意狗狗比较胆小"
}
```

### 8.3 预约日历数据

```
GET /admin/appointment/calendar
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 日期，YYYY-MM-DD |

**响应 data**：
```json
[
  {
    "staffId": 1,
    "staffName": "张三",
    "level": 2,
    "avatar": "https://xxx/avatar.jpg",
    "slots": [
      {
        "startTime": "14:00",
        "endTime": "15:30",
        "appointmentId": 1001,
        "petName": "豆豆",
        "species": 1,
        "breed": "金毛",
        "itemSummary": "中型犬基础洗护",
        "status": 2
      }
    ]
  }
]
```

### 8.4 代客下单

```
POST /admin/appointment
```

**请求体**：
```json
{
  "customerId": 1,
  "petId": 1,
  "staffId": 3,
  "appointmentDate": "2026-11-05",
  "startTime": "14:00",
  "serviceItemIds": [1],
  "packageId": null,
  "remark": "请注意狗狗比较胆小"
}
```

**响应 data**：
```json
{
  "id": 1002,
  "orderNo": "AP202611050002"
}
```

**业务逻辑**：
- 检查时段冲突（该技师在该时段是否已有预约）
- 根据服务项/套餐计算总价和时长
- 自动生成 endTime = startTime + 总时长
- 生成订单号：AP + 日期 + 4位序号
- 初始状态：1（待支付）或 2（待服务），根据业务需求决定

### 8.5 核销到店

```
POST /admin/appointment/{id}/checkin
```

**响应 data**：`null`

**业务逻辑**：
- 仅 status=2（待服务）可操作
- 更新状态为 3（服务中）

### 8.6 完成服务

```
POST /admin/appointment/{id}/complete
```

**响应 data**：`null`

**业务逻辑**：
- 仅 status=3（服务中）可操作
- 更新状态为 5（已完成）
- 自动设置 payStatus=1（已付）如果之前未付

### 8.7 取消预约

```
POST /admin/appointment/{id}/cancel
```

**请求体**：
```json
{
  "cancelReason": "客户临时有事"
}
```

**响应 data**：`null`

**业务逻辑**：
- 仅 status=1/2 可操作
- 更新状态为 4（已取消）
- 如果已支付，需要触发退款流程

---

## 9. 客户/宠物档案

### 9.1 客户分页列表

```
GET /admin/customer/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数，建议 50 |
| keyword | string | 否 | 昵称/手机号模糊搜索 |

**响应 data**：
```json
{
  "total": 120,
  "records": [
    {
      "id": 1,
      "nickname": "张女士",
      "avatar": "https://xxx/customer1.jpg",
      "phone": "13812341234",
      "petCount": 2,
      "createTime": "2026-09-01 10:00:00"
    }
  ]
}
```

### 9.2 宠物分页列表

```
GET /admin/pet/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| customerId | long | 是 | 客户 ID |

**响应 data**：
```json
{
  "total": 2,
  "records": [
    {
      "id": 1,
      "name": "豆豆",
      "avatar": "https://xxx/pet1.jpg",
      "species": 1,
      "breed": "金毛",
      "gender": 1,
      "weight": 25.5,
      "birthday": "2024-03-15",
      "neutered": true,
      "vaccineExpiryDate": "2027-03-15",
      "allergies": "",
      "remark": "性格温顺"
    }
  ]
}
```

### 9.3 宠物详情

```
GET /admin/pet/{id}
```

**响应 data**：
```json
{
  "id": 1,
  "name": "豆豆",
  "avatar": "https://xxx/pet1.jpg",
  "species": 1,
  "breed": "金毛",
  "gender": 1,
  "weight": 25.5,
  "birthday": "2024-03-15",
  "neutered": true,
  "vaccineExpiryDate": "2027-03-15",
  "allergies": "",
  "remark": "性格温顺",
  "customer": {
    "id": 1,
    "nickname": "张女士",
    "phone": "13812341234"
  },
  "appointments": [
    {
      "id": 1001,
      "orderNo": "AP202611050001",
      "appointmentDate": "2026-11-05",
      "startTime": "14:00",
      "itemSummary": "中型犬基础洗护 ×1",
      "staffName": "王美容师",
      "status": 5,
      "totalAmount": 168.00
    }
  ]
}
```

---

## 10. 评价管理

### 10.1 评价分页列表

```
GET /admin/review/page
```

**请求参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |
| score | int | 否 | 评分筛选（1-5） |
| startDate | string | 否 | 评价日期范围起始 |
| endDate | string | 否 | 评价日期范围结束 |
| replied | int | 否 | 是否已回复（1已回复/0未回复） |

**响应 data**：
```json
{
  "total": 30,
  "records": [
    {
      "id": 1,
      "customerName": "张女士",
      "petName": "豆豆",
      "staffName": "王美容师",
      "score": 5,
      "content": "服务非常好，狗狗洗得很干净，美容师很专业！",
      "replyContent": null,
      "createTime": "2026-11-06 10:30:00"
    }
  ]
}
```

### 10.2 回复评价

```
POST /admin/review/{id}/reply
```

**请求体**：
```json
{
  "replyContent": "感谢您的好评！欢迎下次再来~"
}
```

**响应 data**：`null`

**业务逻辑**：
- 一条评价只能回复一次
- 如果已有回复，返回错误提示

---

## 11. 工作台统计

### 11.1 工作台汇总

```
GET /admin/dashboard/summary
```

**响应 data**：
```json
{
  "todayAppointmentCount": 18,
  "todayPendingCount": 6,
  "todayTurnover": 2480.00,
  "staffOnDutyCount": 4,
  "staffTotalCount": 5,
  "occupancyRate": 0.62
}
```

### 11.2 近 7 日趋势

```
GET /admin/dashboard/trend
```

**响应 data**：
```json
[
  { "date": "2026-10-22", "orderCount": 12, "turnover": 1680.00 },
  { "date": "2026-10-23", "orderCount": 15, "turnover": 2140.00 },
  { "date": "2026-10-24", "orderCount": 18, "turnover": 2890.00 },
  { "date": "2026-10-25", "orderCount": 20, "turnover": 3200.00 },
  { "date": "2026-10-26", "orderCount": 16, "turnover": 2560.00 },
  { "date": "2026-10-27", "orderCount": 14, "turnover": 2240.00 },
  { "date": "2026-10-28", "orderCount": 18, "turnover": 2480.00 }
]
```

### 11.3 技师排名

```
GET /admin/report/staff-rank
```

**响应 data**：
```json
[
  { "staffName": "王美容师", "appointmentCount": 45, "avgScore": 4.8, "turnover": 8560.00 },
  { "staffName": "李美容师", "appointmentCount": 38, "avgScore": 4.6, "turnover": 7200.00 },
  { "staffName": "赵助理", "appointmentCount": 25, "avgScore": 4.5, "turnover": 4200.00 },
  { "staffName": "孙美容师", "appointmentCount": 20, "avgScore": 4.3, "turnover": 3800.00 },
  { "staffName": "周助理", "appointmentCount": 15, "avgScore": 4.2, "turnover": 2880.00 }
]
```

**业务逻辑**：
- 统计近 30 天数据
- 按 appointmentCount 降序排列
- 只返回 Top 5

---

## 12. 门店设置

### 12.1 获取门店信息

```
GET /admin/shop
```

**响应 data**：
```json
{
  "id": 1,
  "name": "萌宠之家",
  "logo": "https://xxx/shop-logo.jpg",
  "phone": "010-12345678",
  "address": "北京市朝阳区XX路XX号",
  "businessStatus": 1,
  "businessHours": [
    { "dayOfWeek": 1, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 2, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 3, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 4, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 5, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 6, "isRest": false, "openTime": "09:00", "closeTime": "21:00" },
    { "dayOfWeek": 7, "isRest": true, "openTime": null, "closeTime": null }
  ]
}
```

> dayOfWeek: 1=周一, 7=周日

### 12.2 更新门店信息

```
PUT /admin/shop
```

**请求体**：
```json
{
  "name": "萌宠之家",
  "logo": "https://xxx/shop-logo-new.jpg",
  "phone": "010-12345678",
  "address": "北京市朝阳区XX路XX号",
  "businessStatus": 1,
  "businessHours": [
    { "dayOfWeek": 1, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 2, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 3, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 4, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 5, "isRest": false, "openTime": "09:00", "closeTime": "20:00" },
    { "dayOfWeek": 6, "isRest": false, "openTime": "09:00", "closeTime": "21:00" },
    { "dayOfWeek": 7, "isRest": true, "openTime": null, "closeTime": null }
  ]
}
```

**响应 data**：`null`

---

## 13. 通用接口

### 13.1 图片上传

```
POST /admin/common/upload
```

**请求**：`multipart/form-data`，字段名 `file`

**响应 data**：
```json
"https://oss.xxx.com/uploads/2026/11/05/abc123.jpg"
```

**业务逻辑**：
- 限制文件类型：jpg/png
- 限制文件大小：2MB
- 返回可访问的完整 URL

---

## 14. 数据字典

### 14.1 预约状态 (appointment.status)

| 值 | 含义 | 可执行操作 |
|----|------|-----------|
| 1 | 待支付 | 取消 |
| 2 | 待服务 | 核销到店、取消 |
| 3 | 服务中 | 完成服务 |
| 4 | 已取消 | 无 |
| 5 | 已完成 | 无 |
| 6 | 已评价 | 无 |

### 14.2 支付状态 (appointment.payStatus)

| 值 | 含义 |
|----|------|
| 0 | 未付 |
| 1 | 已付 |
| 2 | 已退 |

### 14.3 通用启停状态

| 值 | 含义 |
|----|------|
| 1 | 启用 |
| 0 | 停用 |

### 14.4 员工职位 (staff.position)

| 值 | 含义 |
|----|------|
| 1 | 店长 |
| 2 | 美容师 |
| 3 | 助理 |

### 14.5 员工职级 (staff.level)

| 值 | 含义 |
|----|------|
| 1 | 初级 |
| 2 | 中级 |
| 3 | 高级 |

### 14.6 宠物类型 (pet.species)

| 值 | 含义 |
|----|------|
| 1 | 狗 |
| 2 | 猫 |
| 3 | 其他 |

### 14.7 适用体型 (service_item.petSizeLimit)

| 值 | 含义 |
|----|------|
| 0 | 不限 |
| 1 | 小型 |
| 2 | 中型 |
| 3 | 大型 |

### 14.8 排班状态 (schedule.status)

| 值 | 含义 |
|----|------|
| 1 | 可约 |
| 2 | 休息 |

### 14.9 分类类型 (category.type)

| 值 | 含义 |
|----|------|
| 1 | 服务项目 |
| 2 | 服务套餐 |

---

## 15. 数据库表设计建议

### 15.1 员工表 (staff)

```sql
CREATE TABLE staff (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  phone VARCHAR(20) NOT NULL UNIQUE,
  position TINYINT NOT NULL COMMENT '1店长 2美容师 3助理',
  level TINYINT NOT NULL DEFAULT 1 COMMENT '1初级 2中级 3高级',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 员工擅长项目关联表
CREATE TABLE staff_specialty (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  staff_id BIGINT NOT NULL,
  service_item_id BIGINT NOT NULL,
  UNIQUE KEY uk_staff_item (staff_id, service_item_id)
);
```

### 15.2 分类表 (category)

```sql
CREATE TABLE category (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  type TINYINT NOT NULL COMMENT '1服务项目 2服务套餐',
  sort INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 15.3 服务项目表 (service_item)

```sql
CREATE TABLE service_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(500),
  category_id BIGINT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL COMMENT '服务时长（分钟）',
  pet_size_limit TINYINT NOT NULL DEFAULT 0 COMMENT '0不限 1小型 2中型 3大型',
  daily_limit INT NOT NULL DEFAULT 10,
  description VARCHAR(500),
  status TINYINT NOT NULL DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 15.4 服务套餐表 (service_package)

```sql
CREATE TABLE service_package (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  image VARCHAR(500),
  category_id BIGINT NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  daily_limit INT NOT NULL DEFAULT 5,
  description VARCHAR(500),
  status TINYINT NOT NULL DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 套餐明细表
CREATE TABLE package_detail (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  package_id BIGINT NOT NULL,
  service_item_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);
```

### 15.5 排班表 (schedule)

```sql
CREATE TABLE schedule (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  staff_id BIGINT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1可约 2休息',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_staff_date (staff_id, date)
);
```

### 15.6 客户表 (customer)

```sql
CREATE TABLE customer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE COMMENT '小程序 openid',
  nickname VARCHAR(50),
  avatar VARCHAR(500),
  phone VARCHAR(20),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 15.7 宠物表 (pet)

```sql
CREATE TABLE pet (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  avatar VARCHAR(500),
  species TINYINT NOT NULL COMMENT '1狗 2猫 3其他',
  breed VARCHAR(50),
  gender TINYINT COMMENT '1公 2母',
  weight DECIMAL(5, 2),
  birthday DATE,
  neutered TINYINT DEFAULT 0,
  vaccine_expiry_date DATE,
  allergies VARCHAR(200),
  remark VARCHAR(500),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 15.8 预约表 (appointment)

```sql
CREATE TABLE appointment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  pet_id BIGINT NOT NULL,
  staff_id BIGINT NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  pay_status TINYINT NOT NULL DEFAULT 0 COMMENT '0未付 1已付 2已退',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1待支付 2待服务 3服务中 4已取消 5已完成 6已评价',
  cancel_reason VARCHAR(200),
  remark VARCHAR(500),
  pay_time DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date_staff (appointment_date, staff_id),
  INDEX idx_customer (customer_id),
  INDEX idx_status (status)
);

-- 预约项目明细表
CREATE TABLE appointment_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  appointment_id BIGINT NOT NULL,
  service_item_id BIGINT,
  package_id BIGINT,
  service_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL
);
```

### 15.9 评价表 (review)

```sql
CREATE TABLE review (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  appointment_id BIGINT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  staff_id BIGINT NOT NULL,
  score TINYINT NOT NULL COMMENT '1-5分',
  content VARCHAR(500),
  reply_content VARCHAR(500),
  reply_time DATETIME,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 15.10 门店设置表 (shop)

```sql
CREATE TABLE shop (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  logo VARCHAR(500),
  phone VARCHAR(20),
  address VARCHAR(200),
  business_status TINYINT NOT NULL DEFAULT 1 COMMENT '1营业中 0休息中',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 营业时间表
CREATE TABLE shop_business_hour (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  shop_id BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '1周一 7周日',
  is_rest TINYINT NOT NULL DEFAULT 0,
  open_time TIME,
  close_time TIME,
  UNIQUE KEY uk_shop_day (shop_id, day_of_week)
);
```

---

## 附录：前端项目文件清单

```
D:\pet-web-admin-kit\
├── package.json
├── vite.config.js
├── index.html
├── .env.development
├── .env.production
└── src/
    ├── main.js
    ├── App.vue
    ├── api/
    │   ├── request.js          # axios 实例 + 拦截器
    │   ├── auth.js             # 登录/登出/改密
    │   ├── staff.js            # 员工管理
    │   ├── category.js         # 分类管理
    │   ├── serviceItem.js      # 服务项目
    │   ├── servicePackage.js   # 服务套餐
    │   ├── schedule.js         # 排班管理
    │   ├── appointment.js      # 预约管理
    │   ├── customer.js         # 客户
    │   ├── pet.js              # 宠物
    │   ├── review.js           # 评价
    │   └── dashboard.js        # 工作台统计
    ├── assets/styles/
    │   ├── variables.scss      # 设计 Token
    │   ├── reset.scss          # 样式重置
    │   └── common.scss         # 通用类
    ├── components/
    │   ├── PageHeader.vue      # 页面标题
    │   ├── FilterBar.vue       # 筛选栏
    │   ├── StatusTag.vue       # 状态标签
    │   ├── EmptyState.vue      # 空状态
    │   └── ImageUpload.vue     # 图片上传
    ├── constants/
    │   ├── enums.js            # 枚举字典
    │   └── dict.js             # 字典工具
    ├── layout/
    │   ├── index.vue           # 布局骨架
    │   ├── Sidebar.vue         # 侧边栏
    │   └── Navbar.vue          # 顶栏
    ├── router/index.js         # 路由
    ├── stores/user.js          # 用户状态
    └── views/
        ├── login/index.vue     # 登录页
        ├── dashboard/index.vue # 工作台
        ├── appointment/
        │   ├── index.vue       # 预约列表
        │   └── calendar.vue    # 预约日历
        ├── schedule/index.vue  # 排班管理
        ├── service-item/index.vue
        ├── service-package/index.vue
        ├── category/index.vue
        ├── pet/index.vue
        ├── staff/index.vue
        ├── review/index.vue
        └── shop/index.vue
```
