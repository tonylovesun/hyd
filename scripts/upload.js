const ci = require('miniprogram-ci');
const path = require('path');

async function upload() {
  const appid = process.env.WX_APPID;
  const privateKey = process.env.WX_PRIVATE_KEY;
  
  if (!appid || !privateKey) {
    console.error('Missing WX_APPID or WX_PRIVATE_KEY environment variables');
    process.exit(1);
  }
  
  // Write private key to temp file
  const keyPath = path.join(__dirname, 'private.key');
  require('fs').writeFileSync(keyPath, privateKey);
  
  const project = new ci.Project({
    appid: appid,
    type: 'miniProgram',
    projectPath: process.cwd(),
    privateKeyPath: keyPath,
    ignores: ['node_modules/**/*'],
  });
  
  const uploadResult = await ci.upload({
    project: project,
    version: process.env.GITHUB_RUN_NUMBER || '1.0.0',
    desc: 'GitHub Actions 自动部署 - ' + (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : ''),
    setting: {
      es6: true,
      minify: true,
    },
    onProgressUpdate: (progress) => {
      console.log('upload progress:', progress);
    },
  });
  
  console.log('Upload success:', uploadResult);
  
  // Clean up
  require('fs').unlinkSync(keyPath);
}

upload().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
