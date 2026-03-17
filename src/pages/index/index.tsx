import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import './index.scss';

import Home from '../../components/Home';
import Forum from '../../components/Forum';
import Messages from '../../components/Messages';

// 强力锁定使用纯 PNG 图标，完美兼容所有安卓机
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = {
    'home': 'home', 'compass': 'compass', 'plus': 'plus-math', 'message-circle': 'speech-bubble',
    'user': 'user', 'settings': 'settings', 'clock': 'time', 'users': 'user-group-man-man',
    'headphones': 'headset', 'wallet': 'wallet', 'shopping-bag': 'shopping-bag', 'map-pin': 'marker',
    'chevron-right': 'chevron-right', 'shield-check': 'security-checked', 'shield-alert': 'security-warning'
  };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

const mockChatsFallback = [{ _id: '1', unread: 2 }, { _id: '2', unread: 0 }, { _id: '3', unread: 0 }];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    avatarUrl: '', nickName: '', campus: '', published: 0, sold: 0, bought: 0, favorites: 0, isAuth: false
  });

  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);

  useDidShow(() => {
    const loggedInStatus = Taro.getStorageSync('isLoggedIn');
    let currentUserInfo = Taro.getStorageSync('userInfo');

    if (loggedInStatus && currentUserInfo) {
      setIsLoggedIn(true);
      setUserInfo(currentUserInfo);

      const syncData = async () => {
        try {
          const db = Taro.cloud.database();
          const pubRes = await db.collection('products').where({ seller: currentUserInfo.nickName }).count();
          const soldRes = await db.collection('orders').where({ seller: currentUserInfo.nickName }).count();
          const boughtRes = await db.collection('orders').where({ buyer: currentUserInfo.nickName }).count();
          const favs = Taro.getStorageSync('favorites') || [];

          try {
            const msgRes = await db.collection('message_sessions').get();
            const localChats = Taro.getStorageSync('mock_chats') || mockChatsFallback;
            if (msgRes.data.length > 0) {
              const realUnread = msgRes.data.reduce((sum: number, item: any) => {
                const localMatch = localChats.find((lc: any) => lc._id === item._id);
                return sum + ((localMatch && localMatch.unread === 0) ? 0 : (item.unread || 0));
              }, 0);
              setUnreadTotal(realUnread);
            } else { setUnreadTotal(localChats.reduce((sum: number, item: any) => sum + (item.unread || 0), 0)); }
          } catch (e) {
            const localChats = Taro.getStorageSync('mock_chats') || mockChatsFallback;
            setUnreadTotal(localChats.reduce((sum: number, item: any) => sum + (item.unread || 0), 0));
          }

          const updatedUserInfo = { ...currentUserInfo, published: pubRes.total, sold: soldRes.total, bought: boughtRes.total, favorites: favs.length };
          setUserInfo(updatedUserInfo);
          Taro.setStorageSync('userInfo', updatedUserInfo);
        } catch (error) { }
      };
      syncData();
    } else {
      setIsLoggedIn(false); setUnreadTotal(0);
    }
    setHomeRefreshKey(prev => prev + 1);
  });

  const handleProfileClick = () => { if (isLoggedIn) Taro.navigateTo({ url: '/pages/settings/index' }); else Taro.navigateTo({ url: '/pages/login/index' }); };
  const navTo = (url: string) => { if (isLoggedIn) Taro.navigateTo({ url }); else Taro.navigateTo({ url: '/pages/login/index' }); };
  const handleManageAddress = () => { if (!isLoggedIn) { Taro.navigateTo({ url: '/pages/login/index' }); return; } Taro.navigateTo({ url: '/pages/address/index' }); };

  const renderProfile = () => (
    <View className="flex flex-col h-full bg-zinc-50 relative w-full box-border">
      <ScrollView scrollY className="absolute inset-0 hide-scrollbar pb-32 w-full box-border">
        <View className="bg-white px-5 pt-6 pb-8 shadow-sm relative overflow-hidden w-full box-border">
          <View className="absolute top-0 right-0 p-4 pt-3 z-10">
            <Image src={getIcon('settings', '#18181B')} className="w-6 h-6 cursor-pointer" onClick={handleProfileClick} />
          </View>

          <View className="flex items-center relative z-10 cursor-pointer w-full box-border" onClick={handleProfileClick}>
            <View className="w-20 h-20 bg-zinc-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <Image src={isLoggedIn ? userInfo.avatarUrl || getIcon('user', '#2563EB') : getIcon('user', '#A1A1AA')} className="w-12 h-12 object-cover" />
            </View>
            <View className="ml-4 flex-1">
              {isLoggedIn ? (
                <>
                  <Text className="text-2xl font-bold text-zinc-900 block">{userInfo.nickName}</Text>
                  <View className="flex items-center mt-2">
                    {userInfo.isAuth ? (
                      <View className="bg-green-50 px-2 py-1 rounded flex items-center border border-green-100">
                        <Image src={getIcon('shield-check', '#22C55E')} className="w-3 h-3 mr-1" />
                        <Text className="text-[10px] text-green-600 font-bold tracking-wide">已认证：{userInfo.campus}</Text>
                      </View>
                    ) : (
                      <View className="bg-orange-50 px-2 py-1 rounded flex items-center border border-orange-100">
                        <Image src={getIcon('shield-alert', '#F97316')} className="w-3 h-3 mr-1" />
                        <Text className="text-[10px] text-orange-600 font-bold tracking-wide">未进行校园认证</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-2xl font-bold text-zinc-900 block">点击授权登录</Text>
                  <Text className="text-sm text-zinc-500 mt-1 block">登录后享受完整校园交易体验</Text>
                </>
              )}
            </View>
          </View>

          <View className="flex justify-between mt-8 px-2 w-full box-border">
            {/* 核心修复：给 userInfo.nickName 套上 encodeURIComponent，防止中文查询失败 */}
            <View className="flex flex-col items-center" onClick={() => navTo(`/pages/seller/index?name=${encodeURIComponent(userInfo.nickName)}`)}>
              <Text className="font-bold text-2xl text-zinc-900">{isLoggedIn ? userInfo.published || 0 : '-'}</Text>
              <Text className="text-sm text-zinc-500 mt-1">我发布的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/order/index?tab=sold')}>
              <Text className="font-bold text-2xl text-zinc-900">{isLoggedIn ? userInfo.sold || 0 : '-'}</Text>
              <Text className="text-sm text-zinc-500 mt-1">我卖出的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/order/index?tab=bought')}>
              <Text className="font-bold text-2xl text-zinc-900">{isLoggedIn ? userInfo.bought || 0 : '-'}</Text>
              <Text className="text-sm text-zinc-500 mt-1">我买到的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/favorite/index')}>
              <Text className="font-bold text-2xl text-zinc-900">{isLoggedIn ? userInfo.favorites || 0 : '-'}</Text>
              <Text className="text-sm text-zinc-500 mt-1">我的收藏</Text>
            </View>
          </View>
        </View>

        <View className="flex justify-around mt-4 px-3 py-3 bg-zinc-50/50 rounded-xl mx-4">
          <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo('/pages/history/index')}>
            <Image src={getIcon('clock', '#3B82F6')} className="w-5 h-5 mb-1" />
            <Text className="text-xs text-zinc-600 font-medium">浏览足迹</Text>
          </View>
          <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo('/pages/following/index')}>
            <Image src={getIcon('users', '#F97316')} className="w-5 h-5 mb-1" />
            <Text className="text-xs text-zinc-600 font-medium">我的关注</Text>
          </View>
          <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo(`/pages/chat/detail?name=${encodeURIComponent('官方客服')}`)}>
            <Image src={getIcon('headphones', '#22C55E')} className="w-5 h-5 mb-1" />
            <Text className="text-xs text-zinc-600 font-medium">客服中心</Text>
          </View>
        </View>

        <View className="mt-3 bg-white px-5 py-2 w-full box-border">
          <View className="flex items-center justify-between py-4 border-b border-zinc-50 cursor-pointer" onClick={handleManageAddress}>
            <View className="flex items-center">
              <Image src={getIcon('map-pin', '#3F3F46')} className="w-6 h-6 mr-3" />
              <Text className="text-base font-medium text-zinc-800">收货地址</Text>
            </View>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5" />
          </View>

          <View className="flex items-center justify-between py-4 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/wallet/index')}>
            <View className="flex items-center"><Image src={getIcon('wallet', '#3F3F46')} className="w-6 h-6 mr-3" /><Text className="text-base font-medium text-zinc-800">我的钱包</Text></View>
            <View className="flex items-center"><Text className="text-sm text-zinc-400 mr-2">{isLoggedIn ? '去查看' : '未登录'}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5" /></View>
          </View>

          <View className="flex items-center justify-between py-4 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/order/index')}>
            <View className="flex items-center"><Image src={getIcon('shopping-bag', '#3F3F46')} className="w-6 h-6 mr-3" /><Text className="text-base font-medium text-zinc-800">我的订单</Text></View>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5" />
          </View>

          <View className="flex items-center justify-between py-4 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/auth/index')}>
            <View className="flex items-center"><Image src={getIcon('shield-check', '#3F3F46')} className="w-6 h-6 mr-3" /><Text className="text-base font-medium text-zinc-800">校园身份认证</Text></View>
            <View className="flex items-center"><Text className={`text-sm mr-2 ${userInfo.isAuth ? 'text-green-500' : 'text-zinc-400'}`}>{userInfo.isAuth ? '已认证' : '去认证'}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5" /></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex flex-col h-screen w-full bg-white relative box-border overflow-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <View className="flex-1 overflow-hidden relative w-full">
        {activeTab === 'home' && <Home refreshTrigger={homeRefreshKey} />}
        {activeTab === 'forum' && <Forum refreshTrigger={homeRefreshKey} />}
        {activeTab === 'messages' && <Messages refreshTrigger={homeRefreshKey} onUnreadUpdate={setUnreadTotal} />}
        {activeTab === 'profile' && renderProfile()}
      </View>

      <View
        className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-zinc-100 flex justify-between items-center px-4 z-50 box-border"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', paddingTop: '8px' }}
      >
        <View onClick={() => setActiveTab('home')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('home', activeTab === 'home' ? '#2563EB' : '#A1A1AA')} className="w-6 h-6 mb-1" />
          <Text className={`text-[11px] font-bold ${activeTab === 'home' ? 'text-blue-600' : 'text-zinc-400'}`}>首页</Text>
        </View>

        <View onClick={() => setActiveTab('forum')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('compass', activeTab === 'forum' ? '#2563EB' : '#A1A1AA')} className="w-6 h-6 mb-1" />
          <Text className={`text-[11px] font-bold ${activeTab === 'forum' ? 'text-blue-600' : 'text-zinc-400'}`}>校园圈</Text>
        </View>

        <View className="flex flex-col items-center flex-1 relative cursor-pointer" onClick={() => {
          if (!isLoggedIn) { Taro.navigateTo({ url: '/pages/login/index' }); }
          else if (!userInfo.isAuth) { Taro.showToast({ title: '请先完成认证', icon: 'none' }); setTimeout(() => Taro.navigateTo({ url: '/pages/auth/index' }), 1000); }
          else { Taro.navigateTo({ url: '/pages/publish/index' }); }
        }}>
          <View className="absolute -top-6 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/40">
            <Image src={getIcon('plus', '#FFFFFF')} className="w-6 h-6" />
          </View>
          <Text className="text-[11px] font-bold mt-7 text-zinc-800">发布</Text>
        </View>

        <View onClick={() => setActiveTab('messages')} className="flex flex-col items-center flex-1 relative cursor-pointer">
          <View className="relative">
            <Image src={getIcon('message-circle', activeTab === 'messages' ? '#2563EB' : '#A1A1AA')} className="w-6 h-6 mb-1" />
            {unreadTotal > 0 && <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white z-10"></View>}
          </View>
          <Text className={`text-[11px] font-bold ${activeTab === 'messages' ? 'text-blue-600' : 'text-zinc-400'}`}>消息</Text>
        </View>

        <View onClick={() => setActiveTab('profile')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('user', activeTab === 'profile' ? '#2563EB' : '#A1A1AA')} className="w-6 h-6 mb-1" />
          <Text className={`text-[11px] font-bold ${activeTab === 'profile' ? 'text-blue-600' : 'text-zinc-400'}`}>我的</Text>
        </View>
      </View>
    </View>
  );
}
