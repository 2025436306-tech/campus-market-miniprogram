import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function History() {
  const [historyList, setHistoryList] = useState<any[]>([]);

  // 每次进入页面时读取最新足迹
  useDidShow(() => {
    const history = Taro.getStorageSync('view_history') || [];
    setHistoryList(history);
  });

  const handleClear = () => {
    Taro.showModal({
      title: '清空足迹',
      content: '确定要清空所有浏览记录吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('view_history');
          setHistoryList([]);
          Taro.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      {/* 顶部操作栏 */}
      <View className="flex justify-between items-center px-5 py-4 shrink-0">
        <Text className="text-sm text-zinc-500">共 {historyList.length} 条记录</Text>
        {historyList.length > 0 && (
          <View className="flex items-center cursor-pointer active:opacity-60" onClick={handleClear}>
            <Image src={getIcon('trash-2', '#EF4444')} className="w-4 h-4 mr-1" />
            <Text className="text-sm text-red-500">清空</Text>
          </View>
        )}
      </View>

      <ScrollView scrollY className="flex-1 px-4 pb-10">
        {historyList.length === 0 ? (
          <View className="flex flex-col items-center justify-center mt-32">
            <Image src={getIcon('clock', '#D4D4D8')} className="w-16 h-16 mb-4 opacity-50" />
            <Text className="text-zinc-400">还没有留下任何足迹哦~</Text>
          </View>
        ) : (
          <View className="grid grid-cols-2 gap-3.5">
            {historyList.map(product => (
              <View 
                key={product._id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100/80 flex flex-col active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}
              >
                <View className="w-full bg-zinc-100 flex items-center justify-center relative" style={{ aspectRatio: '1/1' }}>
                  <Image src={product.imageUrl || getIcon('camera', '#D4D4D8')} className="w-full h-full object-cover" />
                  {product.tag && (
                    <View className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-zinc-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm">
                      <Text>{product.tag}</Text>
                    </View>
                  )}
                </View>
                <View className="p-3">
                  <Text className="text-[13px] font-bold text-zinc-800 line-clamp-2 mb-2 leading-relaxed">{product.title}</Text>
                  <Text className="text-red-500 font-bold text-base tracking-tight"><Text className="text-[10px] mr-0.5">¥</Text>{product.price}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
