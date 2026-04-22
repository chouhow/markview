# MarkView - 项目信息

## 1. 基本信息

| 项目 | 说明 |
|:---|:---|
| **项目名称** | MarkView |
| **类型** | Markdown 教程展示平台 |
| **GitHub 仓库** | https://github.com/chouhow/markview |
| **服务器 IP** | 139.224.239.77 |
| **部署路径** | /var/www/markview |
| **容器** | markview-backend, markview-frontend |

## 2. 技术栈

| 层级 | 技术 |
|:---|:---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Python 3.12 + FastAPI + Pydantic |
| 部署 | Docker + Docker Compose + Nginx |
| CI/CD | GitHub Actions |

## 3. 访问地址

| 服务 | 地址 |
|:---|:---|
| 网站 | http://139.224.239.77 |
| API 文档 | http://139.224.239.77:8000/api/docs |
| 健康检查 | http://139.224.239.77:8000/api/health |

## 4. API 接口

| 接口 | 方法 | 说明 |
|:---|:---|:---|
| /api/health | GET | 健康检查 |
| /api/chapters | GET | 章节列表 |
| /api/chapters/{id} | GET | 章节详情 |
| /api/chapters/{id} | PUT | 保存编辑后的内容 |
| /api/chapters/search/{kw} | GET | 搜索章节 |

## 5. GitHub Secrets（已配置）

| Secret | 值 |
|:---|:---|
| SERVER_HOST | 139.224.239.77 |
| SERVER_USER | admin |
| SSH_PRIVATE_KEY | ~/.ssh/deploy_key |

## 6. 部署方式

```bash
cd /var/www/markview
docker compose up -d --build
```

## 7. 功能特性

- Markdown 渲染（代码高亮、表格、引用等）
- 编辑模式（删除元素、文本高亮/标红）
- 保存编辑后的内容到服务器
- 代码主题切换（8种主题）
- 响应式布局（桌面+移动端）
- 7章示例教程（ES6 JavaScript）

## 8. 镜像加速（已配置）

- Docker: https://azj68yb9.mirror.aliyuncs.com
- pip: https://mirrors.aliyun.com/pypi/simple/

## 9. 常用命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs markview-backend
docker logs markview-frontend

# 重启
docker compose restart

# 停止
docker compose down

# 更新代码并重新部署
cd /var/www/markview && git pull origin main && docker compose up -d --build
```
