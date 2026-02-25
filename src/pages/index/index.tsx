import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import './index.scss';

import Home from '../../components/Home';
import Forum from '../../components/Forum';       
import Messages from '../../components/Messages'; 

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

// 兜底数据
const mockChatsFallback = [
  { _id: '1', unread: 2 },
  { _id: '2', unread: 0 },
  { _id: '3', unread: 0 }
];

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

          // 查询最新的全局未读消息总数
          try {
            const msgRes = await db.collection('message_sessions').get();
            const localChats = Taro.getStorageSync('mock_chats') || mockChatsFallback;
            
            if (msgRes.data.length > 0) {
              // 解决云端因权限更新失败导致红点重现：读取本地已读状态进行合并计算
              const realUnread = msgRes.data.reduce((sum: number, item: any) => {
                const localMatch = localChats.find((lc: any) => lc._id === item._id);
                const itemUnread = (localMatch && localMatch.unread === 0) ? 0 : (item.unread || 0);
                return sum + itemUnread;
              }, 0);
              setUnreadTotal(realUnread);
            } else {
              setUnreadTotal(localChats.reduce((sum: number, item: any) => sum + (item.unread || 0), 0));
            }
          } catch(e) {
            const localChats = Taro.getStorageSync('mock_chats') || mockChatsFallback;
            setUnreadTotal(localChats.reduce((sum: number, item: any) => sum + (item.unread || 0), 0));
          }

          const updatedUserInfo = {
            ...currentUserInfo,
            published: pubRes.total,
            sold: soldRes.total,
            bought: boughtRes.total,
            favorites: favs.length
          };
          
          setUserInfo(updatedUserInfo);
          Taro.setStorageSync('userInfo', updatedUserInfo); 
        } catch (error) {
          console.error('同步数据库数据失败', error);
        }
      };
      
      syncData();
    } else {
      setIsLoggedIn(false);
      setUnreadTotal(0); // 未登录时清空红点
    }

    setHomeRefreshKey(prev => prev + 1);
  });

  const handleProfileClick = () => {
    if (isLoggedIn) Taro.navigateTo({ url: '/pages/settings/index' });
    else Taro.navigateTo({ url: '/pages/login/index' });
  };

  const navTo = (url: string) => {
    if (isLoggedIn) Taro.navigateTo({ url });
    else Taro.navigateTo({ url: '/pages/login/index' });
  };

  const renderProfile = () => (
    <View className="flex flex-col h-full bg-zinc-50 pb-32">
      <ScrollView scrollY className="flex-1 hide-scrollbar">
        <View className="bg-white px-6 pt-6 pb-10 shadow-sm relative overflow-hidden">
          <View className="absolute top-0 right-0 p-5 pt-4 flex space-x-5 z-10">
            <Image src={getIcon('settings', '#18181B')} className="w-9 h-9 cursor-pointer" onClick={handleProfileClick} />
          </View>
          
          <View className="flex items-center relative z-10 cursor-pointer" onClick={handleProfileClick}>
            <View className="w-28 h-28 bg-zinc-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <Image src={isLoggedIn ? userInfo.avatarUrl || getIcon('user', '#2563EB') : getIcon('user', '#A1A1AA')} className="w-16 h-16 object-cover" />
            </View>
            <View className="ml-6 flex-1">
              {isLoggedIn ? (
                <>
                  <Text className="text-4xl font-bold text-zinc-900 block">{userInfo.nickName}</Text>
                  <View className="flex items-center mt-3">
                    {userInfo.isAuth ? (
                      <View className="bg-green-50 px-3 py-1.5 rounded flex items-center border border-green-100">
                        <Image src={getIcon('shield-check', '#22C55E')} className="w-5 h-5 mr-1.5" />
                        <Text className="text-sm text-green-600 font-bold tracking-wide">已认证：{userInfo.campus}</Text>
                      </View>
                    ) : (
                      <View className="bg-orange-50 px-3 py-1.5 rounded flex items-center border border-orange-100">
                        <Image src={getIcon('shield-alert', '#F97316')} className="w-5 h-5 mr-1.5" />
                        <Text className="text-sm text-orange-600 font-bold tracking-wide">未进行校园认证</Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-4xl font-bold text-zinc-900 block">点击授权登录</Text>
                  <Text className="text-lg text-zinc-500 mt-2 block">登录后享受完整校园交易体验</Text>
                </>
              )}
            </View>
          </View>
          
          <View className="flex justify-between mt-12 px-3">
            <View className="flex flex-col items-center" onClick={() => navTo(`/pages/seller/index?name=${userInfo.nickName}`)}>
              <Text className="font-bold text-4xl text-zinc-900">{isLoggedIn ? userInfo.published || 0 : '-'}</Text>
              <Text className="text-lg text-zinc-600 mt-2">我发布的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/order/index?tab=sold')}>
              <Text className="font-bold text-4xl text-zinc-900">{isLoggedIn ? userInfo.sold || 0 : '-'}</Text>
              <Text className="text-lg text-zinc-600 mt-2">我卖出的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/order/index?tab=bought')}>
              <Text className="font-bold text-4xl text-zinc-900">{isLoggedIn ? userInfo.bought || 0 : '-'}</Text>
              <Text className="text-lg text-zinc-600 mt-2">我买到的</Text>
            </View>
            <View className="flex flex-col items-center" onClick={() => navTo('/pages/favorite/index')}>
              <Text className="font-bold text-4xl text-zinc-900">{isLoggedIn ? userInfo.favorites || 0 : '-'}</Text>
              <Text className="text-lg text-zinc-600 mt-2">我的收藏</Text>
            </View>
          </View>
        </View>

          <View className="flex justify-around mt-8 px-4 py-4 bg-zinc-50/50 rounded-2xl mx-4">
            <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo('/pages/history/index')}>
              <Image src={getIcon('clock', '#3B82F6')} className="w-6 h-6 mb-1" />
              <Text className="text-sm text-zinc-600 font-medium">浏览足迹</Text>
            </View>
            <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo('/pages/following/index')}>
              <Image src={getIcon('users', '#F97316')} className="w-6 h-6 mb-1" />
              <Text className="text-sm text-zinc-600 font-medium">我的关注</Text>
            </View>
            <View className="flex flex-col items-center cursor-pointer" onClick={() => navTo('/pages/report/index')}>
              <Image src={getIcon('headphones', '#22C55E')} className="w-6 h-6 mb-1" />
              <Text className="text-sm text-zinc-600 font-medium">客服中心</Text>
            </View>
          </View>

        <View className="mt-4 bg-white px-6 py-3">
          <View className="flex items-center justify-between py-6 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/wallet/index')}>
            <View className="flex items-center"><Image src={getIcon('wallet', '#3F3F46')} className="w-8 h-8 mr-4" /><Text className="text-xl font-medium text-zinc-800">我的钱包</Text></View>
            <View className="flex items-center"><Text className="text-lg text-zinc-400 mr-3">{isLoggedIn ? '去查看' : '未登录'}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-7 h-7" /></View>
          </View>
          <View className="flex items-center justify-between py-6 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/order/index')}>
            <View className="flex items-center"><Image src={getIcon('shopping-bag', '#3F3F46')} className="w-8 h-8 mr-4" /><Text className="text-xl font-medium text-zinc-800">我的订单</Text></View>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-7 h-7" />
          </View>
          <View className="flex items-center justify-between py-6 border-b border-zinc-50 cursor-pointer" onClick={() => navTo('/pages/auth/index')}>
            <View className="flex items-center"><Image src={getIcon('shield-check', '#3F3F46')} className="w-8 h-8 mr-4" /><Text className="text-xl font-medium text-zinc-800">校园身份认证</Text></View>
            <View className="flex items-center"><Text className={`text-lg mr-3 ${userInfo.isAuth ? 'text-green-500' : 'text-zinc-400'}`}>{userInfo.isAuth ? '已认证' : '去认证'}</Text><Image src={getIcon('chevron-right', '#D4D4D8')} className="w-7 h-7" /></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View className="flex flex-col h-screen w-full bg-white relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <View className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <Home refreshTrigger={homeRefreshKey} />}
        {activeTab === 'forum' && <Forum refreshTrigger={homeRefreshKey} />}
        {activeTab === 'messages' && <Messages refreshTrigger={homeRefreshKey} onUnreadUpdate={setUnreadTotal} />}
        {activeTab === 'profile' && renderProfile()}
      </View>

      <View className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-zinc-100 flex justify-between items-end pb-10 pt-3 px-3 z-50">
        <View onClick={() => setActiveTab('home')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('home', activeTab === 'home' ? '#2563EB' : '#A1A1AA')} className="w-8 h-8 mb-1.5" />
          <Text className={`text-sm font-bold ${activeTab === 'home' ? 'text-blue-600' : 'text-zinc-400'}`}>首页</Text>
        </View>

        <View onClick={() => setActiveTab('forum')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('compass', activeTab === 'forum' ? '#2563EB' : '#A1A1AA')} className="w-8 h-8 mb-1.5" />
          <Text className={`text-sm font-bold ${activeTab === 'forum' ? 'text-blue-600' : 'text-zinc-400'}`}>校园圈</Text>
        </View>
        
        <View className="flex flex-col items-center flex-1 relative cursor-pointer" onClick={() => {
          if (!isLoggedIn) {
            Taro.navigateTo({ url: '/pages/login/index' });
          } else if (!userInfo.isAuth) {
            Taro.showToast({ title: '请先完成校园身份认证', icon: 'none' });
            setTimeout(() => Taro.navigateTo({ url: '/pages/auth/index' }), 1000); 
          } else {
            Taro.navigateTo({ url: '/pages/publish/index' });
          }
        }}>
          <View className="absolute bottom-3 w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-95 transition-transform">
            <Image src={getIcon('plus', '#FFFFFF')} className="w-9 h-9" />
          </View>
          <Text className="text-sm font-bold mt-1 text-transparent">发布</Text>
        </View>
        
        <View onClick={() => setActiveTab('messages')} className="flex flex-col items-center flex-1 relative cursor-pointer">
          <View className="relative">
            <Image src={getIcon('message-circle', activeTab === 'messages' ? '#2563EB' : '#A1A1AA')} className="w-8 h-8 mb-1.5" />
            {unreadTotal > 0 && (
              <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10"></View>
            )}
          </View>
          <Text className={`text-sm font-bold ${activeTab === 'messages' ? 'text-blue-600' : 'text-zinc-400'}`}>消息</Text>
        </View>

        <View onClick={() => setActiveTab('profile')} className="flex flex-col items-center flex-1 cursor-pointer">
          <Image src={getIcon('user', activeTab === 'profile' ? '#2563EB' : '#A1A1AA')} className="w-8 h-8 mb-1.5" />
          <Text className={`text-sm font-bold ${activeTab === 'profile' ? 'text-blue-600' : 'text-zinc-400'}`}>我的</Text>
        </View>
      </View>
    </View>
  );
}
