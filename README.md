# EssayScore

一套支持 OCR 输入的 AI 作文评分与润色系统，后端为 Flask，前端为 React + Vite。

## 目录结构

- `Backend/` Flask API（MVC）+ SQLAlchemy + OCR/LLM 服务
- `Frontend/` React + Vite + Tailwind UI
- `docker-compose.yml` MySQL + 后端 + Nginx 前端

## 环境要求

- Python 3.10+
- Node.js 18+
- MySQL 8+（或 Docker）

## 环境变量

在仓库根目录创建 `.env`：

```bash
MYSQL_ROOT_PASSWORD=your_mysql_password
DASHSCOPE_API_KEY=your_dashscope_key
OCR_API_KEY=your_baidu_ocr_key
OCR_SECRET_KEY=your_baidu_ocr_secret
JWT_SECRET_KEY=change-this-in-production
FRONTEND_BASE_URL=http://localhost:5173
LLM_TOKEN_QUOTA=1000000
LLM_MODEL=qwen-max
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

## 后端（本地）

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

后端运行于 `http://localhost:5000`。

## 前端（本地）

```bash
cd Frontend
npm install
npm run dev
```

前端运行于 `http://localhost:5173`，`/api` 会代理到后端。

## Docker（可选）

```bash
docker-compose up --build
```

前端暴露在 `http://localhost:80`，后端在 `http://localhost:5000`。

## 数据库迁移（已有 users 表）

当前版本新增了用户状态与资料字段，请在 MySQL 执行：

```sql
ALTER TABLE users
ADD COLUMN is_active TINYINT(1) DEFAULT 1,
ADD COLUMN must_change_password TINYINT(1) DEFAULT 0,
ADD COLUMN must_change_password_expires_at DATETIME NULL,
ADD COLUMN grade VARCHAR(20),
ADD COLUMN subject VARCHAR(20),
ADD COLUMN teacher_id VARCHAR(50),
ADD COLUMN phone VARCHAR(32),
ADD COLUMN email VARCHAR(255);
```

新增找回密码表：

```sql
CREATE TABLE password_reset_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  contact VARCHAR(255),
  code VARCHAR(20) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (username) REFERENCES users(username)
);
```

## API 一览

- `POST /api/v1/register` 用户注册（必填：username/password/phone/email）
- `POST /api/v1/login` 用户登录
- `POST /api/v1/change-password` 修改密码
- `POST /api/v1/auth/forgot-password` 忘记密码（提示联系管理员）
- `POST /api/v1/auth/reset-password` 自助重置（已禁用）
- `POST /api/v1/score` 作文评分与润色
- `GET /api/v1/history` 我的历史列表
- `GET /api/v1/history/<username>` 历史列表（仅本人）
- `GET /api/v1/essay/<essay_id>` 作文详情
- `POST /api/v1/ocr` OCR（`.txt` 或图片）
- `GET /api/v1/points/balance` 积分余额
- `GET /api/v1/points/ledger` 积分明细
- `GET /api/v1/invite/code` 获取邀请码与链接
- `POST /api/v1/invite/code` 生成邀请码与链接
- `GET /api/v1/admin/ping` 仅 admin
- `GET /api/v1/admin/users` 用户列表（admin）
- `PATCH /api/v1/admin/users/<username>` 更新用户（admin）
- `POST /api/v1/admin/users/<username>/reset-password` 重置密码为 123456（admin）
- `POST /api/v1/admin/points/adjust` 管理员积分调整（admin）
- `GET /api/v1/admin/teachers` 教师列表（admin）
- `GET /api/v1/admin/llm/status` LLM 用量与额度（admin）
- `GET /api/v1/admin/llm/configs` LLM 配置列表（admin）
- `POST /api/v1/admin/llm/configs` 新增 LLM 配置（admin）
- `PATCH /api/v1/admin/llm/configs/<id>` 更新 LLM 配置（admin）
- `POST /api/v1/admin/llm/configs/<id>/activate` 切换当前 LLM（admin）
- `DELETE /api/v1/admin/llm/configs/<id>` 删除 LLM 配置（admin）
- `GET /api/v1/teacher/ping` teacher 或 admin
- `GET /api/v1/teacher/students` 学生列表（teacher/admin）
- `GET /api/v1/teacher/history/<username>` 学生历史（teacher/admin）
- `GET /api/v1/teacher/essay/<essay_id>` 学生作文详情（teacher/admin）
- `POST /api/v1/teacher/classes` 创建班级（teacher/admin）
- `GET /api/v1/teacher/classes` 班级列表（teacher/admin）
- `PATCH /api/v1/teacher/classes/<class_id>` 更新班级（teacher/admin）
- `POST /api/v1/teacher/classes/<class_id>/invite` 重置邀请码（teacher/admin）
- `GET /api/v1/teacher/classes/<class_id>/members` 班级学生（teacher/admin）
- `PATCH /api/v1/teacher/classes/<class_id>/members/<username>` 分组更新（teacher/admin）
- `DELETE /api/v1/teacher/classes/<class_id>/members/<username>` 移除学生（teacher/admin）
- `GET /api/v1/teacher/classes/<class_id>/requests` 加入申请（teacher/admin）
- `POST /api/v1/teacher/classes/<class_id>/requests/<username>/approve` 通过申请（teacher/admin）
- `POST /api/v1/teacher/classes/<class_id>/requests/<username>/reject` 拒绝申请（teacher/admin）
- `POST /api/v1/classes/join` 学生通过邀请码加入班级

## 鉴权与权限说明

- 登录后返回 `access_token`（JWT），后续请求需在请求头添加 `Authorization: Bearer <token>`
- 前端会把 `access_token` 和用户名存入 `localStorage`，并自动在请求中附带 Authorization
- 接口返回 401 会清理本地登录态并跳转到登录页，同时提示 token 过期
- 被禁用账号无法登录或访问接口
- 管理员重置密码后会强制用户修改密码
- `history/<username>` 只能查询本人历史，`history` 默认查询本人历史
- 邀请链接使用 `FRONTEND_BASE_URL` 拼接 `/invite/signup/<code>`
- `essay/<essay_id>` 仅允许查看本人作文
- `score` 评分写入时使用 JWT 身份作为用户名，忽略前端传入

## 积分规则（默认）

- 新用户注册：+50
- 作文评分：每次 -5（余额不足将阻止评分）
- 邀请新用户注册：邀请人 +30

## 功能清单

### 学生端（前端）
- 登录：账号密码登录，成功后保存 `authToken` 与 `authUser`
- 注册：用户注册，密码一致性校验，成功后自动跳转登录
- 班级加入：独立页面通过邀请码申请加入班级
- 邀请好友：独立页面生成邀请码与邀请链接
- 积分中心：独立页面查看余额与积分明细
- 作文提交：题目描述、标题、正文输入并提交评分
- 历史记录：独立页面查看作文详情
- OCR 导入：题目/标题/正文支持 `.txt` 和图片上传识别
- 评分结果展示：分数、结构化反馈、润色后的全文
- 历史记录：侧边栏加载历史列表并查看详情
- 交互体验：加载状态、错误提示、通知弹窗、移动端侧边栏

### 教师端（前端）
- 教师入口：仅 teacher/admin 可访问，登录后自动跳转教师工作台
- 班级管理：创建班级、年级/科目、邀请码/邀请链接、审核开关
- 成员管理：学生名单查看、移除、分组
- 加入审核：学生申请审批/拒绝
- 学生历史：按学生查看历史记录
- 作文详情：查看学生作文详情与评分结果
- 教师导航：班级 / 管理 / 历史独立页面切换

### 管理后台（前端）
- 导航：仪表盘 / 学生管理 / 教师管理 / 积分管理独立页面切换
- 仪表盘：用户概况 / 近 7 天活跃 / 积分概况
- 学生管理：禁用/重置密码/积分调整
- 教师管理：年级/学科/工号、禁用/重置密码
- 重置密码与强制修改
- 积分调整：管理员对用户加减分（需备注）
- 教师资料字段（年级/学科/工号）
- 学科仅支持 语文/英语，年级支持 1-12

#### 管理员重置密码操作
1. 进入“管理后台”页面，找到目标用户。
2. 点击“重置密码”，系统将该用户密码重置为 `123456`。
3. 用户下次登录会被强制跳转到“修改密码”页面。

#### 邀请链接使用示例
1. 学生端点击“生成邀请链接”（示例：`http://localhost:5173/invite/signup/abcd1234`）。
2. 新用户打开链接，系统跳转注册页并自动带入邀请码。
3. 注册成功后，邀请人获得 +30 积分。

### 后端（API + 服务）
- 用户注册/登录：JWT 鉴权，identity 为 `username`
- 作文评分：调用通义千问评分与润色，写入 MySQL
- 历史/详情查询：仅允许访问本人数据（归属校验）
- OCR：文本文件与手写图片识别
- 最小 RBAC：admin/teacher 角色测试接口
- 教师接口：学生列表、学生历史、学生作文详情（RBAC 限制）
- 班级管理：班级创建、邀请码、成员管理、加入审核（RBAC 限制）
- 用户与角色管理：角色切换、禁用、重置密码、强制改密（RBAC 限制）
- 积分系统：注册奖励、批改扣分、邀请奖励（幂等账本）

### 系统与部署
- 架构：Flask MVC + services + SQLAlchemy
- 数据库：MySQL（`users`/`essays`/`classes`/`class_members`/`class_join_requests`/`points_account`/`points_ledger`/`invite_code`/`invite_bind`）
- 部署：Docker Compose（MySQL + 后端 + Nginx 前端）

