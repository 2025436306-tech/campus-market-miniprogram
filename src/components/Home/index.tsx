import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function Home({ refreshTrigger = 0 }) {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: '推荐' },
    { id: 'book', name: '图书资料' },
    { id: 'digital', name: '数码电子' },
    { id: 'daily', name: '生活好物' },
    { id: 'clothes', name: '服饰美妆' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('products').orderBy('createTime', 'desc').get();
      setProducts(res.data);
    } catch (error) {
      console.error('数据库拉取失败', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts();
  };

  const doSearch = () => {
    setAppliedKeyword(searchKeyword.trim());
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setAppliedKeyword('');
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !appliedKeyword || 
                        p.title.toLowerCase().includes(appliedKeyword.toLowerCase()) || 
                        (p.description && p.description.toLowerCase().includes(appliedKeyword.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <View className="flex flex-col h-full bg-zinc-50 relative pb-32">
      
      {/* 顶部搜索栏 */}
      <View className="bg-white px-5 pt-2 pb-4 z-20 shrink-0">
        <View className="flex justify-between items-center mb-5">
          <Text className="text-4xl font-bold text-zinc-900 tracking-tight">拾集校园</Text>
        </View>
        <View className="flex items-center space-x-3">
          <View className="flex-1 flex items-center bg-zinc-100 rounded-2xl px-5 py-3.5">
            <Image src={getIcon('search', '#A1A1AA')} className="w-7 h-7 mr-3 shrink-0" />
            <Input 
              type="text" 
              confirmType="search"
              placeholder="搜索你想要的闲置好物" 
              className="bg-transparent border-none outline-none w-full text-lg text-zinc-800 h-8" 
              placeholderTextColor="#A1A1AA" 
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
              onConfirm={doSearch} 
            />
            {searchKeyword.length > 0 && (
              <View className="pl-2 py-1 cursor-pointer active:opacity-60" onClick={clearSearch}>
                <Image src={getIcon('x-circle', '#A1A1AA')} className="w-6 h-6 shrink-0" />
              </View>
            )}
          </View>
          <View className="shrink-0 px-5 py-3.5 bg-blue-600 rounded-2xl cursor-pointer active:opacity-80" onClick={doSearch}>
            <Text className="text-white text-lg font-bold">搜索</Text>
          </View>
        </View>
      </View>

      {/* 滑动区域 */}
      <View className="flex-1 relative">
        <ScrollView 
          scrollY 
          className="absolute inset-0 hide-scrollbar"
          refresherEnabled={true}                
          refresherTriggered={isRefreshing}      
          onRefresherRefresh={handleRefresh}     
        >
          {/* Banner */}
          <View className="px-5 pt-5 pb-3">
            <View className="w-full h-40 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex flex-col justify-center px-8 relative overflow-hidden shadow-sm">
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></View>
              <Text className="text-blue-200 text-sm font-bold tracking-widest mb-2">GRADUATION SEASON</Text>
              <Text className="text-white text-3xl font-bold tracking-wide mb-1">毕业季·闲置循环</Text>
            </View>
          </View>

          {/* 分类栏 */}
          <ScrollView scrollX className="flex whitespace-nowrap px-5 py-4 bg-zinc-50 sticky z-10 hide-scrollbar" style={{ top: 0 }}>
            {categories.map(cat => (
              <View key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`inline-block mr-8 text-lg pb-2 relative cursor-pointer ${activeCategory === cat.id ? 'font-bold text-zinc-900' : 'font-medium text-zinc-500'}`}>
                <Text>{cat.name}</Text>
                {activeCategory === cat.id && <View className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-blue-600 rounded-full"></View>}
              </View>
            ))}
          </ScrollView>

          {/* 商品流 */}
          {isLoading && !isRefreshing ? (
            <View className="flex justify-center py-12"><Text className="text-zinc-400 text-lg">加载中...</Text></View>
          ) : filteredProducts.length === 0 ? (
            <View className="flex justify-center py-12"><Text className="text-zinc-400 text-lg">没有找到相关商品哦~</Text></View>
          ) : (
            <View className="px-5 py-3 grid grid-cols-2 gap-4 pb-10">
              {filteredProducts.map(product => (
                <View key={product._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100/80 flex flex-col active:scale-[0.98] transition-transform"
                  onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}
                >
                  <View className="w-full bg-zinc-100 flex items-center justify-center relative" style={{ aspectRatio: '4/5' }}>
                    <Image src={product.imageUrl || getIcon('camera', '#D4D4D8')} className="w-full h-full object-cover" />
                    <View className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-zinc-800 text-sm font-medium px-3 py-1 rounded shadow-sm">
                      <Text>{product.tag}</Text>
                    </View>
                  </View>
                  <View className="p-4 flex flex-col flex-1">
                    <Text className="text-lg font-bold text-zinc-800 line-clamp-2 leading-relaxed mb-4">{product.title}</Text>
                    <View className="mt-auto">
                      <View className="flex items-baseline mb-3">
                        <Text className="text-red-500 font-bold text-2xl tracking-tight"><Text className="text-sm mr-1">¥</Text>{product.price}</Text>
                      </View>
                      
                      {/* 核心改动：删除了 {product.wants}，并在卖家名字前加了小图标 */}
                      <View className="flex items-center text-sm text-zinc-500">
                        <Image src={getIcon('user', '#A1A1AA')} className="w-4 h-4 mr-1.5 shrink-0" />
                        <Text className="truncate flex-1">{product.seller}</Text>
                      </View>

                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
