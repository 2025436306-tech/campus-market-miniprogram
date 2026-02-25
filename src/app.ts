import { PropsWithChildren } from 'react'
import Taro,{ useLaunch } from '@tarojs/taro'

import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('小程序启动啦！')

    // 新增：初始化微信云开发环境
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({
        env: 'cloud1-0gddyxw88e6d1b7d', // 请替换为你在微信开发者工具里真实的环境 ID
        traceUser: true,
      })
    }

  })

  // children 是将要会渲染的页面
  return children
}



export default App
