Page({
  data: {
    detailData: [],
    textDescription: '', // 确保初始值为空
    noData: false,
    isLoading: true, // 加载状态
    aiLoading: false, // 新增：控制按钮加载状态
    aiResult: '',     // 存储 AI 分析结果
    id: null // 新增，存储当前记录的 id
  },

  onLoad: function (options) {
    const id = options.id;
    const type = options.type;
    const openid = getApp().globalData.openid;
    this.setData({ id, type }); // 保存 id 和 type
    this.getDetailData(id, openid, type);
  },

  getDetailData: function (id, openid, type) {
    console.log('请求数据:', { id, openid, type }); // 打印要发送的数据
    wx.request({
      url: 'https://jyj.lboxshop.cc/GetDetailData',
      method: 'POST',
      data: { id, openid, type },
      success: (res) => {
        if (res.data && res.data.C && res.data.A) {
          const formattedData = this.formatDetailData(res.data.C, res.data.A, res.data.B);
          console.log('格式化后的数据:', formattedData); // 打印格式化后的数据
          this.setData({
            detailData: formattedData,
            noData: false,
            isLoading: false,
          });

          // 将 C 和 A 存储到全局数据中
          const app = getApp();
          app.globalData.C = res.data.C;
          app.globalData.A = res.data.A;
        } else {
          this.setData({ 
            noData: true,
            textDescription: '' // 无数据时清空文本框 
          });
        }
      },
      fail: (err) => {
        console.error('请求数据失败:', err);
        this.setData({ 
          noData: true,
          textDescription: '' // 失败时清空文本框
        });
      }
    });
  },

  formatDetailData: function (C, A, B) {
    const detailData = [
      { name: '日期', currentData: this.formatDate(A.date), previousData: B ? this.formatDate(B.date) : '' },
      { name: '医院', currentData: A.hos, previousData: B ? B.hos : '' }
    ];

    C.forEach((item) => {
      if (item.project) { // 检查 project 字段是否存在
      const currentData = A[item.r_i] || '';
      const previousData = B ? B[item.r_i] : '';
      detailData.push({ name: item.project, currentData, previousData });
      }
    });

    return detailData;
  },

  formatDate: function (dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },

  // 新增方法：处理 AI 分析
  handleAIAnalysis() {
    const detailData = this.data.detailData;
    if (!detailData || detailData.length === 0) {
      wx.showToast({ title: '无数据可分析', icon: 'none' });
      return;
    }

    this.setData({ aiLoading: true, aiResult: '' });
    wx.request({
      url: 'https://jyj.lboxshop.cc/analyze-detail',  // 替换为实际服务端接口
      method: 'POST',
      data: {
        data: detailData // 发送格式化后的数据
      },
      success: (res) => {
        if (res.data && res.data.result) {
          this.setData({ aiResult: res.data.result });
        } else {
          wx.showToast({ title: '分析失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({ title: '请求失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ aiLoading: false });
      }
    });
  },

  handleDelete: function () {
    const id = this.data.id;
    const openid = getApp().globalData.openid; 
    wx.showModal({
      title: '确认删除',
      content: '您确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: 'https://jyj.lboxshop.cc/deleteRecord',
            method: 'POST',
            data: { id, openid},
            success: () => {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000,
                success: () => {
                  // 使用 redirectTo 跳转至 index 页面
                  wx.redirectTo({
                    url: '/pages/index/index', // 根据实际路径调整
                    complete: () => {
                      // 可选：在这里可以执行一些额外的操作，比如发送通知或更新状态
                    }
                  });
                }
              });
            },
            fail: (err) => {
              console.error('删除失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'error',
                duration: 2000
              });
            }
          });
        }
      }
    });
  },

  handleEdit: function () {
    const id = this.data.id;
    const type = this.data.type;
    wx.navigateTo({
      url: `/pages/modify/modify?id=${id}&type=${type}`
    });
  }
});
