import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function SellerProfile() {
  const router = useRouter();
  const sellerName = decodeURIComponent(router.params.name || '') || '未知卖家';

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // 新增：是否已关注状态

  useEffect(() => {
    // 检查本地缓存中是否已经关注了该卖家
    const followList = Taro.getStorageSync('following_list') || [];
    if (followList.some((item: any) => item.name === sellerName)) {
      setIsFollowing(true);
    }

    const fetchSellerProducts = async () => {
      try {
        const db = Taro.cloud.database();
        const res = await db.collection('products').where({ seller: sellerName }).get();
        setProducts(res.data);
      } catch (error) {
        console.error('获取卖家商品失败', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerProducts();
  }, [sellerName]);

  // 新增：处理关注/取消关注逻辑
  const handleToggleFollow = () => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (!userInfo) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (userInfo.nickName === sellerName) {
      Taro.showToast({ title: '不能关注自己哦', icon: 'none' });
      return;
    }

    let followList = Taro.getStorageSync('following_list') || [];
    
    if (isFollowing) {
      // 取消关注
      followList = followList.filter((item: any) => item.name !== sellerName);
      setIsFollowing(false);
      Taro.showToast({ title: '已取消关注', icon: 'none' });
    } else {
      // 添加关注 (存入名字、默认头像和简介，供关注列表页展示)
      followList.unshift({
        name: sellerName,
        avatar: '', // 实际开发可存卖家真实头像
        bio: '这个同学很懒，还没有填写个人简介~'
      });
      setIsFollowing(true);
      Taro.showToast({ title: '关注成功', icon: 'success' });
    }
    
    Taro.setStorageSync('following_list', followList);
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50">
      
      {/* 卖家资料卡片 */}
      <View className="bg-white px-5 pt-8 pb-6 shadow-sm">
        <View className="flex items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border border-zinc-100 overflow-hidden shrink-0">
            <Image src={getIcon('user', '#2563EB')} className="w-8 h-8 object-cover" />
          </View>
          
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-zinc-900 block truncate">{sellerName}</Text>
            <View className="flex items-center mt-1.5">
              <View className="bg-green-50 px-2 py-0.5 rounded flex items-center border border-green-100">
                <Image src={getIcon('shield-check', '#22C55E')} className="w-3 h-3 mr-1" />
                <Text className="text-[10px] text-green-600 font-bold">已实名认证</Text>
              </View>
            </View>
          </View>

          {/* 新增：关注按钮 */}
          <View 
            className={`ml-3 px-5 py-2 rounded-full font-bold text-sm shrink-0 transition-colors active:scale-95 ${isFollowing ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'}`}
            onClick={handleToggleFollow}
          >
            {isFollowing ? '已关注' : '+ 关注'}
          </View>
        </View>
        
        <Text className="text-sm text-zinc-500">该同学很懒，还没有填写个人简介~</Text>
      </View>

      <View className="px-5 py-3">
        <Text className="text-sm font-bold text-zinc-800">Ta发布的闲置 ({products.length})</Text>
      </View>

      {/* 商品瀑布流 */}
      <ScrollView scrollY className="flex-1 px-5">
        {isLoading ? (
          <View className="py-10 flex justify-center"><Text className="text-zinc-400">加载中...</Text></View>
        ) : products.length === 0 ? (
          <View className="py-10 flex justify-center"><Text className="text-zinc-400">该卖家暂时没有其他闲置~</Text></View>
        ) : (
          <View className="grid grid-cols-2 gap-3.5 pb-10">
            {products.map(product => (
              <View 
                key={product._id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100/80 flex flex-col active:scale-[0.98] transition-transform"
                onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}
              >
                <View className="w-full bg-zinc-100 flex items-center justify-center relative" style={{ aspectRatio: '4/5' }}>
                  <Image src={product.imageUrl || getIcon('camera', '#D4D4D8')} className="w-full h-full object-cover" />
                  <View className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-zinc-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm">
                    <Text>{product.tag}</Text>
                  </View>
                </View>
                <View className="p-3 flex flex-col flex-1">
                  <Text className="text-[13px] font-bold text-zinc-800 line-clamp-2 leading-relaxed mb-3">{product.title}</Text>
                  <View className="mt-auto flex items-baseline">
                    <Text className="text-red-500 font-bold text-base tracking-tight"><Text className="text-[10px] mr-0.5">¥</Text>{product.price}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
