# 1RM 计算器

一款离线的单次最大重量（One Rep Max）估算工具，帮助力量训练者根据训练组数据科学估算自己的极限重量。

![Tauri](https://img.shields.io/badge/Tauri-2.10-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)

## 功能特性

- **多公式估算** - 支持 6 种经典 1RM 估算公式的计算与对比
  - Epley
  - Brzycki
  - Lombardi
  - O'Conner
  - Mayhew
  - Wathen

- **智能推荐** - 根据有效次数自动选择最佳公式组合，取中位数作为推荐值

- **目标 RM 计算** - 从估算的 1RM 反向计算各目标次数的最大重量
  - 1RM, 3RM, 5RM, 8RM, 10RM, 12RM

- **RPE/RIR 转换** - 显示自感用力度对应的储备次数

- **置信度评估** - 根据输入数据给出估算可信度（高/中/低）

- **历史记录** - 本地存储最近 20 条计算记录

- **双单位支持** - 支持 kg 和 lb 切换

- **离线使用** - 所有计算在本地完成，无需网络

## 下载安装

### macOS

从 [Releases](https://github.com/tndxxys/1rm-calculator/releases) 页面下载 `.dmg` 文件，双击安装即可。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/tndxxys/1rm-calculator.git
cd 1rm-calculator

# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建生产版本
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

## 使用方法

1. 输入训练组的**重量**和**次数**
2. 选择 **RPE**（自感用力度，6-10）
3. 选择单位（kg 或 lb）
4. 查看估算结果和目标 RM

### RPE 说明

| RPE | 含义 |
|-----|------|
| 10 | 完全力竭，无法再做任何一次 |
| 9 | 还能做 1 次 |
| 8 | 还能做 2 次 |
| 7 | 还能做 3 次 |
| 6 | 还能做 4 次 |

### 置信度说明

| 置信度 | 条件 |
|--------|------|
| 高 | 有效次数 ≤ 10 且 RPE ≥ 8 |
| 中 | 有效次数 ≤ 12 且 RPE ≥ 7 |
| 低 | 有效次数 > 12 或 RPE < 7 |

> **提示**: 使用接近力竭的组数（RPE 8-10，次数 1-8）可以获得更准确的估算结果。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **桌面应用**: Tauri 2 + Rust
- **测试**: Vitest + Testing Library

## 开发

```bash
# 安装依赖
npm install

# 启动前端开发服务器
npm run dev

# 运行测试
npm run test

# 代码检查
npm run lint

# 构建前端
npm run build
```

详细的开发文档请参阅 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 项目结构

```
├── src/                    # 前端源代码
│   ├── domain/             # 业务逻辑层
│   │   ├── estimate.ts     # 估算引擎
│   │   ├── formulas.ts     # 1RM 公式
│   │   └── rpe.ts          # RPE/RIR 转换
│   ├── storage/            # 数据存储
│   └── App.tsx             # 主组件
├── src-tauri/              # Tauri 后端
└── dist/                   # 构建产物
```

## 公式参考

| 公式 | 计算方式 |
|------|----------|
| Epley | `weight × (1 + reps / 30)` |
| Brzycki | `weight / (1.0278 - 0.0278 × reps)` |
| Lombardi | `weight × reps^0.1` |
| O'Conner | `weight × (1 + 0.025 × reps)` |
| Mayhew | `(100 × weight) / (52.2 + 41.9 × e^(-0.055 × reps))` |
| Wathen | `(100 × weight) / (48.8 + 53.8 × e^(-0.075 × reps))` |

## 许可证

[MIT License](./LICENSE)

## 致谢

感谢所有 1RM 估算公式的研究者们，让力量训练者能够更科学地评估自己的训练水平。
