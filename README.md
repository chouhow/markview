# MarkView

基于 FastAPI + React 的 Markdown 教程展示平台，支持 Markdown 渲染、代码高亮、在线编辑等功能。不局限于任何特定技术，可用于展示任意 Markdown 格式的教程文档。

## 项目结构

```
markview/
├── frontend/          # React + TypeScript 前端
│   ├── src/           # 源代码
│   ├── public/        # 静态资源（MD 文件、图片）
│   ├── Dockerfile     # 前端 Docker 构建
│   └── nginx.conf     # Nginx 配置
├── backend/           # Python FastAPI 后端
│   ├── app/           # 应用代码
│   │   ├── api/       # API 路由
│   │   ├── core/      # 核心配置
│   │   ├── models/    # Pydantic 模型
│   │   └── services/  # 业务逻辑
│   ├── Dockerfile     # 后端 Docker 构建
│   └── requirements.txt
├── shared/            # 共享类型定义
├── docker-compose.yml # Docker 编排
└── .github/workflows/ # CI/CD 配置
```

## 技术栈

| 层级 | 技术 |
|:---|:---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Python 3.12 + FastAPI + Pydantic |
| 部署 | Docker + Docker Compose + Nginx |
| CI/CD | GitHub Actions |

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone <仓库地址>
cd markview

# 2. 一键启动
docker-compose up -d --build

# 3. 访问
# 前端：http://localhost
# 后端 API：http://localhost:8000/api/docs
```

### 方式二：本地开发

**前端：**
```bash
cd frontend
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建
```

**后端：**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API 接口

| 接口 | 方法 | 说明 |
|:---|:---|:---|
| `/api/health` | GET | 健康检查 |
| `/api/chapters` | GET | 获取章节列表 |
| `/api/chapters/{id}` | GET | 获取章节详情 |
| `/api/chapters/search/{keyword}` | GET | 搜索章节 |

## CI/CD 配置

需要在 GitHub Secrets 中配置以下变量：

| Secret | 说明 |
|:---|:---|
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | 服务器用户名 |
| `SSH_PRIVATE_KEY` | SSH 私钥 |

## License

MIT
MIT
