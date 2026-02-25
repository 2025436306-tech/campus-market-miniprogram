export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index', // 新增登录页面路径
    'pages/agreement/service', // 新增：用户服务协议页面
    'pages/agreement/privacy',  // 新增：隐私权政策页面
    'pages/settings/index',// 新增：设置页面
    'pages/product/detail', // 新增：商品详情页
    'pages/seller/index', // 新增：卖家主页
    'pages/favorite/index', // 新增：我的收藏页面
    'pages/publish/index',
    'pages/wallet/index', // 新增：钱包页面
    'pages/order/index',  // 新增：订单页面
    'pages/auth/index',    // 新增：认证页面
    'pages/forum/publish', // 新增：校园圈发帖
    'pages/forum/detail',   // 新增：校园圈详情
    'pages/chat/detail',
    'pages/notice/index',   // <--- 新增这行：通用通知列表页
    'pages/checkout/index', // 确认订单页
    'pages/history/index',  // 浏览足迹页
    'pages/following/index',// 我的关注页
    'pages/report/index'    // 投诉举报页
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '拾集校园',
    navigationBarTextStyle: 'black'
  }
})
