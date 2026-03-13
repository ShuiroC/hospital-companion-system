# 县级医院陪诊管理系统

县级医院陪诊管理系统，面向患者、陪诊员和管理员三类角色，支持陪诊服务下单、接单、服务流程推进与后台运营管理。

## 项目功能

- 患者端：注册/登录、选择医院、创建订单、支付、查看订单、评价、个人信息维护
- 陪诊员端：注册/登录、接单大厅、服务记录、订单状态推进、收入与提现页面
- 管理后台：订单管理、医院信息查看、陪诊员审核（通过/驳回）

## 技术栈

- 后端：Java 17、Spring Boot 3.3.2、MyBatis-Plus、MySQL
- 前端：Vue 3、Vite、Pinia、Element Plus、Axios
- 构建工具：Maven、npm

## 目录结构

```text
.
├─ backend/      # Spring Boot 后端
├─ frontend/     # Vue3 前端
├─ sql/          # 数据库初始化与迁移脚本
├─ docs/         # 项目文档
└─ README.md
```

## 运行环境

- JDK 17+
- Maven 3.8+
- Node.js 18+（建议）与 npm
- MySQL 8.0+

## 快速启动

### 1. 初始化数据库

1. 创建数据库并导入初始化脚本：

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p < sql/init.sql
```

2. 默认后端数据库配置在 `backend/src/main/resources/application.yml`：
   - 数据库：`county_companion`
   - 用户名：`root`
   - 密码：`123456`

如果你的本地 MySQL 账号或密码不同，请先修改上述配置。

### 2. 启动后端（端口 8080）

方式一（推荐开发）：

```bash
cd backend
mvn spring-boot:run
```

方式二（先打包再运行）：

```bash
cd backend
mvn -DskipTests package
java -jar target/companion-backend-0.0.1-SNAPSHOT.jar
```

Windows 下也可以直接运行：

```powershell
backend\start-backend.cmd
```

启动后可访问：

- API 示例：`http://localhost:8080/api/hospitals`
- 管理后台：`http://localhost:8080/`

### 3. 启动前端（端口 5173）

```bash
cd frontend
npm install
npm run dev
```

访问：`http://localhost:5173`

前端已通过 Vite 代理将 `/api` 请求转发到 `http://localhost:8080`。

## 默认体验账号

- 患者账号：`13800001111` / `123123`
- 陪诊员账号：`13800001112` / `123123`（默认待审核）
- 后台管理员：`root` / `123456`（用于 `http://localhost:8080/`）

说明：

- 当前注册/登录逻辑中，业务固定密码为 `123123`（患者/陪诊员）
- 陪诊员账号需要先在管理后台审核通过后才能正常登录陪诊员端

## 常见问题

- 前端启动后无法请求后端：确认后端已在 `8080` 端口启动
- 数据库连接失败：检查 `application.yml` 中 MySQL 地址、账号、密码
- 陪诊员无法登录：先在后台页面审核该账号


