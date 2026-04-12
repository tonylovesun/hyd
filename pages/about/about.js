// pages/about/about.js
Page({
  data: {
    contactValue: '',
    opinionValue: ''
  },

  onContactInput(event) {
    this.setData({
      contactValue: event.detail
    });
  },
  
  onOpinionInput(event) {
    this.setData({
      opinionValue: event.detail
    });
  },

  onSubmit() {
    const { contactValue, opinionValue } = this.data;
    const openid = getApp().globalData.openid;
    if (!contactValue || !opinionValue) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
  
    // 发送请求到后端接口
    wx.request({
      url: 'https://jyj.lboxshop.cc/sendEmail', // 替换为你的后端服务地址
      method: 'POST',
      data: {
        openid,
        contact: contactValue,
        opinion: opinionValue
      },
      success: (res) => {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        // 清空输入框
        this.setData({
          contactValue: '',
          opinionValue: ''
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        });
        console.error(err);
      }
    });
  }
});
