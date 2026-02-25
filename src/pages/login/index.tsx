import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Login() {
  const [isAgreed, setIsAgreed] = useState(false);

  // 提取公共的模拟登录成功逻辑
  const proceedMockLogin = () => {
    Taro.showLoading({ title: '登录中...' });
    setTimeout(() => {
      Taro.hideLoading();
      
      // 写入初始状态：强制未认证
      Taro.setStorageSync('isLoggedIn', true);
      Taro.setStorageSync('userInfo', {
        avatarUrl: 'https://api.iconify.design/lucide/user.svg?color=%232563EB&stroke-width=2', 
        nickName: '微信用户_拾集同学',
        campus: '', 
        published: 0,
        sold: 0,
        bought: 0,
        favorites: 0,
        isAuth: false, // 明确设为未认证
        realName: '',
        studentId: ''
      });
      // ===========================================

      Taro.showToast({ title: '登录成功', icon: 'success' });
      // 登录成功后，返回上一页
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    }, 1000);
  };

  const handleGetPhoneNumber = (e: any) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      proceedMockLogin();
    } else {
      Taro.showToast({ title: '测试环境，启用模拟登录', icon: 'none', duration: 1500 });
      setTimeout(() => {
        proceedMockLogin();
      }, 1500);
    }
  };

  const checkAgreement = () => {
    if (!isAgreed) {
      Taro.showToast({ title: '请先阅读并勾选底部协议', icon: 'none' });
    }
  };

  const navigateToAgreement = (e: any, type: 'service' | 'privacy') => {
    e.stopPropagation(); 
    if (type === 'service') {
      Taro.navigateTo({ url: '/pages/agreement/service' });
    } else {
      Taro.navigateTo({ url: '/pages/agreement/privacy' });
    }
  };

  return (
    <View className="flex flex-col h-screen bg-white px-8 pt-20">
      <View className="flex flex-col items-center mb-24">
        <View className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-4">
          <Text className="text-black font-bold text-2xl tracking-widest">拾集</Text>
        </View>
        <Text className="text-xl font-bold text-zinc-900">欢迎来到拾集校园</Text>
      </View>

      <View className="flex flex-col space-y-4 w-full">
        <Button 
          className="w-full bg-yellow-400 text-black font-bold py-3 rounded-full border-none after:border-none"
          openType={isAgreed ? 'getPhoneNumber' : ''} 
          onGetPhoneNumber={handleGetPhoneNumber}
          onClick={checkAgreement}
        >
          微信一键登录
        </Button>
        <Button 
          className="w-full bg-zinc-100 text-zinc-400 font-bold py-3 rounded-full border-none after:border-none opacity-80"
          disabled={true}
        >
          其他手机号登录 (暂不支持)
        </Button>
      </View>

      {/* 修改点：修复对齐问题，优化文字排版 */}
      <View className="mt-auto mb-10 flex items-start w-full px-2" onClick={() => setIsAgreed(!isAgreed)}>
        <View className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 mt-[3px] mr-2 flex items-center justify-center transition-colors ${isAgreed ? 'border-yellow-400 bg-yellow-400' : 'border-zinc-300'}`}>
          {isAgreed && <View className="w-1.5 h-1.5 bg-white rounded-full"></View>}
        </View>
        <Text className="text-[15px] text-zinc-400 leading-relaxed flex-1">
          未注册的手机号，登录时将自动注册，且代表您已同意以下协议：
          <Text className="text-blue-500 active:text-blue-700" onClick={(e) => navigateToAgreement(e, 'service')}>《用户服务协议》</Text>
          和
          <Text className="text-blue-500 active:text-blue-700" onClick={(e) => navigateToAgreement(e, 'privacy')}>《隐私权政策》</Text>
        </Text>
      </View>
    </View>
  );
}
