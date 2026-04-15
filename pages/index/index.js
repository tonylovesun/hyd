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

  // 解析OCR结果 - 增强版 v2
  parseOCRResult(ocrData) {
    if (!ocrData || !Array.isArray(ocrData)) {
      console.error('OCR数据格式异常:', typeof ocrData);
      throw new Error('OCR数据格式异常');
    }

    // 构建文本数组，包含位置信息
    const items = ocrData.map(item => ({
      text: (item.DetectedText || '').trim(),
      // 从 ItemPolygon 提取位置信息（Top, Left, Width, Height）
      y: item.ItemPolygon?.Top || 0,
      x: item.ItemPolygon?.Left || 0,
      width: item.ItemPolygon?.Width || 0,
      height: item.ItemPolygon?.Height || 0
    })).filter(item => item.text.length > 0);

    console.log('识别到的条目数:', items.length);
    console.log('识别内容:', items.map(t => t.text).join('\n'));

    // 提取医院名称
    const hospitalItem = items.find(t => /(医院|中心|门诊|诊所)/.test(t.text));
    const hospital = hospitalItem ? hospitalItem.text : '未知';

    // 提取日期 - 支持多种格式
    const datePatterns = [
      /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/,  // 2024-01-01, 2024年1月1日
      /\d{4}\.\d{1,2}\.\d{1,2}/,               // 2024.01.01
      /\d{4}年\d{1,2}月\d{1,2}/,                 // 2024年1月1日
      /\d{2}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/    // 24-01-01
    ];
    let date = new Date().toISOString().split('T')[0];
    for (const item of items) {
      for (const pattern of datePatterns) {
        const match = item.text.match(pattern);
        if (match) {
          date = match[0];
          // 转换为标准格式
          date = date.replace(/[年日月]/g, '-').replace(/\./g, '-').replace(/--+/g, '-');
          date = date.replace(/^(\d{4})-(\d{1,2})-(\d{1,2}).*$/, (_, y, m, d) => 
            `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          );
          break;
        }
      }
      if (date.length === 10) break;
    }

    // 构建项目映射表
    const tableData = app.globalData.tableData || [];
    const aliasMap = {};
    tableData.forEach(item => {
      item.alias.forEach(alias => {
        aliasMap[alias] = { type: item.type, r_i: item.r_i, name: item.name };
      });
    });

    // 按长度排序（优先匹配长名称）
    const aliasKeys = Object.keys(aliasMap).sort((a, b) => b.length - a.length);
    console.log('项目别名数:', aliasKeys.length);
    if (aliasKeys.length === 0) return null;

    // 判断两个 Y 坐标是否在同一行（阈值设为高度的 1/3）
    const isSameRow = (item1, item2) => Math.abs(item1.y - item2.y) < (item1.height + item2.height) / 3;

    // 判断项目是否在前一行
    const isPrevRow = (item, target) => {
      const threshold = Math.max(item.height, target.height) * 1.5;
      return target.y < item.y && (item.y - target.y) < threshold;
    };

    // 判断项目是否在后一行
    const isNextRow = (item, target) => {
      const threshold = Math.max(item.height, target.height) * 1.5;
      return target.y > item.y && (target.y - item.y) < threshold;
    };

    // 提取数值 - 排除干扰项
    const extractValue = (text) => {
      // 排除参考范围、序号等
      if (/(参考|范围|代号|序号|项目)/.test(text)) return null;
      
      // 匹配独立数值（可能是小数、负数、有箭头）
      const match = text.match(/^[=<>]*\s*([<>]?[↓↑]?\s*\d+(\.\d+)?)/);
      if (match) {
        return parseFloat(match[1].replace(/\s/g, ''));
      }
      return null;
    };

    // 模糊匹配 - 计算字符串相似度
    const similarity = (str1, str2) => {
      const s1 = str1.toLowerCase();
      const s2 = str2.toLowerCase();
      if (s1 === s2) return 1;
      if (s1.includes(s2) || s2.includes(s1)) return 0.8;
      
      // 计算编辑距离
      const len1 = s1.length, len2 = s2.length;
      const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
      for (let i = 0; i <= len1; i++) dp[i][0] = i;
      for (let j = 0; j <= len2; j++) dp[0][j] = j;
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i-1] === s2[j-1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,
            dp[i][j-1] + 1,
            dp[i-1][j-1] + cost
          );
        }
      }
      return 1 - dp[len1][len2] / Math.max(len1, len2);
    };

    // 查找匹配的别名（支持模糊匹配）
    const findMatchingAlias = (text) => {
      // 先精确匹配
      for (const alias of aliasKeys) {
        if (text.includes(alias) || alias.includes(text)) {
          return alias;
        }
      }
      // 模糊匹配（相似度 > 0.6）
      for (const alias of aliasKeys) {
        if (similarity(text, alias) > 0.6) {
          console.log('模糊匹配:', text, '->', alias, '相似度:', similarity(text, alias));
          return alias;
        }
      }
      return null;
    };

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

      // 方法6: 查找同行任意位置的数字
      if (value === null) {
        const anyMatch = item.text.match(/(\d+(\.\d+)?)/);
        if (anyMatch && !/(参考|范围|代号|序号)/.test(item.text)) {
          value = parseFloat(anyMatch[1]);
          console.log('  同行任意位置:', value);
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
