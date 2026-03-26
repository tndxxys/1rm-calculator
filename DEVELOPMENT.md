# 1RM 计算器 - 开发文档

## 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能模块](#核心功能模块)
- [API 文档](#api-文档)
- [开发指南](#开发指南)
- [构建和部署](#构建和部署)
- [测试](#测试)

---

## 项目概述

1RM 计算器是一个离线力量训练工具，用于根据训练组数据估算单次最大重量（One Rep Max, 1RM）。用户输入重量、次数和 RPE（自感用力度），应用会使用多种经典公式计算 e1RM（估算 1RM），并提供目标 RM 的重量建议。

### 主要功能

- **1RM 估算**：支持 6 种经典公式的计算和对比
- **智能推荐**：根据有效次数自动选择最佳公式组合
- **目标 RM 计算**：反向计算 1RM/3RM/5RM/8RM/10RM/12RM
- **RPE/RIR 转换**：显示自感用力度对应的储备次数
- **置信度评估**：根据输入数据给出估算可信度
- **历史记录**：本地存储最近 20 条计算记录
- **双单位支持**：kg 和 lb 切换

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.5.3 | 类型安全 |
| Vite | 5.4.1 | 构建工具 |
| Vitest | 3.2.4 | 测试框架 |
| ESLint | 9.9.0 | 代码检查 |

### 桌面应用

| 技术 | 版本 | 用途 |
|------|------|------|
| Tauri | 2.10.3 | 桌面应用框架 |
| Rust | 1.77.2+ | 后端语言 |

---

## 项目结构

```
1RM计算器/
├── index.html                 # HTML 入口
├── package.json               # NPM 配置
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
│
├── src/                       # 前端源代码
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 主应用组件
│   ├── App.css                # 应用样式
│   ├── index.css              # 全局样式
│   │
│   ├── domain/                # 业务逻辑层
│   │   ├── estimate.ts        # 核心估算引擎
│   │   ├── estimate.test.ts   # 估算测试
│   │   ├── formulas.ts        # 1RM 公式实现
│   │   └── rpe.ts             # RPE/RIR 转换
│   │
│   ├── storage/               # 数据存储层
│   │   └── history.ts         # 历史记录管理
│   │
│   └── test/                  # 测试配置
│       └── setup.ts           # 测试环境设置
│
├── src-tauri/                 # Tauri 后端
│   ├── tauri.conf.json        # Tauri 配置
│   ├── Cargo.toml             # Rust 依赖
│   ├── src/
│   │   ├── lib.rs             # Tauri 库
│   │   └── main.rs            # Rust 入口
│   └── icons/                 # 应用图标
│
└── dist/                      # 构建产物
```

---

## 核心功能模块

### 1. 估算引擎 (`src/domain/estimate.ts`)

核心模块，负责协调公式计算、置信度评估和结果生成。

**主要类型：**

```typescript
// 输入类型
type EstimateInput = {
  weight: number    // 重量
  reps: number      // 次数
  rpe: number       // RPE (6-10)
  unit: Unit        // 单位 ('kg' | 'lb')
}

// 输出类型
type EstimateOutput = {
  input: EstimateInput
  rir: number                    // 储备次数
  effectiveReps: number          // 有效次数
  formulas: FormulaResult[]      // 各公式结果
  recommended: {
    e1rm: number                 // 推荐 1RM
    confidence: Confidence       // 置信度
    formulaKey: FormulaKey       // 参考公式
    targetRms: TargetRm[]        // 目标 RM
    reason: string               // 选择原因
  }
  warnings: string[]             // 警告信息
}
```

**主要函数：**

| 函数 | 说明 |
|------|------|
| `buildEstimate(input)` | 构建完整估算结果 |
| `isValidInput(input)` | 验证输入有效性 |
| `formatWeight(value, unit)` | 格式化重量显示 |

### 2. 公式模块 (`src/domain/formulas.ts`)

实现 6 种经典 1RM 估算公式。

**支持的公式：**

| 公式 | 计算方式 |
|------|----------|
| Epley | `weight × (1 + reps / 30)` |
| Brzycki | `weight / (1.0278 - 0.0278 × reps)` |
| Lombardi | `weight × reps^0.1` |
| O'Conner | `weight × (1 + 0.025 × reps)` |
| Mayhew | `(100 × weight) / (52.2 + 41.9 × e^(-0.055 × reps))` |
| Wathen | `(100 × weight) / (48.8 + 53.8 × e^(-0.075 × reps))` |

**主要函数：**

| 函数 | 说明 |
|------|------|
| `estimateByFormula(weight, reps, formula)` | 使用指定公式估算 1RM |
| `deriveWeightFromE1rm(e1rm, reps, formula)` | 从 1RM 反推目标重量 |
| `deriveTargetRmWeights(e1rm, formula)` | 计算所有目标 RM |
| `estimateAllFormulas(weight, reps)` | 使用所有公式估算 |

### 3. RPE 模块 (`src/domain/rpe.ts`)

处理 RPE 和 RIR 的转换，以及置信度计算。

**RPE 到 RIR 映射：**

| RPE | RIR |
|-----|-----|
| 10 | 0 |
| 9.5 | 0.5 |
| 9 | 1 |
| 8.5 | 1.5 |
| 8 | 2 |
| 7.5 | 2.5 |
| 7 | 3 |
| 6.5 | 3.5 |
| 6 | 4 |

**主要函数：**

| 函数 | 说明 |
|------|------|
| `rpeToRir(rpe)` | RPE 转换为 RIR |
| `calcEffectiveReps(reps, rpe)` | 计算有效次数 |
| `getConfidence(effectiveReps, rpe)` | 获取置信度 |

**置信度规则：**

| 置信度 | 条件 |
|--------|------|
| 高 | 有效次数 ≤ 10 且 RPE ≥ 8 |
| 中 | 有效次数 ≤ 12 且 RPE ≥ 7 |
| 低 | 有效次数 > 12 或 RPE < 7 |

### 4. 存储模块 (`src/storage/history.ts`)

管理 localStorage 中的历史记录。

**存储结构：**

```typescript
type SavedEntry = {
  id: string           // 唯一标识
  createdAt: string    // 创建时间 (ISO)
  input: EstimateInput // 输入参数
  recommended: number  // 推荐的 e1RM
  confidence: Confidence
}
```

**主要函数：**

| 函数 | 说明 |
|------|------|
| `loadHistory()` | 加载历史记录 |
| `saveHistory(entries)` | 保存历史记录 |

---

## API 文档

### 状态管理

应用使用 React `useState` 管理状态：

```typescript
// 输入状态
const [input, setInput] = useState<EstimateInput>(defaultInput)

// 历史记录
const [history, setHistory] = useState<SavedEntry[]>([])

// 复制状态
const [copied, setCopied] = useState(false)
```

### 智能推荐逻辑

应用根据有效次数选择不同的公式组合：

```typescript
// 有效次数 ≤ 10
keys: ['Brzycki', 'Epley', 'Wathen']

// 有效次数 > 10
keys: ['Wathen', 'Mayhew', 'Epley']
```

推荐值为选中公式结果的中位数。

---

## 开发指南

### 环境要求

- Node.js 18+
- Rust 1.77.2+ (打包桌面应用需要)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动前端开发服务器
npm run dev

# 启动 Tauri 开发模式
npm run tauri dev
```

### 代码规范

```bash
# 运行代码检查
npm run lint
```

### 添加新公式

1. 在 `src/domain/formulas.ts` 中添加公式类型：

```typescript
export type FormulaKey =
  | 'Epley'
  | 'Brzycki'
  | 'Lombardi'
  | "O'Conner"
  | 'Mayhew'
  | 'Wathen'
  | 'NewFormula'  // 添加新公式
```

2. 在 `estimateByFormula` 函数中添加计算逻辑：

```typescript
case 'NewFormula':
  return weight * (1 + reps / 25)  // 示例公式
```

3. 在 `deriveWeightFromE1rm` 函数中添加反向计算：

```typescript
case 'NewFormula':
  return e1rm / (1 + reps / 25)
```

4. 在 `estimateAllFormulas` 的公式列表中添加新公式。

---

## 构建和部署

### 构建前端

```bash
npm run build
```

产物位于 `dist/` 目录。

### 构建桌面应用

```bash
npm run tauri build
```

产物位于 `src-tauri/target/release/bundle/` 目录：

| 平台 | 产物 |
|------|------|
| macOS | `.app` 和 `.dmg` |
| Windows | `.exe` 和 `.msi` |
| Linux | `.deb` 和 `.AppImage` |

### Tauri 配置

配置文件：`src-tauri/tauri.conf.json`

```json
{
  "productName": "1RM Calculator",
  "identifier": "com.yzb.onermcalculator",
  "version": "0.1.0",
  "app": {
    "windows": [{
      "title": "1RM Calculator",
      "width": 1360,
      "height": 920,
      "minWidth": 980,
      "minHeight": 760
    }]
  }
}
```

---

## 测试

### 运行测试

```bash
npm run test
```

### 测试文件

| 文件 | 测试内容 |
|------|----------|
| `src/domain/estimate.test.ts` | 估算引擎测试 |
| `src/App.test.tsx` | UI 组件测试 |

### 测试覆盖

- RPE/RIR 转换
- 有效次数计算
- 各公式估算
- 输入验证
- 置信度评估
- 警告信息

---

## 架构设计

### 分层架构

```
┌─────────────────────────────────────────────┐
│              表现层 (Presentation)           │
│  App.tsx - React 组件、状态管理、事件处理     │
├─────────────────────────────────────────────┤
│              领域层 (Domain)                 │
│  ├── estimate.ts  估算引擎、类型定义         │
│  ├── formulas.ts  1RM 公式实现               │
│  └── rpe.ts       RPE/RIR 转换               │
├─────────────────────────────────────────────┤
│              存储层 (Storage)                │
│  history.ts - localStorage 持久化            │
└─────────────────────────────────────────────┘
```

### 设计原则

1. **纯函数设计**：领域层全是纯函数，易于测试和维护
2. **类型安全**：全面使用 TypeScript 类型定义
3. **单一职责**：每个模块只负责一个功能
4. **离线优先**：所有计算在本地完成，无需网络

---

## 常见问题

### Q: 如何修改默认值？

修改 `src/domain/estimate.ts` 中的 `defaultInput`：

```typescript
export const defaultInput: EstimateInput = {
  weight: 0,
  reps: 0,
  rpe: 10,
  unit: 'kg',
}
```

### Q: 如何修改历史记录数量限制？

修改 `src/App.tsx` 中的 `HISTORY_LIMIT`：

```typescript
const HISTORY_LIMIT = 20  // 修改为所需数量
```

### Q: 如何添加新的目标 RM？

修改 `src/domain/formulas.ts` 中的 `TARGET_RM_REPS`：

```typescript
export const TARGET_RM_REPS = [1, 3, 5, 8, 10, 12, 15] as const
```

---

## 版本历史

### v0.1.0 (当前版本)

- 支持 6 种 1RM 估算公式
- 智能推荐系统
- 目标 RM 计算
- RPE/RIR 转换
- 置信度评估
- 历史记录
- 中文本地化

---

## 许可证

MIT License
