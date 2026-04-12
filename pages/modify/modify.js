// pages/modify/modify.js
Page({
  data: {
    date: '',
    hospital: '',
    projectList: [],
    projectValues: {}, // 记录用户修改的项目值
    pickerData: [],
    originalValues: {}, // 记录原始的项目值
    isLoading: true,
    C: [],
    A: {},
    id: '',
    openid: '',
    type: '' 
  },

  onLoad: function (options) {
    const app = getApp();
    const C = app.globalData.C;
    const A = app.globalData.A;
    const id = options.id;
    const openid = app.globalData.openid;
    const type = options.type; 
    this.setData({
      C,
      A,
      id,
      openid,
      type,
      date: this.formatDate(A.date),
      hospital: A.hos,
      originalValues: { ...A } // 深拷贝原始值
    });

    // 初始化 projectValues，使其包含 A 数据中的值
    const projectValues = {};
    C.forEach(item => {
      if (item.input !== 'input' && A[item.r_i]) {
        const index = this.data.projectList.findIndex(p => p.r_i === item.r_i);
        if (index !== -1) {
          const pickerItem = this.data.pickerData[index]?.find(d => d.identification === A[item.r_i]);
          if (pickerItem) {
            projectValues[item.r_i] = A[item.r_i];
          }
        }
      } else if (item.input === 'input') {
        projectValues[item.r_i] = A[item.r_i];
      }
    });

    this.setData({ projectValues });

    this.fetchProjectList(C, A); // 获取项目列表
  },

  fetchProjectList: function (C, A) {
    // 过滤掉没有 input 字段的项目
    const filteredProjectList = C.filter(item => item.hasOwnProperty('input'));
    this.setData({ projectList: filteredProjectList, isLoading: false });

    // 遍历项目列表，判断是否需要获取 picker 数据
    filteredProjectList.forEach((item, index) => {
      if (item.input !== 'input') {
        this.getPickerValues(item.input, index);
      }
    });
  },

  getPickerValues: function (input, index) {
    const that = this;
    wx.request({
      url: 'https://jyj.lboxshop.cc/getPickerValues',
      method: 'POST',
      data: { input },
      success: res => {
        const pickerData = that.data.pickerData || [];
        pickerData[index] = res.data;
        that.setData({ pickerData });

        // 初始化 projectValues，使其包含 A 数据中的值
        const projectValues = that.data.projectValues;
        const projectKey = that.data.projectList[index].r_i;
        const initialValue = that.data.A[projectKey];
        if (initialValue) {
          const pickerItem = res.data.find(d => d.identification === initialValue);
          if (pickerItem) {
            projectValues[projectKey] = initialValue;
            that.setData({ projectValues });
          }
        }
      },
      fail: err => {
        console.error('请求 picker 数据失败:', err);
      }
    });
  },

  // 日期选择
  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },

  // 医院输入
  onHospitalInput: function (e) {
    const value = e.detail.value || ''; // 确保 value 存在且有效
    this.setData({ hospital: value });
  },

  // 项目输入事件处理
  onProjectInput: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const projectValues = this.data.projectValues;

    const projectKey = this.data.projectList[index].r_i;  // 使用 r_i 作为键
    projectValues[projectKey] = value;
    this.setData({ projectValues });
  },

  // picker 选择事件处理
  onPickerChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const pickerIndex = e.detail.value;  // 用户选择的索引
    const projectKey = this.data.projectList[index].r_i;  // 项目的唯一标识符

    // 更新项目值
    const projectValues = this.data.projectValues;
    const selectedValue = this.data.pickerData[index][pickerIndex];
    if (selectedValue) {
      projectValues[projectKey] = selectedValue.identification;  // 保存 identification
    }
    this.setData({ projectValues });
  },

  // 提交修改
  onSubmit: function () {
    const { id, openid, projectValues, date, hospital, originalValues, projectList } = this.data;
    const type = this.data.type;
    
    // 构造要提交的修改数据
    const modifiedData = { id, openid };

    // 检查日期和医院是否修改过，并提交
    if (date !== originalValues.date) {
      modifiedData.date = date;
    }
    if (hospital !== originalValues.hos) {
      modifiedData.hos = hospital; // 使用 hos 作为字段名
    }

    // 遍历项目值，提交修改过的内容
    Object.keys(projectValues).forEach(key => {
      const value = projectValues[key];
      const project = projectList.find(p => p.r_i === key);

      if (project) {
        if (project.input === 'input' && value !== originalValues[key]) {
          // input 类型，提交用户输入的值
          modifiedData[key] = value;
        } else if (project.input !== 'input' && value !== originalValues[key]) {
          // picker 类型，提交 identification 值
          modifiedData[key] = value; // 已经在 onPickerChange 中保存了正确的 identification
        }
      }
    });

    // 如果没有任何修改，不提交
    if (Object.keys(modifiedData).length <= 2) { // 只有 id 和 openid
      wx.showToast({ title: '没有修改任何内容', icon: 'none' });
      return;
    }

    console.log('提交修改的数据:', modifiedData); // 打印提交数据

    wx.request({
      url: 'https://jyj.lboxshop.cc/updateRecord',
      method: 'POST',
      data: modifiedData,
      success: res => {
        if (res.data.message === '记录更新成功') {
          wx.showToast({ title: '记录更新成功', icon: 'success' });
          wx.redirectTo({
            url: `/pages/detail/detail?id=${id}&type=${type}`
          });
        } else {
          wx.showToast({ title: '记录更新失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error('请求更新失败:', err);
        wx.showToast({ title: '请求失败，请重试', icon: 'none' });
      }
    });
  },

  // 日期格式化
  formatDate: function (dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
});
