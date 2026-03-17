import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const validColor = color || '#A1A1AA';
  const hex = validColor.replace('#', '');
  const map: any = { 'user': 'user', 'shield-check': 'security-checked', 'camera': 'camera' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

// 默认图片常量
const DEFAULT_IMG = 'https://img.icons8.com/ios-filled/128/D4D4D8/camera.png';

export default function SellerProfile() {
  const [sellerName, setSellerName] = useState('未知卖家');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);

  useLoad((options) => {
    const name = options.name ? decodeURIComponent(options.name) : '未知卖家';
    setSellerName(name);

    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo && userInfo.nickName === name) {
      setIsMe(true);
    }

    const followList = Taro.getStorageSync('following_list') || [];
    if (followList.some((item: any) => item.name === name)) {
      setIsFollowing(true);
    }

    fetchSellerProducts(name, userInfo);
  });

  const fetchSellerProducts = async (targetName: string, currentUserInfo: any) => {
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('products').where({ seller: targetName }).get();

      const sortedData = res.data.sort((a: any, b: any) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
        return timeB - timeA;
      });

      const displayProducts = (currentUserInfo && currentUserInfo.nickName === targetName)
        ? sortedData
        : sortedData.filter((p: any) => p.status !== 'sold');

      setProducts(displayProducts);
    } catch (error) {
      console.error('获取卖家商品失败', error);
      Taro.showToast({ title: '获取商品失败', icon: 'none' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = () => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (!userInfo) return Taro.showToast({ title: '请先登录', icon: 'none' });
    if (isMe) return Taro.showToast({ title: '不能关注自己哦', icon: 'none' });

    let followList = Taro.getStorageSync('following_list') || [];

    if (isFollowing) {
      followList = followList.filter((item: any) => item.name !== sellerName);
      setIsFollowing(false);
      Taro.showToast({ title: '已取消关注', icon: 'none' });
    } else {
      followList.unshift({ name: sellerName, avatar: '', bio: '这个同学很懒，还没有填写个人简介~' });
      setIsFollowing(true);
      Taro.showToast({ title: '关注成功', icon: 'success' });
    }
    Taro.setStorageSync('following_list', followList);
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50 box-border w-full">
      <View className="bg-white px-5 pt-8 pb-6 shadow-sm w-full box-border">
        <View className="flex items-center mb-4 w-full">
          <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border border-zinc-100 overflow-hidden shrink-0">
            <Image src={getIcon('user', '#2563EB')} className="w-8 h-8 object-cover" />
          </View>

          <View className="ml-4 flex-1 overflow-hidden">
            <Text className="text-xl font-bold text-zinc-900 block truncate">{sellerName}</Text>
            <View className="flex items-center mt-1.5">
              <View className="bg-green-50 px-2 py-0.5 rounded flex items-center border border-green-100">
                <Image src={getIcon('shield-check', '#22C55E')} className="w-3 h-3 mr-1 shrink-0" />
                <Text className="text-[10px] text-green-600 font-bold">已实名认证</Text>
              </View>
            </View>
          </View>

          <View
            className={`ml-3 px-5 py-2 rounded-full font-bold text-sm shrink-0 transition-colors active:scale-95 ${isFollowing || isMe ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'}`}
            onClick={handleToggleFollow}
          >
            {isMe ? '我自己' : (isFollowing ? '已关注' : '+ 关注')}
          </View>
        </View>
      </View>

      <View className="px-5 py-3 w-full box-border">
        <Text className="text-sm font-bold text-zinc-800">Ta发布的闲置 ({products.length})</Text>
      </View>

      <ScrollView scrollY enableFlex={true} className=" px-5 w-full box-border">
        <View className="flex-1">
        {isLoading ? (
          <View className="py-10 flex justify-center"><Text className="text-zinc-400">加载中...</Text></View>
        ) : products.length === 0 ? (
          <View className="py-10 flex justify-center"><Text className="text-zinc-400">该卖家暂时没有闲置~</Text></View>
        ) : (
          <View className="grid grid-cols-2 gap-3.5 pb-10 w-full box-border">
            {products.map(product => (
              <View
                key={product._id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100/80 flex flex-col active:scale-[0.98] transition-transform w-full ${product.status === 'sold' ? 'opacity-60' : ''}`}
                onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}
              >
                <View className="w-full bg-zinc-100 flex items-center justify-center relative" style={{ aspectRatio: '4/5' }}>
                  {/* 核心修复：强制使用兜底图 */}
                  <Image src={product.imageUrl || DEFAULT_IMG} mode="aspectFill" className="w-full h-full object-cover absolute inset-0" />
                  <View className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-zinc-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm z-10">
                    <Text>{product.tag}</Text>
                  </View>
                </View>
                <View className="p-3 flex flex-col flex-1 w-full box-border relative">
                  <Text className="text-[13px] font-bold text-zinc-800 line-clamp-2 leading-relaxed mb-3">{product.title}</Text>
                  <View className="mt-auto flex items-baseline justify-between w-full">
                    <Text className="text-red-500 font-bold text-base tracking-tight"><Text className="text-[10px] mr-0.5">¥</Text>{product.price}</Text>
                    {product.status === 'sold' && <Text className="text-[10px] text-zinc-400 font-bold">已售出</Text>}
                  </View>
                </View>
              </View>
            ))}
          </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
