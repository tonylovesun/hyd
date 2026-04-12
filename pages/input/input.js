Page({
  data: {
    date: '',  // 用于存储用户选择的日期
    hospital: '',  // 用于存储用户输入的医院名称
    categoryList: [],  // 用于存储化验单类型列表
    selectedCategory: 0,  // 用于存储用户选择的化验单类型的索引
    projectList: [],  // 用于存储项目列表
    projectValues: {},  // 用于存储每个项目的输入数值
    pickerData: [],  // 存储各个项目的picker选项
    openid: '',  // 用于存储用户的openid
  },

  onLoad: function (options) {
    const app = getApp();
    this.setData({ openid: app.globalData.openid });

    const today = new Date().toISOString().split('T')[0];
    this.setData({ date: today });
    
    this.fetchCategoryList();
  },

  // 获取化验单类型列表
  fetchCategoryList: function () {
    const that = this;

    wx.request({
      url: 'https://jyj.lboxshop.cc/getCategoryList',
      method: 'GET',
      success: res => {
        console.log('getCategoryList:', res);  // 打印服务器返回数据

        if (res.statusCode === 200 && Array.isArray(res.data)) {
          that.setData({ categoryList: res.data });
        } else {
          console.error('获取化验单类型列表失败', res.data);
        }
      },
      fail: err => {
        console.error('请求化验单类型列表失败', err);
      }
    });
  },

  // 日期选择器
  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },
 
  // 医院输入
  onHospitalInput: function (e) {
    this.setData({ hospital: e.detail.value });
  },
  
  // 化验单类型选择器的更改事件处理
  onCategoryChange: function (e) {
    const selectedCategory = e.detail.value;
    this.setData({ selectedCategory });
    this.fetchProjectList();  // 选择类型后加载对应的项目列表
  },

  // 获取项目列表和picker数据
  fetchProjectList: function () {
    const that = this;
    const category = this.data.categoryList[this.data.selectedCategory];

    wx.request({
      url: 'https://jyj.lboxshop.cc/getProjectList',
      method: 'POST',
      data: {
        type: category.identification  // 传递化验单类型的 identification 字段值
      },
      success: res => {
        console.log('服务器返回的数据:', res);  // 打印服务器返回的数据

        if (res.statusCode === 200) {
          const { projectList } = res.data;

          // 处理项目列表
          const pickerData = that.data.pickerData || [];
          projectList.forEach((item, index) => {
            if (item.input !== 'input') {
              // 如果input不是'input'，自动获取picker值
              that.getPickerValues(item.input, index);
            }
          });

          that.setData({
            projectList,
            pickerData
          });
        } else {
          console.error('获取项目列表失败', res.data);
        }
      },
      fail: err => {
        console.error('请求项目列表失败', err);
      }
    });
  },

  // 获取 picker 的值
  getPickerValues: function (input, index) {
    const that = this;
    wx.request({
      url: 'https://jyj.lboxshop.cc/getPickerValues',
      method: 'POST',
      data: { input },
      success: res => {
        console.log('获取picker数据:', res);
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const pickerData = that.data.pickerData || [];
          pickerData[index] = res.data;  // 将返回的数据存入对应的pickerData位置
          that.setData({ pickerData });
        } else {
          console.error('获取picker数据失败', res.data);
        }
      },
      fail: err => {
        console.error('请求picker数据失败', err);
      }
    });
  },

  // 项目输入事件处理
  onProjectInput: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const projectValues = this.data.projectValues;

    const projectKey = this.data.projectList[index].r_i;  // 使用r_i作为键
    projectValues[projectKey] = value;
    this.setData({ projectValues });
  },

  // picker选择事件处理
  onPickerChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const pickerIndex = e.detail.value;  // 用户选择的索引
    const projectKey = this.data.projectList[index].r_i;  // 项目的唯一标识符
  
    // 更新项目值
    const projectValues = this.data.projectValues;
    projectValues[projectKey] = this.data.pickerData[index][pickerIndex].identification;  // 保存c.identification
    this.setData({ projectValues });
  },

  // 提交表单
  onSubmit: function () {
    const that = this;
    const { date, hospital, projectValues, selectedCategory, openid } = this.data;

    if (!this.data.categoryList[selectedCategory]) {
      wx.showToast({
        title: '请选择化验单类型',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 构造提交的数据
    const dataToSubmit = {
      date,
      hospital,
      openid,
      cate_id: this.data.categoryList[selectedCategory].identification,
      ...projectValues
    };

    console.log('提交的数据:', dataToSubmit);

    wx.request({
      url: 'https://jyj.lboxshop.cc/saveRecord',
      method: 'POST',
      data: dataToSubmit,
      header: {
        'Content-Type': 'application/json'
      },
      success: res => {
        console.log('收到保存记录响应:', res.data);

        if (res.data.message === '记录保存成功') {
          wx.showToast({
            title: '记录保存成功',
            icon: 'success',
            duration: 2000
          });

          const recordId = res.data.recordId;
          const type = this.data.categoryList[selectedCategory].identification;

          wx.navigateTo({
            url: `/pages/detail/detail?id=${recordId}&type=${type}`
          });
        } else {
          wx.showToast({
            title: '记录保存失败',
            icon: 'error',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('请求保存记录失败', err);
        wx.showToast({
          title: '请求保存记录失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  }
});
