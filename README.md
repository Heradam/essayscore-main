# EssayScore

EssayScore 是一个面向作文教学场景的 AI 作文评分系统。系统支持学生提交作文、OCR 文本识别、AI 评分与润色、作文历史记录、积分消耗、班级管理、教师查看学生作文以及管理员维护用户、积分和模型配置。

项目采用前后端分离架构：

- 后端：Flask REST API，负责鉴权、业务接口、数据库访问、LLM 调用和 OCR 调用。
- 前端：React + Vite 单页应用，负责学生端、教师端和管理员端页面。
- 部署：Docker Compose 编排 MySQL、Flask/Gunicorn 和 Nginx。

## 目录

- [功能模块](#功能模块)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境变量](#环境变量)
- [本地运行](#本地运行)
- [Docker 部署](#docker-部署)
- [首次初始化](#首次初始化)
- [权限模型](#权限模型)
- [接口概览](#接口概览)
- [数据模型](#数据模型)
- [开发规范](#开发规范)
- [常用命令](#常用命令)
- [维护入口](#维护入口)

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 学生端 | 注册登录、作文提交、AI 评分、OCR 导入、历史记录、积分查询、邀请码注册、班级加入 |
| 教师端 | 班级创建、成员管理、入班审核、学生列表、学生作文历史和详情查看 |
| 管理端 | 用户管理、教师管理、学生管理、积分调整、后台统计、LLM 配置管理 |
| 系统能力 | JWT 鉴权、角色权限、账号禁用、强制改密、积分流水、模型额度配置 |

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18, Vite 5, React Router, Tailwind CSS, lucide-react |
| 后端 | Flask, Flask-CORS, Flask-SQLAlchemy, Flask-JWT-Extended |
| 数据库 | MySQL 8 |
| AI 服务 | OpenAI-compatible API，默认适配 DashScope |
| OCR 服务 | Baidu OCR SDK |
| 部署 | Docker Compose, Gunicorn, Nginx |

## 项目结构

```text
.
├── Backend/
│   ├── app.py                  # Flask 应用入口，初始化扩展并注册路由
│   ├── config.py               # 数据库、JWT 等运行配置
│   ├── extensions.py           # SQLAlchemy、JWT 扩展实例
│   ├── controllers/            # API 路由层
│   ├── models/                 # SQLAlchemy 数据模型
│   └── services/               # 业务服务、鉴权、LLM、OCR、积分逻辑
├── Frontend/
│   ├── main.jsx                # React 入口、路由和权限守卫
│   ├── index.html              # Vite HTML 入口
│   ├── index.css               # 全局样式
│   ├── src/
│   │   ├── api/client.js       # API 请求封装
│   │   ├── components/         # 通用组件
│   │   └── pages/              # 页面组件
│   ├── vite.config.js          # 本地开发代理配置
│   └── nginx.conf              # 生产环境 Nginx 配置
├── docker-compose.yml          # MySQL、Backend、Frontend 服务编排
└── README.md
```

## 架构说明

后端入口为 `Backend/app.py`。`create_app()` 会初始化 Flask、CORS、SQLAlchemy、JWT，并注册 `controllers/` 下的 Blueprint。所有业务接口统一使用 `/api/v1` 路径前缀。

后端分层约定：

- `controllers/`：处理 HTTP 入参、调用 service、组装 JSON 响应。
- `services/`：承载业务逻辑和外部服务调用，例如鉴权、积分、LLM、OCR。
- `models/`：定义数据库表结构和 ORM 模型。
- `extensions.py`：集中维护 Flask 扩展实例，避免循环依赖。

前端入口为 `Frontend/main.jsx`。应用使用 React Router 组织页面，使用 `ProtectedRoute`、`MustChangeGuard`、`RoleRoute` 处理登录态、强制改密和角色权限。接口请求统一通过 `Frontend/src/api/client.js`，自动注入 JWT，并处理 401 登录失效。

## 环境变量

在项目根目录创建 `.env` 文件。该文件包含敏感信息，不应提交到 Git。

```env
MYSQL_ROOT_PASSWORD=change-me
MYSQL_DATABASE=essay_scoring
MYSQL_HOST=localhost
MYSQL_USER=root

JWT_SECRET_KEY=replace-with-a-long-random-secret
FRONTEND_BASE_URL=http://localhost:5173

DASHSCOPE_API_KEY=your_dashscope_api_key
LLM_MODEL=qwen-max
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

OCR_API_KEY=your_baidu_ocr_api_key
OCR_SECRET_KEY=your_baidu_ocr_secret_key
```

| 变量 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | 是 | MySQL root 密码，也是后端默认连接密码 | `123456` |
| `MYSQL_DATABASE` | 否 | 业务数据库名 | `essay_scoring` |
| `MYSQL_HOST` | 否 | MySQL 主机，本地为 `localhost`，Docker 为 `db` | `localhost` |
| `MYSQL_USER` | 否 | MySQL 用户名 | `root` |
| `JWT_SECRET_KEY` | 是 | JWT 签名密钥，生产环境必须替换 | `dev-secret-change-me` |
| `FRONTEND_BASE_URL` | 否 | 邀请链接使用的前端地址 | 当前请求 host |
| `DASHSCOPE_API_KEY` | 是 | 默认 LLM API Key | 无 |
| `LLM_MODEL` | 否 | 默认模型名称 | `qwen-max` |
| `LLM_BASE_URL` | 否 | OpenAI-compatible API 地址 | DashScope compatible endpoint |
| `OCR_API_KEY` | 是 | 百度 OCR API Key | 无 |
| `OCR_SECRET_KEY` | 是 | 百度 OCR Secret Key | 无 |

生产环境必须显式配置 `JWT_SECRET_KEY`，不要使用默认密钥。

## 本地运行

### 1. 初始化数据库

确保本地 MySQL 8 已启动，并创建业务数据库：

```sql
CREATE DATABASE IF NOT EXISTS essay_scoring
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

项目启动时会调用 `db.create_all()` 创建缺失表。对于已有数据的环境，表结构变更应通过受控 SQL 迁移完成，不建议依赖 `create_all()` 修改既有表。

### 2. 启动后端

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

后端默认运行在：

```text
http://localhost:5000
```

### 3. 启动前端

```bash
cd Frontend
npm install
npm run dev
```

前端默认运行在：

```text
http://localhost:5173
```

开发环境下，Vite 会将 `/api` 请求代理到 `http://localhost:5000`。

## Docker 部署

```bash
docker-compose up --build
```

默认端口：

| 服务 | 地址 |
| --- | --- |
| Frontend | `http://localhost` |
| Backend | `http://localhost:5000` |
| MySQL | Docker 网络内部 `db:3306` |

服务说明：

- `db`：MySQL 8，数据持久化到 `mysql_data` volume。
- `backend`：使用 Gunicorn 启动 Flask 应用，监听 `0.0.0.0:5000`。
- `frontend`：使用 Nginx 托管前端静态资源，并将 `/api/v1/` 反向代理到后端。

停止服务：

```bash
docker-compose down
```

如需同时删除数据库 volume，请谨慎执行：

```bash
docker-compose down -v
```

## 宝塔面板部署

推荐部署方式：宝塔负责域名、SSL 和反向代理，项目本身使用 Docker Compose 运行 MySQL、后端和前端容器。

### 1. 服务器准备

在宝塔面板中安装：

- Nginx
- Docker 管理器，或在服务器命令行安装 Docker 与 Docker Compose

服务器安全组和宝塔防火墙至少放行：

- `80`：HTTP
- `443`：HTTPS

不建议向公网放行 `5000`、`3306`、`8080`。当前 `docker-compose.yml` 默认只把前端映射到服务器本机 `127.0.0.1:8080`，由宝塔 Nginx 反向代理访问。

### 2. 上传代码

将项目上传到服务器，例如：

```bash
cd /www/wwwroot
git clone https://github.com/Heradam/essayscore-main.git essayscore
cd essayscore
```

如果服务器不能直接拉取 GitHub，也可以在宝塔文件管理中上传压缩包并解压到 `/www/wwwroot/essayscore`。

### 3. 创建生产环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少修改以下值：

```env
MYSQL_ROOT_PASSWORD=strong_mysql_password
JWT_SECRET_KEY=long_random_secret
FRONTEND_BASE_URL=https://your-domain.com
DASHSCOPE_API_KEY=your_dashscope_api_key
OCR_API_KEY=your_baidu_ocr_api_key
OCR_SECRET_KEY=your_baidu_ocr_secret_key
```

### 4. 启动服务

```bash
docker-compose up -d --build
```

查看状态：

```bash
docker-compose ps
docker-compose logs -f backend
```

本机验证：

```bash
curl http://127.0.0.1:8080/healthz
```

返回 `{"status":"ok"}` 表示前端 Nginx 已成功代理到后端。

### 5. 配置宝塔反向代理

在宝塔面板中：

1. 网站 -> 添加站点，域名填写你的域名。
2. SSL -> 申请并开启 HTTPS。
3. 反向代理 -> 添加反向代理。
4. 目标 URL 填写：

```text
http://127.0.0.1:8080
```

如果宝塔生成的站点配置需要手动调整，可使用以下 Nginx 片段：

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 30s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

### 6. 上线检查

```bash
curl -I https://your-domain.com
curl https://your-domain.com/healthz
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend
```

浏览器访问 `https://your-domain.com`，注册第一个账号后，按“首次初始化”章节将该账号设置为管理员。

## 首次初始化

1. 启动数据库、后端和前端。
2. 在前端注册第一个用户。
3. 在数据库中将该用户设置为管理员：

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

4. 使用管理员账号登录 `/admin`。
5. 在 LLM 管理页面配置模型、API Key、Base URL 和额度。

## 权限模型

| 角色 | 权限范围 |
| --- | --- |
| `user` | 学生端功能：作文评分、历史记录、积分、班级、邀请 |
| `teacher` | 教师端功能：班级管理、学生列表、学生作文查看 |
| `admin` | 管理端功能：用户、教师、学生、积分、LLM 配置和后台统计 |

鉴权规则：

- 登录成功后，后端返回 JWT，前端保存到 `localStorage.authToken`。
- 前端请求由 `apiRequest()` 自动附加 `Authorization: Bearer <token>`。
- 后端通过 `role_required()` 控制角色权限。
- 后端通过 `active_required()` 拦截禁用账号。
- 管理员重置密码后，用户下次登录会被强制修改密码。

## 接口概览

完整接口定义位于 `Backend/controllers/`。以下为主要接口分组。

### 认证

| Method | Path | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/register` | 用户注册 |
| `POST` | `/api/v1/login` | 用户登录 |
| `POST` | `/api/v1/change-password` | 修改密码 |
| `POST` | `/api/v1/auth/forgot-password` | 申请找回密码验证码 |
| `POST` | `/api/v1/auth/reset-password` | 重置密码 |

### 作文与 OCR

| Method | Path | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/score` | 作文评分与润色 |
| `GET` | `/api/v1/history` | 当前用户作文历史 |
| `GET` | `/api/v1/essay/<essay_id>` | 作文详情 |
| `PATCH` | `/api/v1/essay/<essay_id>/evaluation` | 更新作文评估结果 |
| `POST` | `/api/v1/ocr` | OCR 识别 |

### 班级、邀请与积分

| Method | Path | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/invite/code` | 获取邀请码 |
| `POST` | `/api/v1/invite/code` | 生成邀请码 |
| `POST` | `/api/v1/classes/join` | 加入班级 |
| `GET` | `/api/v1/classes/mine` | 我的班级 |
| `GET` | `/api/v1/points/balance` | 积分余额 |
| `GET` | `/api/v1/points/ledger` | 积分流水 |

### 教师

| Method | Path | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/teacher/students` | 学生列表 |
| `GET` | `/api/v1/teacher/history/<username>` | 学生作文历史 |
| `GET` | `/api/v1/teacher/essay/<essay_id>` | 学生作文详情 |
| `POST` | `/api/v1/teacher/classes` | 创建班级 |
| `GET` | `/api/v1/teacher/classes` | 班级列表 |
| `PATCH` | `/api/v1/teacher/classes/<class_id>` | 更新班级 |
| `GET` | `/api/v1/teacher/classes/<class_id>/members` | 班级成员 |
| `GET` | `/api/v1/teacher/classes/<class_id>/requests` | 入班申请 |

### 管理员

| Method | Path | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/admin/dashboard` | 后台统计 |
| `GET` | `/api/v1/admin/users` | 用户列表 |
| `PATCH` | `/api/v1/admin/users/<username>` | 更新用户 |
| `POST` | `/api/v1/admin/users/<username>/reset-password` | 重置密码 |
| `GET` | `/api/v1/admin/points/accounts` | 积分账户列表 |
| `POST` | `/api/v1/admin/points/adjust` | 调整积分 |
| `GET` | `/api/v1/admin/llm/configs` | LLM 配置列表 |
| `POST` | `/api/v1/admin/llm/configs` | 新增 LLM 配置 |
| `PATCH` | `/api/v1/admin/llm/configs/<config_id>` | 更新 LLM 配置 |
| `POST` | `/api/v1/admin/llm/configs/<config_id>/activate` | 激活 LLM 配置 |
| `DELETE` | `/api/v1/admin/llm/configs/<config_id>` | 删除 LLM 配置 |

## 数据模型

主要数据表：

| 表名 | 说明 |
| --- | --- |
| `users` | 用户账号、角色、状态、教师资料和联系方式 |
| `essays` | 作文内容、评分结果和润色结果 |
| `classes` | 班级信息、教师归属和邀请码 |
| `class_members` | 班级成员关系 |
| `class_join_requests` | 学生入班申请 |
| `points_account` | 用户积分账户 |
| `points_ledger` | 积分流水 |
| `invite_code` | 邀请码 |
| `invite_bind` | 邀请绑定关系 |
| `llm_configs` | LLM 模型配置 |
| `llm_usage_logs` | LLM 使用记录 |
| `password_reset_requests` | 找回密码验证码记录 |

## 积分规则

| 场景 | 积分变化 |
| --- | --- |
| 新用户注册 | `+50` |
| 作文评分 | `-5` |
| 邀请新用户注册 | 邀请人 `+30` |
| 管理员调整 | 按后台输入增减 |

积分流水使用 `idempotency_key` 做幂等控制，核心逻辑位于 `Backend/services/points_service.py`。

## 开发规范

- 不提交 `.env`、本地数据库、IDE 配置、缓存文件和构建产物。
- 后端 Controller 只处理 HTTP 层逻辑，业务规则放到 Service。
- 新增受保护接口时必须明确使用鉴权装饰器。
- 新增数据模型时应同步准备数据库迁移 SQL。
- 前端请求统一使用 `apiRequest()`，避免页面内重复处理 token 和 401。
- 新增页面时同步更新 `Frontend/main.jsx` 路由和权限守卫。
- API 错误响应优先使用 `error` 或 `message` 字段，便于前端统一展示。

## 常用命令

```bash
# 前端开发
cd Frontend
npm run dev
npm run build
npm run lint

# 后端开发
cd Backend
python app.py

# Docker
docker-compose up --build
docker-compose down
```

## 质量检查

前端已提供 lint 脚本：

```bash
cd Frontend
npm run lint
```

后端当前未提供自动化测试脚本。后续建议补充 pytest，并覆盖认证、权限、作文评分、积分扣减、班级成员关系和管理员操作等核心流程。

## 维护入口

| 任务 | 主要文件 |
| --- | --- |
| 新增接口 | `Backend/controllers/`, `Backend/services/` |
| 新增表结构 | `Backend/models/` |
| 修改鉴权 | `Backend/services/auth_service.py`, `Frontend/main.jsx` |
| 修改 LLM 调用 | `Backend/services/llm_service.py`, `Backend/services/llm_config_service.py` |
| 修改 OCR 调用 | `Backend/services/ocr_service.py` |
| 修改前端请求 | `Frontend/src/api/client.js` |
| 新增页面 | `Frontend/src/pages/`, `Frontend/main.jsx` |
| 修改部署 | `docker-compose.yml`, `Backend/Dockerfile.backend`, `Frontend/Dockerfile.frontend`, `Frontend/nginx.conf` |

## License

当前项目未声明开源许可证。公开分发或商用前，请补充 `LICENSE` 文件。
