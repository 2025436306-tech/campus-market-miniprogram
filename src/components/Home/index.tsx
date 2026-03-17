import React, { useState, useEffect } from 'react';
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components';
import Taro from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = { 'search': 'search', 'time': 'time', 'user-group-man-man': 'user-group-man-man', 'headset': 'headset', 'round': 'round', 'user': 'user', 'marker': 'marker', 'chevron-right': 'chevron-right', 'security-checked': 'security-checked', 'security-warning': 'security-warning', 'speech-bubble': 'speech-bubble', 'compass': 'compass', 'plus-math': 'plus-math' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

const defaultBanners = [
  { _id: '1', imageUrl: 'cloud://xuequ-cloud-5gnf1cc65b7e8d71.7875-xuequ-cloud-5gnf1cc65b7e8d71-1325141203/banners/wx.png', link: '' }
];

export default function Home({ refreshTrigger = 0 }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>(defaultBanners);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = [
    { id: 'all', name: '推荐' }, { id: 'book', name: '图书资料' },
    { id: 'digital', name: '数码电子' }, { id: 'daily', name: '生活好物' },
    { id: 'clothes', name: '服饰美妆' },
  ];

  useEffect(() => { fetchData(); }, [refreshTrigger]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const db = Taro.cloud.database();
      try {
        const bannerRes = await db.collection('banners').get();
        if (bannerRes.data.length > 0) setBanners(bannerRes.data);
      } catch (e) { }

      // 核心修复：拉取商品的同时，拉取全部订单，进行“双重查杀”
      const productRes = await db.collection('products').orderBy('createTime', 'desc').get();
      let soldIds = new Set();
      try {
        const orderRes = await db.collection('orders').get();
        orderRes.data.forEach((o: any) => soldIds.add(o.productId));
      } catch (e) { }

      // 如果商品状态是 sold，或者已经在订单表里出现了，就把它藏起来
      const availableProducts = productRes.data.filter((p: any) => p.status !== 'sold' && !soldIds.has(p._id));
      setProducts(availableProducts);

    } catch (error) { }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchData(); };
  const doSearch = () => { setAppliedKeyword(searchKeyword.trim()); };
  const clearSearch = () => { setSearchKeyword(''); setAppliedKeyword(''); };
  const handleBannerClick = (link: string) => { if (link) Taro.navigateTo({ url: link }); };

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !appliedKeyword || p.title.toLowerCase().includes(appliedKeyword.toLowerCase()) || (p.description && p.description.toLowerCase().includes(appliedKeyword.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <View className="flex flex-col h-full bg-zinc-50 relative pb-32">
      <View className="bg-white px-4 pt-2 pb-3 z-20 shrink-0">
        <View className="flex justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-zinc-900 tracking-tight">拾集校园</Text>
        </View>
        <View className="flex items-center space-x-2">
          <View className="flex-1 flex items-center bg-zinc-100 rounded-xl px-4 py-2">
            <Image src={getIcon('search', '#A1A1AA')} className="w-5 h-5 mr-2 shrink-0" />
            <Input type="text" confirmType="search" placeholder="搜索闲置好物" className="bg-transparent border-none outline-none w-full text-base text-zinc-800 h-6" placeholderTextColor="#A1A1AA" value={searchKeyword} onInput={(e) => setSearchKeyword(e.detail.value)} onConfirm={doSearch} />
            {searchKeyword.length > 0 && <View className="pl-2 py-1 cursor-pointer" onClick={clearSearch}><Image src={getIcon('x-circle', '#A1A1AA')} className="w-5 h-5 shrink-0" /></View>}
          </View>
          <View className="shrink-0 px-4 py-2 bg-blue-600 rounded-xl cursor-pointer" onClick={doSearch}>
            <Text className="text-white text-base font-bold">搜索</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 relative">
        <ScrollView scrollY className="absolute inset-0 hide-scrollbar w-full box-border" refresherEnabled={true} refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>

          <View className="px-4 pt-3 pb-2 w-full box-border">
            <Swiper className="w-full h-36 rounded-2xl overflow-hidden shadow-sm transform translate-z-0" indicatorDots indicatorColor="rgba(255, 255, 255, 0.5)" indicatorActiveColor="#ffffff" autoplay circular>
              {banners.map((banner) => (
                <SwiperItem key={banner._id} onClick={() => handleBannerClick(banner.link)}>
                  <Image src={banner.imageUrl} mode="aspectFill" className="w-full h-full object-cover block" />
                </SwiperItem>
              ))}
            </Swiper>
          </View>

          <ScrollView scrollX className="flex whitespace-nowrap px-4 py-3 bg-zinc-50 sticky z-10 hide-scrollbar w-full box-border" style={{ top: 0 }}>
            {categories.map(cat => (
              <View key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`inline-block mr-6 text-sm pb-1.5 relative cursor-pointer ${activeCategory === cat.id ? 'font-bold text-zinc-900' : 'font-medium text-zinc-500'}`}>
                <Text>{cat.name}</Text>
                {activeCategory === cat.id && <View className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-blue-600 rounded-full"></View>}
              </View>
            ))}
          </ScrollView>

          {isLoading && !isRefreshing ? (
            <View className="flex justify-center py-10"><Text className="text-zinc-400 text-sm">加载中...</Text></View>
          ) : filteredProducts.length === 0 ? (
            <View className="flex justify-center py-10"><Text className="text-zinc-400 text-sm">没找到商品哦~</Text></View>
          ) : (
            <View className="px-4 py-2 grid grid-cols-2 gap-3 pb-10 w-full box-border">
              {filteredProducts.map(product => (
                <View key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 flex flex-col w-full" onClick={() => Taro.navigateTo({ url: `/pages/product/detail?id=${product._id}` })}>
                  <View className="w-full bg-zinc-100 flex items-center justify-center relative" style={{ aspectRatio: '1/1' }}>
                    <Image src={product.imageUrl || getIcon('camera', '#D4D4D8')} mode="aspectFill" className="w-full h-full object-cover absolute inset-0" />
                    <View className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-zinc-800 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm"><Text>{product.tag}</Text></View>
                  </View>
                  <View className="p-3 flex flex-col flex-1 w-full box-border">
                    <Text className="text-sm font-bold text-zinc-800 line-clamp-2 leading-relaxed mb-2">{product.title}</Text>
                    <View className="mt-auto">
                      <View className="flex items-baseline mb-1">
                        <Text className="text-red-500 font-bold text-lg"><Text className="text-[10px] mr-0.5">¥</Text>{product.price}</Text>
                      </View>
                      <View className="flex items-center text-[11px] text-zinc-400 overflow-hidden">
                        <Image src={getIcon('user', '#A1A1AA')} className="w-3 h-3 mr-1 shrink-0" />
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
