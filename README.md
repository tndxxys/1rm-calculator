# 1RM 计算器

离线 Tauri + React 计算器，用于估算 1RM、目标 RM 重量和公式对比。

## 脚本

- `npm run dev`: 在端口 `1420` 运行 Vite 前端
- `npm run test`: 运行单元测试和 UI 测试
- `npm run build`: 类型检查并构建前端
- `npm run tauri dev`: 安装 Rust 后启动桌面应用

## 说明

- 当前机器缺少 `rustc` 和 `cargo`，因此在安装 Rust 工具链之前无法构建 Tauri 应用。
- 计算完全在本地进行，历史记录存储在 `localStorage` 中。
