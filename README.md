# 车载可视化系统 (Vehicle HMI)

基于 **NestJS + React + Electron** 的车载数据可视化系统。采用 **Monorepo** 架构，支持 2D 仪表盘、3D 数字孪生、故障监测、数据录制与回放。无需实际硬件接入，内置 CAN 数据模拟器即可直接预览。

## ✨ 核心特性

*   **2D 仪表盘**：包含基于 Canvas/ECharts 的车速、转速、水温、电压表盘，以及时序趋势曲线（60秒滑动窗口）。支持车门、胎压、状态面板监测。内置 PlaybackBar 支持历史数据回放。
*   **3D 数字孪生**：基于 ThreeJS/React-Three-Fiber 实现的 3D 车辆模型，带滚动驾驶环境（道路标线动画、InstancedMesh 建筑物/树木/路灯），实时联动车况数据（车速驱动场景滚动、刹车灯/转向灯/大灯动画、转向轮偏转），使用 Clock + `useFrame(delta)` 实现帧率无关的平滑动画。
*   **故障监控与管理**：实时解析 CAN 故障码并分类（轻微/一般/严重），支持故障日志记录、清除、历史查询及弹窗告警。
*   **数据录制与回放**：支持运行中车况数据的实时录制、持久化及 JSON/MCAP 格式导出与管理。
*   **Foxglove 集成**：兼容 [Foxglove](https://foxglove.dev) WebSocket 协议，Foxglove Desktop 可实时连接 `ws://localhost:3101` 查看车况数据。支持导出 MCAP 标准格式文件。
*   **跨平台桌面端**：基于 Electron 打包，支持在 Windows、Linux (包含 ARM64 车机端) 平台独立运行。

---

## 🛠 技术栈与架构

本项目采用 **Turborepo** + **Bun** 进行 Monorepo 管理。

| 模块 | 技术选型 | 备注 |
| :--- | :--- | :--- |
| **包管理器** | **Bun** | 极速的 JavaScript 运行时及包管理工具 (`bun.lock`) |
| **构建系统** | **Turborepo** | 高效的 Monorepo 构建系统 |
| **代码规范** | **Biome** | 替代 ESLint/Prettier 的下一代极速代码格式化及检查工具 |
| **桌面框架** | **Electron** | 将前端应用与 Node 运行时打包为跨平台桌面应用 |
| **前端应用** | **React 19 + Vite + TypeScript** | 提供 2D (ECharts) / 3D (@react-three/fiber) 数据渲染 |
| **后端网关** | **NestJS 11** | 提供 CAN 总线数据采集、持久化及 API 服务 |
| **实时通信** | **Socket.IO** | 前后端基于 WebSocket 的低延迟实时数据推送 |
| **Foxglove 协议** | **@foxglove/ws-protocol** | Foxglove Desktop 兼容的 WebSocket 数据桥接 (`ws://localhost:3101`) |
| **MCAP 导出** | **@mcap/core** | 行业标准 MCAP 格式录制导出，兼容 Foxglove/WebViz 等工具 |
| **数据存储** | **SQLite** | 轻量级本地数据库，存储故障及录制配置数据 |
| **持续集成** | **GitLab CI** | 内置 `.gitlab-ci.yml` 自动化依赖检查、格式化与构建 |

---

## 📂 项目结构

```text
vehicle-visual/
├── apps/
│   ├── backend/              # [NestJS] 后端网关服务
│   │   └── src/modules/
│   │       ├── can-bus/      # CAN 数据采集与 WebSocket 推送
│   │       ├── fault/        # 故障码管理 (CRUD)
│   │       ├── foxglove/     # Foxglove WS 协议桥接 + MCAP 导出
│   │       ├── record/       # 数据录制与导出
│   │       └── config/       # 系统配置读取
│   ├── frontend/             # [React] 可视化前端
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Panel/        # Foxglove 风格 Panel 容器 (可拖拽工具栏)
│   │   │   │   └── PlaybackBar/ # 时间轴回放控制器 (播放/暂停/速率)
│   │   │   ├── topics.ts        # Topic 数据总线 (发布/订阅)
│   │   │   └── pages/
│   │   │       ├── dashboard-2d/ # 2D 仪表盘面板
│   │   │       ├── vehicle-3d/   # 3D 数字孪生面板
│   │   │       └── log-manage/   # 故障日志与录制管理界面
│   └── desktop/              # [Electron] 桌面客户端外壳
├── packages/
│   └── can-simulator/        # [Library] CAN 数据模拟器及公共类型定义
├── dbc/                      # DBC 协议文件目录 (可选)
├── config/                   # 外部系统配置文件目录 (`default.yaml`)
├── database/                 # SQLite 数据库文件挂载目录
└── .gitlab-ci.yml            # GitLab CI/CD 自动化流水线配置
```

---

## 🚀 快速开始

### 1. 环境准备

*   安装 **Bun** (推荐 >= `v1.3.0`): `curl -fsSL https://bun.sh/install | bash`
*   Node.js (可选，某些系统编译可能依赖)

### 2. 安装与启动

```bash
# 克隆仓库
git clone <your-repo-url>
cd vehicle-visual

# 安装所有依赖（根目录执行）
bun install --frozen-lockfile

# 启动开发环境（Turbo 会并行启动 backend 和 frontend）
bun run dev

# 如果你需要启动 Electron 桌面端进行调试：
cd apps/desktop
bun run dev
```

> **注意**: 前端默认对每 50ms 到达的 WebSocket 数据做了 **200ms 限流**，并使用 **RingBuffer** 存储最近 500 条历史记录，避免高频更新导致浏览器 OOM。如需调整，修改 `apps/frontend/src/hooks/useVehicleData.ts` 中的 `THROTTLE_MS` 和 `apps/frontend/src/store.ts` 中的 `MAX_HISTORY`。

*   **Web 预览**: 浏览器打开 `http://localhost:5173`
*   **后端 API**: 默认运行于 `http://localhost:3100`

---

## 📜 常用命令 (Scripts)

在项目根目录下，你可以使用以下命令进行统一管理：

```bash
bun run dev           # 并行启动前端与后端开发服务器
bun run build         # 执行所有子项目的生产环境构建
bun run lint          # 使用 Biome 进行全项目代码规范检查
bun run format        # 使用 Biome 进行全项目代码格式化修复
bun run format:check  # 仅检查代码格式是否合规 (CI 环境常用)
```

---

## ⚙️ 系统配置

系统级配置可通过编辑根目录下的 `config/default.yaml` 文件来调整。支持调整的参数包括：
*   WebSocket 刷新频率
*   CAN 模拟器数据上下限
*   异常告警阈值设定

---

## 🧩 Foxglove 集成

本项目深度参考 [Foxglove](https://foxglove.dev) 的设计模式，实现了一套轻量级的数据可视化架构。

### Foxglove 协议桥接

后端内置 **Foxglove WebSocket 服务器** (`ws://localhost:3101`)，使用 `@foxglove/ws-protocol` 实现与 Foxglove Desktop 的原生兼容：

```bash
# Foxglove Desktop 中连接
ws://localhost:3101
```

连接后即可实时查看 `/vehicle/state` 话题的 JSON 数据流。

### MCAP 格式导出

录制数据支持导出为 **MCAP** (v0) 标准格式：

```
GET /api/foxglove/export/:recordId
```

MCAP 文件可导入 Foxglove Desktop、WebViz 等工具进行离线分析。

### 前端 Topic 数据总线

参考 Foxglove 的话题路由模式，前端实现了轻量级 **Topic 发布/订阅系统** (`src/topics.ts`)，组件通过 `useTopic()` Hook 按需订阅数据，避免全局 store 滥用。

| Topic | 数据类型 | 说明 |
| :--- | :--- | :--- |
| `/vehicle/state` | `VehicleState` | 当前车况数据 |
| `/vehicle/history` | `VehicleState[]` | 历史数据 (最近 500 条) |

### Panel 容器 & 回放控制器

- **`<Panel>`**：通用面板容器组件，提供标题栏、工具栏插槽，替换原始 `.card` 模式
- **`<PlaybackBar>`**：时间轴回放控件，支持 **播放/暂停**、**0.25x–5x 速率调节**，通过 topic 推送回放数据，所有订阅面板自动响应

---

## 📦 打包与部署

桌面端应用打包依赖 `electron-builder`。

### 构建 Windows 绿色版 / 安装包
```bash
# 确保根目录依赖已构建
bun run build

# 进入桌面端目录进行打包
cd apps/desktop
npx electron-builder --win portable
# 或构建安装包
npx electron-builder --win nsis
```

### 车机端 Linux 部署 (ARM64)
若需部署至车载 ARM64 Linux 环境，需配置好相应的交叉编译环境并执行：
```bash
cd apps/desktop
npx electron-builder --linux arm64
```
