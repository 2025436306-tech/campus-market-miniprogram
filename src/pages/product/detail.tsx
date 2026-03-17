import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';

// 防御性编程：确保 color 始终有值，防止 .replace 报错
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const validColor = color || '#A1A1AA';
  const hex = validColor.replace('#', '');
  const map: any = { 'user': 'user', 'message-circle': 'speech-bubble', 'star': 'star', 'camera': 'camera' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

// 默认占位图
const DEFAULT_IMG = 'https://img.icons8.com/ios-filled/128/D4D4D8/camera.png';

export default function ProductDetail() {
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  useLoad((options) => {
    const id = options.id || '';
    setProductId(id);

    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) setCurrentUser(userInfo);

    const favs = Taro.getStorageSync('favorites') || [];
    if (favs.some((f: any) => f._id === id)) setIsFavorited(true);

    fetchData(id);
  });

  const fetchData = async (id: string) => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      const db = Taro.cloud.database();
      const res = await db.collection('products').doc(id).get();
      setProduct(res.data);

      const commentsRes = await db.collection('product_comments').where({ productId: id }).get();
      const sortedComments = commentsRes.data.sort((a: any, b: any) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
        return timeA - timeB;
      });
      setComments(sortedComments);

      let history = Taro.getStorageSync('view_history') || [];
      history = history.filter((h: any) => h._id !== res.data._id);
      history.unshift(res.data);
      Taro.setStorageSync('view_history', history);
    } catch (error) {
      console.error('获取商品详情失败', error);
      Taro.showToast({ title: '获取详情失败', icon: 'none' });
    } finally {
      setIsLoading(false);
    }
  };

  const isSeller = currentUser && product && currentUser.nickName === product.seller;

  const handleFavorite = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    let favs = Taro.getStorageSync('favorites') || [];
    if (isFavorited) {
      favs = favs.filter((f: any) => f._id !== product._id);
      setIsFavorited(false);
      Taro.showToast({ title: '已取消', icon: 'success' });
    } else {
      favs.push(product);
      setIsFavorited(true);
      Taro.showToast({ title: '收藏成功', icon: 'success' });
    }
    Taro.setStorageSync('favorites', favs);
  };

  const handleBuy = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    Taro.navigateTo({ url: `/pages/checkout/index?id=${product._id}` });
  };

  const handleComment = () => {
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    Taro.showModal({
      title: '发表留言',
      editable: true,
      placeholderText: '问问细节...',
      success: async (res) => {
        if (res.confirm && res.content) {
          Taro.showLoading({ title: '发送中...' });
          try {
            const db = Taro.cloud.database();
            const newComment = {
              productId: productId,
              userName: currentUser.nickName,
              userAvatar: currentUser.avatarUrl,
              content: res.content,
              timeStr: '刚刚',
              createTime: db.serverDate()
            };
            const addRes = await db.collection('product_comments').add({ data: newComment });
            setComments([...comments, { ...newComment, _id: addRes._id }]);
            Taro.hideLoading();
            Taro.showToast({ title: '留言成功', icon: 'success' });
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '发送失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleManage = () => {
    Taro.showActionSheet({
      itemList: ['编辑宝贝', '下架并删除'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          Taro.navigateTo({ url: `/pages/publish/index?id=${product._id}` });
        } else if (res.tapIndex === 1) {
          Taro.showModal({
            title: '确认删除', content: '删除后无法恢复，确定吗？', confirmColor: '#EF4444',
            success: async (modalRes) => {
              if (modalRes.confirm) {
                Taro.showLoading({ title: '删除中...' });
                try {
                  await Taro.cloud.database().collection('products').doc(product._id).remove();
                  Taro.hideLoading();
                  Taro.showToast({ title: '已下架', icon: 'success' });
                  setTimeout(() => Taro.navigateBack(), 1500);
                } catch (e) {
                  Taro.hideLoading(); Taro.showToast({ title: '失败', icon: 'error' });
                }
              }
            }
          });
        }
      },
      fail: function () {
        // 什么都不做，拦截报错即可
      }
    });
  };

  if (isLoading || !product) {
    return <View className="h-screen flex justify-center pt-32 bg-white w-full"><Text className="text-zinc-400">加载中...</Text></View>;
  }

  return (
    <View className="flex flex-col h-screen bg-zinc-50 relative w-full box-border">
      <View className="flex-1 relative w-full overflow-hidden">
        <ScrollView scrollY enableFlex={true} className="absolute inset-0 hide-scrollbar box-border">
          <View className="pb-24 w-full">
          <View className="bg-white px-4 py-4 flex items-center justify-between w-full box-border">
            <View className="flex items-center cursor-pointer" onClick={() => Taro.navigateTo({ url: `/pages/seller/index?name=${encodeURIComponent(product.seller)}` })}>
              <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                <Image src={getIcon('user', '#2563EB')} className="w-6 h-6 object-cover" />
              </View>
              <Text className="ml-3 text-base font-bold text-zinc-900">{product.seller}</Text>
            </View>
          </View>

          <View className="bg-white px-4 pb-4 w-full box-border">
            <View className="flex items-baseline mb-3 space-x-2">
              <Text className="text-red-500 font-bold text-2xl tracking-tight"><Text className="text-sm mr-0.5">¥</Text>{product.price}</Text>
              {product.isBargain && <View className="bg-orange-50 px-2 py-0.5 rounded border border-orange-100"><Text className="text-xs text-orange-500 font-bold">可小刀</Text></View>}
            </View>
            <Text className="text-lg font-bold text-zinc-900 leading-snug block mb-3">{product.title}</Text>
            <View className="bg-zinc-50 rounded-xl p-3 mb-3 w-full box-border">
              <Text className="text-sm text-zinc-700 leading-relaxed block">{product.description || '无详细描述'}</Text>
            </View>
          </View>

          <View className="w-full bg-white pb-4 bg-zinc-100 min-h-[200px] flex items-center justify-center">
            {/* 核心修复：添加兜底占位图，防止 product.imageUrl 为空导致渲染警告 */}
            <Image
              src={product.imageUrl || DEFAULT_IMG}
              mode="widthFix"
              className="w-full block"
            />
          </View>

          <View className="bg-white mt-2 px-4 py-5 min-h-[300px] w-full box-border">
            <Text className="text-base font-bold text-zinc-900 mb-4 block">留言 ({comments.length})</Text>
            {comments.length === 0 ? (
              <Text className="text-sm text-zinc-400 text-center block mt-6">还没有人留言~</Text>
            ) : (
              comments.map((cmt) => (
                <View key={cmt._id} className="flex mb-5 w-full">
                  <Image src={cmt.userAvatar || getIcon('user', '#A1A1AA')} className="w-8 h-8 rounded-full bg-zinc-200 shrink-0 object-cover" />
                  <View className="ml-3 flex-1 border-b border-zinc-50 pb-4 overflow-hidden">
                    <View className="flex items-center mb-1">
                      <Text className="text-sm font-bold text-zinc-500">{cmt.userName}</Text>
                      {product.seller === cmt.userName && <Text className="text-[10px] text-blue-500 bg-blue-50 px-1 ml-2 rounded font-medium">卖家</Text>}
                    </View>
                    <Text className="text-base text-zinc-900 block leading-relaxed break-words">{cmt.content}</Text>
                    <Text className="text-xs text-zinc-400 block mt-2">{cmt.timeStr}</Text>
                  </View>
                </View>
              ))
            )}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-0 left-0 w-full bg-white border-t border-zinc-100 px-4 py-2 pb-6 flex items-center justify-between z-50 box-border">
        <View className="flex space-x-6 pl-1 shrink-0">
          <View className="flex flex-col items-center cursor-pointer" onClick={handleComment}>
            <Image src={getIcon('message-circle', '#3F3F46')} className="w-6 h-6 mb-1" />
            <Text className="text-[10px] text-zinc-600">留言</Text>
          </View>
          <View className="flex flex-col items-center cursor-pointer" onClick={handleFavorite}>
            <Image src={getIcon('star', isFavorited ? '#F59E0B' : '#3F3F46')} className="w-6 h-6 mb-1" />
            <Text className={`text-[10px] ${isFavorited ? 'text-yellow-500 font-bold' : 'text-zinc-600'}`}>收藏</Text>
          </View>
        </View>

        <View className="flex space-x-3 pr-1 shrink-0">
          {isSeller ? (
            <View className="px-6 py-2 rounded-full bg-zinc-100 text-zinc-800 font-bold text-sm cursor-pointer" onClick={handleManage}>管理宝贝</View>
          ) : (
            <>
              <View className="px-5 py-2.5 rounded-full bg-orange-100 text-orange-600 font-bold text-sm cursor-pointer" onClick={() => Taro.navigateTo({ url: `/pages/chat/detail?name=${encodeURIComponent(product.seller)}` })}>聊一聊</View>
              <View className="px-6 py-2.5 rounded-full bg-red-500 text-white font-bold text-sm shadow-md shadow-red-500/30 cursor-pointer" onClick={handleBuy}>马上买</View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
