# 简医记 - 自动部署设置脚本

## 第一步：添加 GitHub Secrets

由于私钥不能通过脚本传输，请手动操作：

1. 打开浏览器，登录 GitHub: https://github.com
2. 进入你的仓库（或创建新仓库 `hyd`）
3. 点击 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
4. 添加两个 secrets：

### Secret 1: WX_APPID
- **Name**: `WX_APPID`
- **Value**: `wx4f599453c329d464`

### Secret 2: WX_PRIVATE_KEY  
- **Name**: `WX_PRIVATE_KEY`
- **Value**: 粘贴你的私钥（以 `-----BEGIN RSA PRIVATE KEY-----` 开头的全部内容）

---

## 第二步：推送代码到 GitHub

打开 PowerShell，运行以下命令：

```powershell
# 进入项目目录
cd G:\miniprogram\hyd

# 初始化 Git（如果还没初始化）
git init
git add .
git commit -m "feat: 极简风格首页重设计"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/tonylovesun/hyd.git
git branch -M main
git push -u origin main
```

---

## 第三步：验证自动部署

1. 推送代码后，打开 GitHub 仓库
2. 点击 **Actions** 标签页
3. 应该能看到 "Deploy Mini Program" workflow 正在运行
4. 等待几分钟后，检查是否成功

---

## 以后更新代码

只需要：
```powershell
cd G:\miniprogram\hyd
git add .
git commit -m "你的修改说明"
git push
```

代码会自动构建并上传到微信小程序后台，你只需要登录微信公众平台提交审核即可。

---

## 如需创建新仓库

如果还没有创建 GitHub 仓库，运行：
```powershell
gh repo create hyd --public --source=. --push
```
