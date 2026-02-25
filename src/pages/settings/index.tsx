import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function Settings() {
  const [userInfo, setUserInfo] = useState({ 
    avatarUrl: '', 
    nickName: '',
    bio: '',
    isAuth: false
  });

  // 每次显示页面时，读取最新缓存
  useDidShow(() => {
    const storedUserInfo = Taro.getStorageSync('userInfo');
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
    }
  });

  // 1. 更换头像逻辑
  const handleChooseAvatar = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'], // 只允许选择图片
        sourceType: ['album', 'camera'], // 支持相册和相机
      });
      
      const tempFilePath = res.tempFiles[0].tempFilePath;
      const newUserInfo = { ...userInfo, avatarUrl: tempFilePath };
      
      setUserInfo(newUserInfo);
      Taro.setStorageSync('userInfo', newUserInfo);
      Taro.showToast({ title: '头像更新成功', icon: 'success' });
    } catch (error) {
      console.log('用户取消选择头像');
    }
  };

  // 2. 修改昵称逻辑
  const handleEditNickName = () => {
    Taro.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: userInfo.nickName,
      success: (res) => {
        if (res.confirm && res.content) {
          const newUserInfo = { ...userInfo, nickName: res.content };
          setUserInfo(newUserInfo);
          Taro.setStorageSync('userInfo', newUserInfo);
          Taro.showToast({ title: '昵称修改成功', icon: 'success' });
        }
      }
    });
  };

  // 3. 修改简介逻辑
  const handleEditBio = () => {
    Taro.showModal({
      title: '修改简介',
      editable: true,
      placeholderText: '介绍一下你自己吧',
      content: userInfo.bio || '',
      success: (res) => {
        // res.content 可能为空字符串，所以只判断 res.confirm
        if (res.confirm && res.content !== undefined) {
          const newUserInfo = { ...userInfo, bio: res.content };
          setUserInfo(newUserInfo);
          Taro.setStorageSync('userInfo', newUserInfo);
          Taro.showToast({ title: '简介修改成功', icon: 'success' });
        }
      }
    });
  };

  // 4. 模拟实名认证
  const handleRealNameAuth = () => {
    if (userInfo.isAuth) {
      Taro.showToast({ title: '您已完成认证', icon: 'none' });
      return;
    }
    
    Taro.showLoading({ title: '学籍联网核查中...' });
    setTimeout(() => {
      Taro.hideLoading();
      const newUserInfo = { ...userInfo, isAuth: true, campus: '浙江农林大学' };
      setUserInfo(newUserInfo);
      Taro.setStorageSync('userInfo', newUserInfo);
      Taro.showToast({ title: '已认证为 浙江农林大学 学生', icon: 'none', duration: 2500 });
    }, 1500);
  };

  // 5. 模拟收款方式
  const handlePaymentMethod = () => {
    Taro.showToast({ title: '需企业商户号支持，当前为演示环境', icon: 'none', duration: 2000 });
  };

  // 退出登录逻辑
  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#EF4444',
      success: function (res) {
        if (res.confirm) {
          Taro.removeStorageSync('isLoggedIn');
          Taro.removeStorageSync('userInfo');
          Taro.showToast({ title: '已退出', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1000);
        }
      }
    });
  };

  return (
    <ScrollView scrollY className="h-screen bg-[#f4f4f5] px-4 pt-4 pb-10">
      
      <Text className="text-[13px] text-zinc-500 font-medium mb-2 px-1 block">个人资料</Text>
      <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
        {/* 头像 */}
        <View className="flex justify-between items-center py-4 border-b border-zinc-50 cursor-pointer active:bg-zinc-50" onClick={handleChooseAvatar}>
          <Text className="text-base text-zinc-800">头像</Text>
          <View className="flex items-center">
            <Image src={userInfo.avatarUrl || getIcon('user', '#A1A1AA')} className="w-12 h-12 rounded-full bg-zinc-100 object-cover" />
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1" />
          </View>
        </View>

        {/* 昵称 */}
        <View className="flex justify-between items-center py-4 border-b border-zinc-50 cursor-pointer active:bg-zinc-50" onClick={handleEditNickName}>
          <Text className="text-base text-zinc-800">昵称</Text>
          <View className="flex items-center">
            <Text className="text-sm text-blue-500">{userInfo.nickName || '去填写'}</Text>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1" />
          </View>
        </View>

        {/* 会员名 (通常不可修改) */}
        <View className="flex justify-between items-center py-4 border-b border-zinc-50">
          <Text className="text-base text-zinc-800">会员名</Text>
          <Text className="text-sm text-zinc-500 mr-6">xy261263733426</Text>
        </View>

        {/* 简介 */}
        <View className="flex justify-between items-center py-4 cursor-pointer active:bg-zinc-50" onClick={handleEditBio}>
          <Text className="text-base text-zinc-800 flex-shrink-0">简介</Text>
          <View className="flex items-center ml-4 overflow-hidden">
            <Text className={`text-sm truncate ${userInfo.bio ? 'text-zinc-500' : 'text-blue-500'}`}>
              {userInfo.bio || '去填写'}
            </Text>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1 flex-shrink-0" />
          </View>
        </View>
      </View>

      <Text className="text-[13px] text-zinc-500 font-medium mb-2 px-1 block">认证信息</Text>
      <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
        <View className="flex justify-between items-center py-4 cursor-pointer active:bg-zinc-50" onClick={handleRealNameAuth}>
          <Text className="text-base text-zinc-800 font-medium">实名认证</Text>
          <View className="flex items-center">
            <Text className={`text-sm ${userInfo.isAuth ? 'text-green-500' : 'text-zinc-400'}`}>
              {userInfo.isAuth ? '已认证' : '未认证'}
            </Text>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1" />
          </View>
        </View>
      </View>

      <Text className="text-[13px] text-zinc-500 font-medium mb-2 px-1 block">交易</Text>
      <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
        <View className="flex justify-between items-center py-4 cursor-pointer active:bg-zinc-50" onClick={handlePaymentMethod}>
          <View className="flex items-center">
            <Text className="text-base text-zinc-800 font-medium">收款方式</Text>
            <Text className="text-xs text-zinc-400 ml-2">(微信收款到零钱)</Text>
          </View>
          <View className="flex items-center">
            <Text className="text-sm text-zinc-400">未开通</Text>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1" />
          </View>
        </View>
      </View>

      <View 
        className="bg-white rounded-2xl py-4 mb-10 shadow-sm flex justify-center items-center active:bg-zinc-50 transition-colors cursor-pointer"
        onClick={handleLogout}
      >
        <Text className="text-base text-red-500 font-bold tracking-wide">退出登录</Text>
      </View>

    </ScrollView>
  );
}
