import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function Following() {
  const [followingList, setFollowingList] = useState<any[]>([]);

  // 每次进入页面时读取最新的关注列表
  useDidShow(() => {
    const list = Taro.getStorageSync('following_list') || [];
    setFollowingList(list);
  });

  const handleUnfollow = (e: any, sellerName: string) => {
    e.stopPropagation(); // 阻止点击事件冒泡到外层跳转
    Taro.showModal({
      title: '取消关注',
      content: `确定不再关注 ${sellerName} 吗？`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          const currentList = Taro.getStorageSync('following_list') || [];
          const newList = currentList.filter((item: any) => item.name !== sellerName);
          
          Taro.setStorageSync('following_list', newList);
          setFollowingList(newList);
          Taro.showToast({ title: '已取消关注', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      {/* 顶部统计 */}
      <View className="flex justify-between items-center px-5 py-4 shrink-0">
        <Text className="text-sm text-zinc-500">共关注了 {followingList.length} 位同学</Text>
      </View>

      <ScrollView scrollY className="flex-1 px-4 pb-10">
        {followingList.length === 0 ? (
          <View className="flex flex-col items-center justify-center mt-32">
            <Image src={getIcon('users', '#D4D4D8')} className="w-16 h-16 mb-4 opacity-50" />
            <Text className="text-zinc-400">你还没有关注任何人哦~</Text>
          </View>
        ) : (
          followingList.map((seller, index) => (
            <View 
              key={index} 
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-center active:bg-zinc-50 transition-colors cursor-pointer"
              onClick={() => Taro.navigateTo({ url: `/pages/seller/index?name=${encodeURIComponent(seller.name)}` })}
            >
              <View className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center border border-zinc-100 overflow-hidden shrink-0">
                <Image src={seller.avatar || getIcon('user', '#2563EB')} className="w-full h-full object-cover" />
              </View>
              
              <View className="ml-4 flex-1 overflow-hidden">
                <Text className="text-lg font-bold text-zinc-900 truncate block">{seller.name}</Text>
                <Text className="text-sm text-zinc-400 truncate block mt-1">{seller.bio || '这个人很懒，什么都没写~'}</Text>
              </View>

              <View 
                className="ml-3 px-4 py-1.5 rounded-full border border-zinc-200 shrink-0 active:bg-zinc-100"
                onClick={(e) => handleUnfollow(e, seller.name)}
              >
                <Text className="text-xs text-zinc-500 font-medium">已关注</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
