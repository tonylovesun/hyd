// pages/index/index.js - 极简风格首页
const app = getApp();

// 类型颜色映射
const TYPE_COLORS = {
  '血常规': '#ef4444',
  '尿常规': '#f59e0b',
  '生化': '#3b82f6',
  '肝功能': '#10b981',
  '肾功能': '#8b5cf6',
  '血脂': '#ec4899',
  '血糖': '#06b6d4',
  'default': '#6b7280'
};

Page({
  data: {
    loading: false,
    recordCount: 0,
    recentRecords: [],
    previewImage: '',  // 预览图片路径
    tempImagePath: '', // 临时存储待处理图片
  },

  onLoad() {
    this.initData();
    wx.showShareMenu({ withShareTicket: true });
  },

  onShow() {
    this.fetchRecentRecords();
  },

  // 初始化数据
  async initData() {
    this.setData({ loading: true });
    
    // 检查全局变量中是否已有表数据
    if (app.globalData.tableData && app.globalData.tableData.length > 0) {
      // 已有表数据，不需要获取
    } else {
      await this.fetchTableData();
    }
    
    await this.getOpenId();
    await this.fetchRecentRecords();
    
    this.setData({ loading: false });
  },

  onPullDownRefresh() {
    this.initData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: '简医记 - 您的健康数据管家',
      path: '/pages/index/index',
      imageUrl: 'https://www.lboxshop.cc/share.jpg'
    };
  },

  // ========== 数据获取 ==========

  // 获取用户OpenID和记录数
  getOpenId() {
    return new Promise((resolve) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: 'https://jyj.lboxshop.cc/user',
              method: 'POST',
              data: { code: res.code },
              header: { 'Content-Type': 'application/json' },
              success: (res) => {
                if (res.statusCode === 200) {
                  const { openid, count } = res.data;
                  if (openid && count !== undefined) {
                    app.globalData.openid = openid;
                    this.setData({ recordCount: count });
                  }
                }
                resolve();
              },
              fail: () => resolve()
            });
          } else {
            resolve();
          }
        },
        fail: () => resolve()
      });
    });
  },

  // 获取最近记录
  fetchRecentRecords() {
    return new Promise((resolve) => {
      const openid = app.globalData.openid;
      if (!openid) {
        resolve();
        return;
      }

      wx.request({
        url: 'https://jyj.lboxshop.cc/query',
        method: 'POST',
        data: {
          openid: openid,
          category: null,
          startDate: '',
          endDate: ''
        },
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200 && res.data.length > 0) {
            // 格式化最近5条记录
            const recentRecords = res.data.slice(0, 5).map(item => ({
              id: item.id,
              cate_id: item.cate_id,
              type: item.type || '其他',
              date: this.formatDate(item.date),
              hospital: item.hospital || '未知医院',
              color: TYPE_COLORS[item.type] || TYPE_COLORS.default
            }));
            this.setData({ recentRecords });
          } else {
            this.setData({ recentRecords: [] });
          }
          resolve();
        },
        fail: () => {
          this.setData({ recentRecords: [] });
          resolve();
        }
      });
    });
  },

  // 获取表数据
  fetchTableData() {
    return new Promise((resolve) => {
      wx.request({
        url: 'https://jyj.lboxshop.cc/table-data',
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200) {
            app.globalData.tableData = res.data;
          }
          resolve();
        },
        fail: () => resolve()
      });
    });
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  },

  // ========== 页面导航 ==========

  // 跳转到详情页
  goToDetail(e) {
    const { id, cate } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${cate}`
    });
  },

  // 历史查询
  handleQueryClick() {
    this.navigateToPage('/pages/query/query');
  },

  // 手工录入
  handleInputClick() {
    this.navigateToPage('/pages/input/input');
  },

  // 趋势分析
  handleStatisticsClick() {
    this.navigateToPage('/pages/projects/projects');
  },

  // 健康提醒（暂未实现）
  handleReminderClick() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 关于
  handleAboutClick() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 菜单点击
  handleMenuClick() {
    wx.showActionSheet({
      itemList: ['趋势分析', '健康提醒', '关于'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.handleStatisticsClick();
            break;
          case 1:
            this.handleReminderClick();
            break;
          case 2:
            this.handleAboutClick();
            break;
        }
      }
    });
  },

  // 统一页面跳转
  navigateToPage(url) {
    if (app.globalData.openid) {
      wx.navigateTo({ url });
    } else {
      this.setData({ loading: true });
      const checkLogin = setInterval(() => {
        if (app.globalData.openid) {
          clearInterval(checkLogin);
          this.setData({ loading: false });
          wx.navigateTo({ url });
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkLogin);
        this.setData({ loading: false });
      }, 5000);
    }
  },

  // ========== 拍照录入 ==========

  // 拍照录入 - 选择图片后显示预览
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],  // 压缩图片
      sourceType: ['camera', 'album'],  // 支持相机和相册
      success: (res) => {
        if (!res.tempFilePaths.length) {
          wx.showToast({ title: '未选择图片', icon: 'none' });
          return;
        }
        // 保存临时路径，显示预览
        this.setData({
          tempImagePath: res.tempFilePaths[0],
          previewImage: res.tempFilePaths[0]
        });
      }
    });
  },

  // 关闭预览
  closePreview() {
    this.setData({
      previewImage: '',
      tempImagePath: ''
    });
  },

  // 确认图片，开始识别
  confirmImage() {
    const tempPath = this.data.tempImagePath;
    if (!tempPath) {
      wx.showToast({ title: '图片不存在', icon: 'none' });
      return;
    }
    // 关闭预览，开始处理
    this.setData({ previewImage: '' });
    this.processImage(tempPath);
  },

  // 阻止事件冒泡
  preventBubble() {},

  // 图片处理流程
  async processImage(imgPath) {
    wx.showLoading({ title: '识别中...', mask: true });
    try {
      const compressedPath = await this.compressImage(imgPath);
      const imageBase64 = await this.readBase64(compressedPath);
      const ocrResult = await this.callServerOCR(imageBase64);
      const parsedData = this.parseOCRResult(ocrResult);
      
      if (!parsedData) return;
      this.saveToServer(parsedData);
    } catch (error) {
      wx.hideLoading();
      wx.showModal({
        title: '识别失败',
        content: '未能识别到有效项目，建议：\n1. 拍摄时保持光线充足\n2. 确保文字清晰可见\n3. 避免手抖或倾斜',
        showCancel: false
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 图片压缩 - 提高质量和更智能的压缩
  compressImage(imgPath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imgPath,
        success: (info) => {
          console.log('原始图片:', info.width + 'x' + info.height, '格式:', info.type);
          // 降低阈值到1500px，保持更高质量
          const maxSize = 1500;
          if (info.width > maxSize || info.height > maxSize) {
            const ratio = Math.min(maxSize / info.width, maxSize / info.height);
            wx.compressImage({
              src: imgPath,
              quality: 90,  // 提高压缩质量到90
              compressedWidth: Math.round(info.width * ratio),
              compressedHeight: Math.round(info.height * ratio),
              success: (res) => {
                console.log('压缩成功:', res.tempFilePath);
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('压缩失败，使用原图:', err);
                resolve(imgPath);
              }
            });
          } else {
            console.log('图片无需压缩');
            resolve(imgPath);
          }
        },
        fail: reject
      });
    });
  },

  // 读取Base64 - 添加图片格式前缀
  readBase64(imgPath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: imgPath,
        encoding: 'base64',
        success: (res) => {
          console.log('Base64长度:', res.data.length);
          // 根据路径判断图片格式，添加前缀
          const ext = imgPath.split('.').pop().toLowerCase();
          let prefix = 'data:image/jpeg;base64,';
          if (ext === 'png') prefix = 'data:image/png;base64,';
          else if (ext === 'jpg' || ext === 'jpeg') prefix = 'data:image/jpeg;base64,';
          else if (ext === 'webp') prefix = 'data:image/webp;base64,';
          const base64WithPrefix = prefix + res.data;
          console.log('带前缀Base64长度:', base64WithPrefix.length);
          resolve(base64WithPrefix);
        },
        fail: () => reject(new Error('图片读取失败'))
      });
    });
  },

  // OCR识别
  callServerOCR(imageBase64) {
    return new Promise((resolve, reject) => {
      console.log('开始OCR识别...');
      const requestTask = wx.request({
        url: 'https://jyj.lboxshop.cc/ocr',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: { imageBase64 },
        success: (res) => {
          console.log('OCR响应:', res.statusCode, JSON.stringify(res.data).substring(0, 200));
          if (res.statusCode === 200 && res.data.code === 0 && res.data.result) {
            console.log('OCR成功，识别条目数:', res.data.result.length);
            resolve(res.data.result);
          } else {
            console.error('OCR失败:', res.data.message || '未知错误');
            reject(new Error(res.data.message || 'OCR识别失败'));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(new Error(err.errMsg || '网络请求失败'));
        }
      });

      setTimeout(() => {
        requestTask.abort();
        reject(new Error('请求超时'));
      }, 30000);
    });
  },

  // 解析OCR结果 - 恢复版（准确率高）
  parseOCRResult(ocrData) {
    if (!ocrData || !Array.isArray(ocrData)) {
      console.error('OCR数据格式异常:', typeof ocrData);
      throw new Error('OCR数据格式异常');
    }

    const texts = ocrData.map(item => ({
      text: item.DetectedText?.trim() || '',
      location: item.ItemPolygon || {}
    }));

    console.log('识别到的文字数:', texts.length);
    console.log('识别内容:', texts.map(t => t.text).join(' | '));

    // 提取医院名称
    const hospitalItem = texts.find(t => /(医院|中心|门诊|诊所)/.test(t.text));
    const hospital = hospitalItem ? hospitalItem.text : '未知';

    // 提取日期
    const dateItem = texts.find(t => /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?/.test(t.text));
    const date = dateItem ? dateItem.text : new Date().toISOString().split('T')[0];

    // 构建映射表
    const aliasMap = {};
    const tableData = app.globalData.tableData || [];
    
    tableData.forEach(item => {
      item.alias.forEach(alias => {
        aliasMap[alias] = { type: item.type, r_i: item.r_i };
      });
    });

    const aliasKeys = Object.keys(aliasMap).sort((a, b) => b.length - a.length);
    console.log('项目别名数:', aliasKeys.length);
    if (aliasKeys.length === 0) return null;

    const regex = new RegExp(aliasKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

    // 匹配项目 - 简单可靠的数值提取
    const typeCount = {};
    const matchedProjects = {};
    
    texts.forEach((textItem, index) => {
      const text = textItem.text;
      const match = text.match(regex);
      if (match) {
        const matchedAlias = match[0];
        const { type, r_i } = aliasMap[matchedAlias];
        typeCount[type] = (typeCount[type] || 0) + 1;
        console.log('匹配到项目:', matchedAlias, 'type:', type, 'r_i:', r_i);

        // 提取数值 - 简单方式
        let value = null;
        
        // 方式1: 项目名后面的数字
        const afterMatch = text.replace(matchedAlias, '').trim();
        const valueMatch = afterMatch.match(/^[：:]*\s*([<>]?\s*\d+(\.\d+)?)/);
        if (valueMatch) {
          value = parseFloat(valueMatch[1].replace(/\s/g, ''));
          console.log('  从本行提取数值:', value);
        }
        
        // 方式2: 下一行的数字
        if (value === null && index + 1 < texts.length) {
          const nextText = texts[index + 1].text;
          const nextMatch = nextText.match(/^([<>]?\s*\d+(\.\d+)?)/);
          if (nextMatch) {
            value = parseFloat(nextMatch[1].replace(/\s/g, ''));
            console.log('  从下一行提取数值:', value);
          }
        }
        
        // 方式3: 同行任意数字
        if (value === null) {
          const anyMatch = text.match(/([<>]?\s*\d+(\.\d+)?)/);
          if (anyMatch) {
            value = parseFloat(anyMatch[1].replace(/\s/g, ''));
            console.log('  从同行提取数值:', value);
          }
        }

        if (value !== null) {
          matchedProjects[r_i] = value;
        }
      }
    });

    console.log('匹配到的项目:', matchedProjects);
    console.log('类型计数:', typeCount);

    // 确定cate_id
    let cate_id = 0;
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) {
        maxCount = count;
        cate_id = parseInt(type);
      }
    }
    console.log('确定类型ID:', cate_id, '匹配数:', maxCount);

    // 过滤最终项目
    const finalProjects = {};
    tableData.forEach(item => {
      if (item.type === cate_id && matchedProjects[item.r_i] !== undefined) {
        finalProjects[item.r_i] = matchedProjects[item.r_i];
      }
    });

    console.log('最终项目:', finalProjects);

    if (Object.keys(finalProjects).length === 0) {
      wx.showToast({ title: '无有效项目', icon: 'none' });
      return null;
    }

    return { date, hospital, openid: app.globalData.openid, cate_id, ...finalProjects };
  },

    // 匹配项目
    const typeCount = {};
    const matchedProjects = {};

    items.forEach((item, index) => {
      const matchedAlias = findMatchingAlias(item.text);
      if (!matchedAlias) return;

      const { type, r_i } = aliasMap[matchedAlias];
      typeCount[type] = (typeCount[type] || 0) + 1;
      console.log('匹配到项目:', matchedAlias, 'type:', type, 'r_i:', r_i);

      let value = null;

      // 方法1: 从同行提取（项目名后面的数字）
      if (value === null) {
        const afterText = item.text.substring(item.text.indexOf(matchedAlias) + matchedAlias.length);
        value = extractValue(afterText);
        if (value !== null) console.log('  同行提取:', value);
      }

      // 方法2: 从同行括号内提取
      if (value === null) {
        const bracketMatch = item.text.match(/[(（]([^)）]*?\d+(\.\d+)?)[)）]/);
        if (bracketMatch) {
          value = extractValue(bracketMatch[1]);
          if (value !== null) console.log('  括号内提取:', value);
        }
      }

      // 方法3: 从下一行提取
      if (value === null) {
        for (let i = index + 1; i < items.length; i++) {
          if (!isSameRow(item, items[i])) break;
          value = extractValue(items[i].text);
          if (value !== null) {
            console.log('  下一行提取:', value);
            break;
          }
        }
      }

      // 方法4: 从后一行（跨行表格）
      if (value === null) {
        for (let i = index + 1; i < items.length; i++) {
          if (isNextRow(item, items[i])) {
            value = extractValue(items[i].text);
            if (value !== null) {
              console.log('  后一行提取:', value);
              break;
            }
          }
        }
      }

      // 方法5: 从前行提取
      if (value === null) {
        for (let i = index - 1; i >= 0; i--) {
          if (isPrevRow(item, items[i])) {
            value = extractValue(items[i].text);
            if (value !== null) {
              console.log('  前一行提取:', value);
              break;
            }
          }
        }
      }

      // 方法6: 只有当项目名后面紧跟数字时才提取（最严格）
      // 例如 "白细胞 5.2" 而不是 "白细胞计数 5.2"
      if (value === null) {
        // 检查项目名是否在文字开头或紧跟空格/符号后
        const aliasIndex = item.text.indexOf(matchedAlias);
        if (aliasIndex !== -1 && aliasIndex < 5) { // 项目名在前面部分
          const afterText = item.text.substring(aliasIndex + matchedAlias.length);
          // 只有数字紧跟在项目名后面（中间无汉字）才提取
          if (/^[：: ]+(\d+(\.\d+)?)/.test(afterText)) {
            const numMatch = afterText.match(/^(\d+(\.\d+)?)/);
            if (numMatch) {
              value = parseFloat(numMatch[1]);
              console.log('  项目名后紧跟数字:', value);
            }
          }
        }
      }

      if (value !== null) {
        matchedProjects[r_i] = value;
      }
    });

    console.log('匹配到的项目:', matchedProjects);
    console.log('类型计数:', typeCount);

    // 确定cate_id
    let cate_id = 0;
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > maxCount) {
        maxCount = count;
        cate_id = parseInt(type);
      }
    }
    console.log('确定类型ID:', cate_id, '匹配数:', maxCount);

    // 过滤最终项目
    const finalProjects = {};
    tableData.forEach(item => {
      if (item.type === cate_id && matchedProjects[item.r_i] !== undefined) {
        finalProjects[item.r_i] = matchedProjects[item.r_i];
      }
    });

    console.log('最终项目:', finalProjects);

    if (Object.keys(finalProjects).length === 0) {
      wx.showToast({ title: '未识别到有效项目', icon: 'none' });
      return null;
    }

    return { date, hospital, openid: app.globalData.openid, cate_id, ...finalProjects };
  },

  // 保存记录
  saveToServer(data) {
    wx.showLoading({ title: '保存中...', mask: true });

    wx.request({
      url: 'https://jyj.lboxshop.cc/saveRecord',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { ...data, openid: app.globalData.openid },
      success: (res) => {
        if (res.statusCode === 200 && res.data.message === '记录保存成功') {
          wx.showToast({ title: '保存成功', icon: 'success' });
          wx.navigateTo({
            url: `/pages/detail/detail?id=${res.data.recordId}&type=${data.cate_id}`
          });
          // 刷新记录列表
          this.fetchRecentRecords();
          // 更新记录数
          this.setData({ recordCount: this.data.recordCount + 1 });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => wx.hideLoading()
    });
  }
});
