import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function Favorite() {
  const [favorites, setFavorites] = useState<any[]>([]);

  useDidShow(() => {
    // 每次显示页面时，读取最新的收藏缓存
    const favs = Taro.getStorageSync('favorites') || [];
    setFavorites(favs);
  });

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      <View className="px-5 py-4 shrink-0">
        <Text className="text-xl text-zinc-500 font-medium">共收藏 {favorites.length} 件宝贝</Text>
      </View>
      
      <ScrollView scrollY className="flex-1 px-4 pb-10">
        {favorites.length === 0 ? (
          <View className="flex flex-col items-center justify-center mt-32">
            <Image src={getIcon('star', '#D4D4D8')} className="w-24 h-24 mb-4 opacity-50" />
            <Text className="text-xl text-zinc-400">还没有收藏任何宝贝哦~</Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-4">
            {favorites.map(product => (
              <View 
                key={product._id} 
                className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col active:scale-[0.98] transition-transform cursor-pointer pb-2"
                onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}
              >
                {/* 强制图片比例并使用 aspectFill 确保图片不留白 */}
                <View className="w-full bg-zinc-100 flex items-center justify-center relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  <Image src={product.imageUrl || getIcon('camera', '#D4D4D8')} mode="aspectFill" className="w-full h-full object-cover block absolute inset-0" />
                  {product.tag && (
                    <View className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-zinc-800 text-sm font-medium px-2 py-1 rounded shadow-sm z-10">
                      <Text>{product.tag}</Text>
                    </View>
                  )}
                </View>
                
                {/* 字体全面放大 */}
                <View className="p-4">
                  <Text className="text-lg font-bold text-zinc-800 line-clamp-2 mb-3 leading-relaxed">{product.title}</Text>
                  <Text className="text-red-500 font-bold text-2xl tracking-tight"><Text className="text-sm mr-1">¥</Text>{product.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
