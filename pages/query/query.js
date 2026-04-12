const app = getApp();

Page({
  data: {
    queryResults: [], // 用于存储查询结果
    noData: false, // 用于判断是否有数据
    categoryList: [], // 存储类别列表
    selectedCategory: null, // 选择的类别索引
    startDate: '', // 选择的起始日期
    endDate: '', // 选择的结束日期
    loading: false, // 控制加载状态
  },

  onPullDownRefresh: function () {
    this.refreshData();
  },

  refreshData: function () {
    // 显示加载状态
    this.setData({ loading: true });

    // 模拟数据加载
    setTimeout(() => {
      // 数据加载完成后，停止下拉刷新
      wx.stopPullDownRefresh();

      // 重新获取查询结果
      this.fetchQueryResults();

      // 隐藏加载状态
      this.setData({ loading: false });
    }, 5000); // 假设数据加载需要1秒
  },

  onLoad: function (options) {
    // 初始化时获取类别列表并加载默认查询结果
    this.fetchCategoryList(); // 获取类别列表
    this.fetchQueryResults(); // 默认加载全部数据
  },

  onShow: function () {
    // 每次页面显示时刷新数据
    this.refreshData();
  },

  // 获取类别列表
  fetchCategoryList: function () {
    wx.request({
      url: 'https://jyj.lboxshop.cc/getCategoryList',
      method: 'GET',
      success: res => {
        this.setData({ categoryList: res.data });
      },
      fail: err => {
        console.error('获取类别列表失败:', err);
      }
    });
  },

  // 清空筛选条件
  handleClearFilters: function () {
    this.setData({
      selectedCategory: null,
      startDate: '',
      endDate: '',
    });
    // 重新加载数据或清空查询结果
    this.fetchQueryResults();
  },

  // 获取查询结果
  fetchQueryResults: function () {
    const { selectedCategory, startDate, endDate, categoryList } = this.data;
    const openid = app.globalData.openid;

    if (!openid) {
      console.error('用户未登录，无法获取查询结果');
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    wx.request({
      url: 'https://jyj.lboxshop.cc/query',
      method: 'POST',
      data: {
        openid: openid,
        category: selectedCategory !== null ? categoryList[selectedCategory].identification : null, // 传递类别的 identification
        startDate: startDate,
        endDate: endDate
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: res => {
        if (res.statusCode === 200) {
          if (res.data.length > 0) {
            const formattedResults = res.data.map(item => {
              const dateString = item.date;
              const date = new Date(dateString);
              const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              return {
                id: item.id,
                cate_id: item.cate_id, // Added cate_id to the result set
                date: formattedDate,
                type: item.type
              };
            });

            this.setData({
              queryResults: formattedResults,
              noData: false
            });
          } else {
            this.setData({
              queryResults: [],
              noData: true
            });
          }
        } else {
          console.error(`接口返回错误，状态码: ${res.statusCode}, 错误信息:`, res.data);
          wx.showToast({
            title: '获取查询结果失败，请稍后再试',
            icon: 'none',
          });
        }
      },
      fail: err => {
        console.error('请求失败', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
        });
      }
    });
  },

  // 处理类别选择事件
  handleCategoryChange: function (e) {
    this.setData({
      selectedCategory: e.detail.value // 直接保存索引值
    });
    this.fetchQueryResults(); // 重新查询结果
  },

  // 处理日期选择事件
  handleDateChange: function (e) {
    this.setData({
      [e.target.dataset.type]: e.detail.value
    });
    this.fetchQueryResults(); // 重新查询结果
  },

  // 处理记录点击事件
  handleClick: function (event) {
    const { id, cate_id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=${cate_id}`, // Pass both id and cate_id
    });
  }
});