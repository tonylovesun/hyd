import wxCharts from '../../libs/wxcharts.js';

Page({
  data: {
    categoryList: [], // 类别列表
    projectList: [],  // 当前类别的项目列表
    mainActiveIndex: 0, // 类别索引
    activeId: null, // 选中的项目ID
    selectedCategory: null, // 选中的类别ID
    selectedProject: null,  // 选中的项目ID
    selectedProjectName: '', // 项目名称
    startDate: '', // 选择的开始日期
    endDate: '',   // 选择的结束日期
    chartData: [], // 用于绘制图表的数据
    showPickerPopup: false, // 控制弹出层显示
    projectDetail: '', // 项目详情
    showChart: false, // 控制是否显示图表和详情
    aiLoading: false, // 新增加载状态
    aiResult: ''      // 存储分析结果
  },

  onLoad() {
    // 提前获取设备信息
    try {
      const windowInfo = wx.getWindowInfo();
      this.setData({
        windowWidth: windowInfo.windowWidth
      });
    } catch (err) {
      console.error('获取设备信息失败:', err);
      // 设置默认值
      this.setData({
        windowWidth: 375
      });
    }
    this.fetchCategoryList(); // 加载类别和项目列表
  },

  // 获取类别和项目列表
  fetchCategoryList() {
    wx.request({
      url: 'https://jyj.lboxshop.cc/getCategoryListWithProjects',
      method: 'GET',
      success: (res) => {
        const firstCategory = res.data[0];
        this.setData({
          categoryList: res.data,
          projectList: firstCategory.children,
          selectedCategory: firstCategory.id,
        });
      },
      fail: (err) => {
        console.error('获取类别和项目列表失败:', err);
      }
    });
  },

  // 显示项目选择器
  showPicker() {
    this.setData({ showPickerPopup: true });
  },

  // 关闭项目选择器
  onClose() {
    this.setData({ showPickerPopup: false });
  },

  // 选择类别
  onClickNav({ detail = {} }) {
    this.setData({
      mainActiveIndex: detail.index || 0
    });
  },

  // 选择项目
  onClickItem({ detail = {} }) {
    const activeId = detail.id;
    const selectedCategory = this.data.categoryList[this.data.mainActiveIndex];
    const selectedProject = selectedCategory.children.find(item => item.id === activeId);

    this.setData({
      activeId,
      selectedCategory,
      selectedProject,
      selectedProjectName: selectedProject.text,
      showPickerPopup: false
    });
  },

  // 查询按钮点击事件
  onQueryClick() {
    const { selectedProject, startDate, endDate } = this.data;

    if (!selectedProject || !startDate || !endDate) {
      wx.showToast({
        title: '请完善筛选条件',
        icon: 'none'
      });
      return;
    }

    // 获取项目详情和数据后显示图表和详情
    this.fetchProjectDetail(selectedProject.id);
    this.fetchFilteredData();
    this.setData({ showChart: true });
  },

  // 获取项目详情
  fetchProjectDetail(projectId) {
    // 获取全局数据
    const app = getApp();

    // 在tableData中查找匹配项
    const matchedProject = app.globalData.tableData.find(
      item => item.r_i === projectId
    );

    if (matchedProject && matchedProject.detail) {
      this.setData({
        projectDetail: matchedProject.detail
      });
    } else {
      console.warn('未找到匹配项目，ID:', projectId);
      wx.showToast({
        title: '未找到相关数据',
        icon: 'none'
      });
    }
  },

  // 获取筛选数据
  fetchFilteredData() {
    const { selectedCategory, selectedProject, startDate, endDate } = this.data;
    const openid = getApp().globalData.openid;

    wx.request({
      url: 'https://jyj.lboxshop.cc/getFilteredData',
      method: 'POST',
      data: {
        project: selectedProject.id,
        openid,
        category: selectedCategory.id,
        startDate,
        endDate
        },
        success: (res) => {
          console.log('[Filt] 过滤响应数据:', res); // 打印完整响应对象
            this.setData({
              chartData: res.data.map(item => ({
                ...item,
                value: Number(item.value) || 0, // 确保value是数字
                // 格式化日期（处理2025-05-03T16000000Z格式）
                date: this.formatDate(item.date)
              }))
            });
            this.drawChart(); // 调用绘制图表函数
          },
          fail: (err) => {
            console.error('获取筛选后的数据失败:', err);
      }
    });
  },

  // 绘制图表
  drawChart() {
    const {
      chartData,
      selectedProjectName,
      windowWidth
    } = this.data;

    if (chartData.length > 0) {
      new wxCharts({
        canvasId: 'myCanvas',
        type: 'area',
          animation: true,
          background: 'transparent',
          color: ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7'], // 更丰富的绿色渐变
          categories: chartData.map(item => item.date),
          series: [{
            name: selectedProjectName,
            data: chartData.map(item => item.value),
            format: (val) => {
              const num = parseFloat(val);
              return isNaN(num) ? '0.00' : num.toFixed(2);
            }
          }],
          xAxis: {
            disableGrid: true,
            axisLine: {
              lineStyle: {
                color: '#E5E5EA'
              }
            },
            labelFontColor: '#8E8E93',
            axisLabel: {
              rotate: 0, // 取消旋转
              interval: 0,
              margin: 8,  // 标签间隔
              fontSize: 10, // 恢复默认字号
              // 关键修改：添加宽度自适应
              width: (windowWidth * 0.85 - 70) / chartData.length, // 动态计算宽度
              overflow: 'break' // 超出自动换行
            }
          },
          yAxis: {
            format: (val) => {
              const num = parseFloat(val);
              return isNaN(num) ? '0.00' : num.toFixed(2);
            },
          },
          width: windowWidth * 0.85, // 增加宽度
          height: 250, // 恢复默认高度
          extra: {
            lineStyle: 'curve',
            legend: {
              position: 'center',
              fontColor: '#E65100' // 图例文字
            },
            tooltip: {
              show: true,
              background: '#FF9800', // 背景浅绿色
              borderColor: '#FFE0B2',
              fontColor: '#E65100' ,
              borderRadius: 8, // 增加圆角
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)' // 绿色阴影
            },
            canvasBgColor: 'transparent', // 确保背景透明
          }
        });
        }
        else {
      this.setData({
        noDataMessage: '当前条件下没有相关数据，请尝试调整筛选条件。'
      });
    }
  },
  // 选择日期
  handleDateChange(e) {
      this.setData({
        [e.target.dataset.type]: e.detail.value
      });
    },

    // 新增日期格式化方法
    formatDate(isoString) {
      if (!isoString) return '';
      // 简单截取前10个字符（适用于2025-05-03T16000000Z格式）
      return isoString.substring(0, 10);

      /* 更严谨的写法（处理各种ISO格式）：
      try {
        return new Date(isoString).toISOString().split('T')[0];
      } catch (e) {
        return isoString.substring(0, 10);
      }
      */
    },

    // 新增方法：处理 AI 分析
    handleAIAnalysis() {
    const chartData = this.data.chartData;
    const projectDetail = this.data.projectDetail;
    if (!chartData || chartData.length === 0 || !projectDetail) {
      wx.showToast({ title: '无数据可分析', icon: 'none' });
      return;
    }

    this.setData({ aiLoading: true, aiResult: '' });
    wx.request({
      url: 'https://jyj.lboxshop.cc/analyze-project',  // 替换为实际服务端接口
      method: 'POST',
      data: {
        data: chartData, // 发送时间序列数据
        detail: projectDetail // 发送项目详情
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
    }
  });
