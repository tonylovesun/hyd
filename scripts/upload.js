const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

async function upload() {
  const appid = process.env.WX_APPID;
  const privateKey = process.env.WX_PRIVATE_KEY;
  
  console.log('=== 开始上传小程序 ===');
  console.log('AppID:', appid);
  console.log('Has PrivateKey:', !!privateKey);
  
  if (!appid || !privateKey) {
    console.error('错误: 缺少 WX_APPID 或 WX_PRIVATE_KEY 环境变量');
    console.error('当前环境变量:', Object.keys(process.env).filter(k => k.startsWith('WX_')));
    process.exit(1);
  }
  
  // 私钥路径
  const keyPath = path.join(__dirname, 'private.key');
  
  try {
    // 写入私钥文件
    fs.writeFileSync(keyPath, privateKey);
    console.log('私钥文件已写入:', keyPath);
    
    // 检查私钥文件
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    console.log('私钥文件大小:', keyContent.length, '字节');
    console.log('私钥开头:', keyContent.substring(0, 50));
    
    // 创建项目
    const project = new ci.Project({
      appid: appid,
      type: 'miniProgram',
      projectPath: process.cwd(),
      privateKeyPath: keyPath,
      ignores: ['node_modules/**/*'],
    });
    console.log('项目配置完成');
    
    // 预览/发布体验版
    const qrcodePath = path.join(__dirname, 'preview-qrcode.png');
    const previewResult = await ci.preview({
      project: project,
      version: process.env.GITHUB_RUN_NUMBER || '1.0.0',
      desc: 'GitHub Actions 自动发布体验版 - ' + (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'local'),
      setting: {
        es6: true,
        minify: true,
        minifyWXML: true,
        minifyWXSS: true,
        minifyJS: true,
      },
      qrcodeOutputPath: qrcodePath,
      onProgressUpdate: (progress) => {
        console.log('上传进度:', progress.message || progress);
      },
    });
    
    console.log('=== 体验版发布成功 ===');
    console.log('版本:', previewResult.version);
    console.log('提示:', previewResult.extMsg || '请在微信公众平台查看体验版');
    
    // 上传二维码作为 artifact（GitHub Actions 会自动处理）
    
  } catch (err) {
    console.error('=== 上传失败 ===');
    console.error('错误类型:', err.constructor.name);
    console.error('错误信息:', err.message);
    if (err.response) {
      console.error('响应数据:', JSON.stringify(err.response.data, null, 2));
    }
    console.error('完整错误:', err);
  } finally {
    // 清理私钥文件
    if (fs.existsSync(keyPath)) {
      fs.unlinkSync(keyPath);
      console.log('私钥文件已清理');
    }
  }
}

upload().then(() => {
  console.log('脚本执行完成');
  process.exit(0);
}).catch(err => {
  console.error('未处理的错误:', err);
  process.exit(1);
});
