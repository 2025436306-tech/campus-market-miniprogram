# 拾集校园 (Campus Market) 🎓
基于 Taro + React + 微信小程序云开发的校园二手交易及社交平台。

[![Platform](https://img.shields.io/badge/Platform-WeChat-07C160.svg)](https://mp.weixin.qq.com/)
[![Framework](https://img.shields.io/badge/Framework-Taro-0052D9.svg)](https://taro.jd.com/)
[![Cloud](https://img.shields.io/badge/Database-TencentCloud-00A4FF.svg)](https://cloud.tencent.com/)

## 🌟 项目简介
“拾集校园”是一款专为大学生打造的二手好物循环平台。项目集成了**二手交易、校园动态、即时通讯、订单闭环**等功能，旨在通过数字化手段解决校园内“闲置处理难、交易不安全、信息不对称”的痛点。

## 🚀 核心功能
### 1. 二手交易闭环
- **智能搜索与分类**：支持多维度关键词检索及图书、数码、生活用品等分类。
- **发布系统**：支持上传图片、设置价格、标签，以及“支持小刀”议价开关。
- **交易模式**：支持“校园面交”与“邮寄快递”两种模式，面交支持扫码收货逻辑。
- **收藏与足迹**：记录用户的浏览习惯，方便快速找回心仪宝贝。

### 2. 即时通讯系统 (Real-time IM)
- **实时对话**：基于云开发 `Watch API` 实现双向实时聊天，消息毫秒级同步。
- **消息列表**：自动更新会话预览、计算未读红点，支持左滑删除会话。

### 3. 社交与互动
- **校园圈**：类似朋友圈的社区功能，支持发布动态、查看广场。
- **卖家主页**：支持关注卖家、查看其名下所有在售商品。
- **留言系统**：在商品详情页下方可直接进行公开咨询。

### 4. 安全治理
- **身份认证**：集成校园身份认证流程。
- **投诉举报**：针对违规商品、言论或用户，一键提交截图证据至管理员后台。

## 🛠️ 技术栈
- **前端框架**：Taro (React)
- **全局状态**：React Hooks
- **样式处理**：Tailwind CSS (高性能原子类样式)
- **后端服务**：微信小程序云开发 (Cloud Development)
  - **云数据库**：非关系型 NoSQL 存储。
  - **云存储**：商品及举报证据图片持久化。
  - **云函数**：处理复杂逻辑及内容安全审核。

## 📸 界面预览 (示例)
<img width="325" height="673" alt="image" src="https://github.com/user-attachments/assets/dcf4896d-df79-44c8-9ca1-3040ea268908" />
<img width="321" height="657" alt="image" src="https://github.com/user-attachments/assets/bf038dd2-f354-442f-bc3e-0c45c5277bce" />
<img width="318" height="663" alt="image" src="https://github.com/user-attachments/assets/7cb7e8fb-af41-48de-bf53-16c55133f08d" />
<img width="317" height="665" alt="image" src="https://github.com/user-attachments/assets/e909ab47-b6df-47e8-82df-aa9f47cfe035" />


| 首页 | 商品详情 | 消息中心 |
| :---: | :---: | :---: |
| [图片链接] | [图片链接] | [图片链接] |

## 📦 快速开始
1. **克隆项目**
   ```bash
   git clone [https://github.com/2025436306-tech/campus-market-miniprogram.git](https://github.com/2025436306-tech/campus-market-miniprogram.git)
