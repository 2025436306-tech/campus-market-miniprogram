import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.params; 
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // 新增：商品留言列表状态
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) setCurrentUser(userInfo);

    const favs = Taro.getStorageSync('favorites') || [];
    if (favs.some((f: any) => f._id === id)) setIsFavorited(true);

    const fetchData = async () => {
      if (!id) return;
      try {
        const db = Taro.cloud.database();
        // 1. 获取商品详情
        const res = await db.collection('products').doc(id).get();
        const pData = res.data;
        setProduct(pData);

        // 2. 获取该商品的所有留言评论
        const commentsRes = await db.collection('product_comments').where({ productId: id }).orderBy('createTime', 'asc').get();
        setComments(commentsRes.data);

        // 3. 记录足迹
        let history = Taro.getStorageSync('view_history') || [];
        history = history.filter((h: any) => h._id !== pData._id);
        history.unshift(pData);
        if (history.length > 30) history.pop();
        Taro.setStorageSync('view_history', history);

      } catch (error) {
        console.error('获取详情失败', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const isSeller = currentUser && product && currentUser.nickName === product.seller;

  const handleFavorite = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    let favs = Taro.getStorageSync('favorites') || [];
    if (isFavorited) {
      favs = favs.filter((f: any) => f._id !== product._id);
      setIsFavorited(false);
      Taro.showToast({ title: '已取消收藏', icon: 'success' });
    } else {
      favs.push(product);
      setIsFavorited(true);
      Taro.showToast({ title: '收藏成功', icon: 'success' });
    }
    Taro.setStorageSync('favorites', favs);
  };

  const handleBuy = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    if (!currentUser.isAuth) {
      Taro.showToast({ title: '请先完成身份认证', icon: 'none' });
      setTimeout(() => Taro.navigateTo({ url: '/pages/auth/index' }), 1000);
      return;
    }
    Taro.navigateTo({ url: `/pages/checkout/index?id=${product._id}` });
  };

  // 核心修复：真实的发表留言与数据库交互逻辑
  const handleComment = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    Taro.showModal({
      title: '发表留言',
      editable: true,
      placeholderText: '问问卖家宝贝细节...',
      success: async (res) => {
        if (res.confirm && res.content) {
          Taro.showLoading({ title: '发送中...' });
          try {
            const db = Taro.cloud.database();
            const newComment = {
              productId: id,
              userName: currentUser.nickName,
              userAvatar: currentUser.avatarUrl,
              content: res.content,
              timeStr: '刚刚',
              createTime: db.serverDate()
            };
            
            // 写入数据库
            const addRes = await db.collection('product_comments').add({ data: newComment });
            
            // 乐观更新 UI，让评论立刻显示在下方
            setComments([...comments, { ...newComment, _id: addRes._id }]);
            
            Taro.hideLoading();
            Taro.showToast({ title: '留言成功', icon: 'success' });
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '留言失败', icon: 'error' });
          }
        }
      }
    });
  };

  if (isLoading) return <View className="h-screen flex items-center justify-center bg-white"><Text className="text-xl text-zinc-500">加载中...</Text></View>;
  if (!product) return <View className="h-screen flex items-center justify-center bg-white"><Text className="text-xl text-zinc-500">宝贝找不到了~</Text></View>;

  return (
    <View className="flex flex-col h-screen bg-zinc-50 relative">
      <View className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center cursor-pointer backdrop-blur" onClick={() => Taro.navigateTo({ url: `/pages/report/index?targetId=${id}&type=product` })}>
        <Image src={getIcon('alert-triangle', '#FFFFFF')} className="w-5 h-5" />
      </View>

      <View className="flex-1 relative">
        <ScrollView scrollY className="absolute inset-0 hide-scrollbar">
          <View className="pb-28">
            <View className="bg-white px-5 py-5 flex items-center justify-between">
              <View className="flex items-center cursor-pointer active:opacity-70" onClick={() => Taro.navigateTo({ url: `/pages/seller/index?name=${encodeURIComponent(product.seller)}` })}>
                <View className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                   <Image src={getIcon('user', '#2563EB')} className="w-8 h-8 object-cover" />
                </View>
                <View className="ml-4">
                  <Text className="text-xl font-bold text-zinc-900">{product.seller}</Text>
                </View>
              </View>
            </View>

            <View className="bg-white px-5 pb-6">
              <View className="flex items-baseline mb-4 space-x-3">
                <Text className="text-red-500 font-bold text-4xl tracking-tight"><Text className="text-xl mr-1">¥</Text>{product.price}</Text>
                <View className="bg-orange-50 px-3 py-1 rounded-md border border-orange-100"><Text className="text-sm text-orange-500 font-bold">支持小刀</Text></View>
              </View>
              <Text className="text-2xl font-bold text-zinc-900 leading-snug block mb-4">{product.title}</Text>
              <View className="bg-zinc-50 rounded-2xl p-4 mb-4">
                <Text className="text-xl text-zinc-700 leading-relaxed block">{product.description || '卖家很懒，暂时没有详细描述。'}</Text>
              </View>
            </View>

            <View className="w-full bg-white pb-6">
              {product.imageUrl ? (
                <Image src={product.imageUrl} mode="widthFix" className="w-full" />
              ) : (
                <View className="w-full h-64 bg-zinc-100 flex items-center justify-center"><Text className="text-lg text-zinc-400">暂无图片</Text></View>
              )}
            </View>

            {/* 新增：留言展示区，接在商品详情的下方 */}
            <View className="bg-white mt-3 px-5 py-6 min-h-[300px]">
              <Text className="text-2xl font-bold text-zinc-900 mb-6 block">全部留言 ({comments.length})</Text>
              
              {comments.length === 0 ? (
                <Text className="text-lg text-zinc-400 text-center block mt-8">还没有人留言，快来问问细节吧！</Text>
              ) : (
                comments.map((cmt) => (
                  <View key={cmt._id} className="flex mb-8">
                    <Image src={cmt.userAvatar || getIcon('user', '#A1A1AA')} className="w-12 h-12 rounded-full bg-zinc-200 shrink-0 object-cover" />
                    <View className="ml-4 flex-1 border-b border-zinc-100 pb-6">
                      <View className="flex items-center mb-2">
                        <Text className="text-lg font-bold text-zinc-500">{cmt.userName}</Text>
                        {/* 如果是卖家自己的留言，加上高亮标识 */}
                        {product.seller === cmt.userName && (
                          <Text className="text-sm text-blue-500 bg-blue-50 px-2 ml-2 rounded font-medium">卖家</Text>
                        )}
                      </View>
                      <Text className="text-xl text-zinc-900 block leading-relaxed">{cmt.content}</Text>
                      <Text className="text-sm text-zinc-400 block mt-3">{cmt.timeStr}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-0 left-0 w-full bg-white border-t border-zinc-100 px-5 py-3 pb-8 flex items-center justify-between z-50">
        <View className="flex space-x-8 pl-1">
          <View className="flex flex-col items-center cursor-pointer active:opacity-60" onClick={handleComment}>
            <Image src={getIcon('message-circle', '#3F3F46')} className="w-7 h-7 mb-1" />
            <Text className="text-sm text-zinc-600">留言</Text>
          </View>
          <View className="flex flex-col items-center cursor-pointer active:opacity-60" onClick={handleFavorite}>
            <Image src={getIcon('star', isFavorited ? '#F59E0B' : '#3F3F46')} className="w-7 h-7 mb-1" />
            <Text className={`text-sm ${isFavorited ? 'text-yellow-500 font-bold' : 'text-zinc-600'}`}>{isFavorited ? '已收藏' : '收藏'}</Text>
          </View>
        </View>
        
        <View className="flex space-x-4 pr-1">
          {isSeller ? (
            <View className="px-10 py-3.5 rounded-full bg-zinc-100 text-zinc-800 font-bold text-lg cursor-pointer">管理宝贝</View>
          ) : (
            <>
              <View className="px-6 py-3.5 rounded-full bg-orange-100 text-orange-600 font-bold text-lg cursor-pointer active:opacity-80" onClick={() => Taro.navigateTo({ url: `/pages/chat/detail?name=${encodeURIComponent(product.seller)}` })}>聊一聊</View>
              <View className="px-8 py-3.5 rounded-full bg-red-500 text-white font-bold text-lg shadow-md shadow-red-500/30 cursor-pointer active:opacity-80" onClick={handleBuy}>马上买</View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
