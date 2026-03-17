import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

// 强制纯 PNG 图标，防安卓丢失
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = {
    'user': 'user', 'trash-2': 'trash', 'share-2': 'forward', 'message-circle': 'speech-bubble', 'heart': 'like'
  };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

export default function Forum({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState('全部动态');
  const tabs = ['全部动态', '求助问答', '二手避雷'];

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo) setCurrentUser(userInfo);
    const storedLikes = Taro.getStorageSync('liked_forum_posts') || [];
    setLikedPosts(storedLikes);
    fetchPosts();
  }, [refreshTrigger]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('forum_posts').orderBy('createTime', 'desc').get();
      setPosts(res.data);
    } catch (error) {
      console.log('云数据库拉取失败', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchPosts(); };

  const handlePublish = () => {
    if (!currentUser) { Taro.navigateTo({ url: '/pages/login/index' }); return; }
    Taro.navigateTo({ url: '/pages/forum/publish' });
  };

  const handleLike = async (e: any, postId: string, currentLikes: number) => {
    e.stopPropagation();
    if (!currentUser) return Taro.showToast({ title: '请先登录', icon: 'none' });
    const isLiked = likedPosts.includes(postId);
    const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
    const newLikedPosts = isLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(newLikedPosts);
    Taro.setStorageSync('liked_forum_posts', newLikedPosts);
    setPosts(posts.map(p => p._id === postId ? { ...p, likes: newLikes } : p));
    try { await Taro.cloud.database().collection('forum_posts').doc(postId).update({ data: { likes: newLikes } }); } catch (err) { }
  };

  const handleDelete = (e: any, postId: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '删除动态', content: '确定要删除这条动态吗？', confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '删除中...' });
          try {
            await Taro.cloud.database().collection('forum_posts').doc(postId).remove();
            setPosts(posts.filter(p => p._id !== postId));
            Taro.hideLoading(); Taro.showToast({ title: '已删除', icon: 'success' });
          } catch (error) { Taro.hideLoading(); }
        }
      }
    });
  };

  const filteredPosts = activeTab === '全部动态' ? posts : posts.filter(post => post.tag === activeTab);

  return (
    // 核心修复1：去除外层 pb-32，加入 w-full box-border 限制宽度
    <View className="flex flex-col h-full bg-zinc-50 relative w-full box-border">

      <View className="bg-white px-5 pt-2 pb-0 sticky top-0 z-20 shadow-sm border-b border-zinc-100 shrink-0 w-full box-border">
        <Text className="text-4xl font-bold text-zinc-900 tracking-tight mb-6 block">校园圈</Text>
        <View className="flex space-x-8 px-2">
          {tabs.map(tab => (
            <View key={tab} onClick={() => setActiveTab(tab)}
              className={`text-xl pb-3 cursor-pointer transition-colors ${activeTab === tab ? 'font-bold text-blue-600 border-b-4 border-blue-600' : 'font-medium text-zinc-500'}`}
            >
              <Text>{tab}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="flex-1 relative w-full box-border">
        <ScrollView scrollY className="absolute inset-0 hide-scrollbar w-full box-border" refresherEnabled={true} refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>

          {/* 核心修复2：把 pb-32 放到这层包裹器里，强行把底部的空白挤出来，完美突破底部导航栏的遮挡！ */}
          <View className="px-5 pt-5 pb-32 w-full box-border">

            <View className="bg-white rounded-3xl p-5 flex items-center shadow-sm border border-zinc-100/50 mb-6 cursor-pointer active:bg-zinc-50 w-full box-border" onClick={handlePublish}>
              <View className="w-12 h-12 rounded-full bg-zinc-100 mr-4 flex items-center justify-center overflow-hidden shrink-0">
                <Image src={currentUser ? currentUser.avatarUrl : getIcon('user', '#A1A1AA')} className="w-full h-full object-cover" />
              </View>
              <View className="flex-1"><Text className="text-lg text-zinc-400 font-medium">此刻想和大家分享什么...</Text></View>
              <View className="bg-blue-600 px-6 py-2.5 rounded-full shrink-0"><Text className="text-white text-base font-bold">发帖</Text></View>
            </View>

            {isLoading && !isRefreshing ? (
              <View className="flex justify-center py-12"><Text className="text-zinc-400 text-lg">动态加载中...</Text></View>
            ) : filteredPosts.length === 0 ? (
              <View className="flex justify-center py-12"><Text className="text-zinc-400 text-lg">暂无相关动态，快来发一帖吧！</Text></View>
            ) : (
              filteredPosts.map(post => (
                <View key={post._id} className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100/80 mb-5 cursor-pointer active:scale-[0.98] transition-transform w-full box-border"
                  onClick={() => Taro.navigateTo({ url: `/pages/forum/detail?id=${post._id}` })}
                >
                  <View className="flex justify-between items-start mb-4">
                    <View className="flex items-center overflow-hidden flex-1 pr-2">
                      <View className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-zinc-100 shrink-0">
                        <Image src={post.authorAvatar || getIcon('user', '#2563EB')} className="w-full h-full object-cover" />
                      </View>
                      <View className="ml-4 flex-1 overflow-hidden">
                        <View className="flex items-center mb-1">
                          <Text className="text-lg font-bold text-zinc-800 truncate">{post.author}</Text>
                          <View className="ml-3 px-2 py-0.5 bg-zinc-100 rounded border border-zinc-200 shrink-0"><Text className="text-zinc-500 text-[11px] font-medium">{post.tag}</Text></View>
                        </View>
                        <Text className="text-sm text-zinc-400 block">{post.timeStr || '刚刚'}</Text>
                      </View>
                    </View>
                    {currentUser && currentUser.nickName === post.author && (
                      <View className="p-2 shrink-0" onClick={(e) => handleDelete(e, post._id)}>
                        <Image src={getIcon('trash-2', '#EF4444')} className="w-5 h-5 opacity-70" />
                      </View>
                    )}
                  </View>

                  <Text className="text-xl text-zinc-700 leading-relaxed mb-4 block break-words">{post.content}</Text>

                  {post.imageUrl && (
                    <View className="w-full max-h-64 bg-zinc-100 rounded-2xl mb-4 flex items-center justify-center border border-zinc-200/50 overflow-hidden">
                      <Image src={post.imageUrl} mode="aspectFill" className="w-full h-full object-cover" />
                    </View>
                  )}

                  <View className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-50">
                    <View className="flex items-center text-zinc-400 text-base font-medium active:opacity-60" onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '点击右上角「···」分享', icon: 'none' }); }}>
                      <Image src={getIcon('share-2', '#A1A1AA')} className="w-6 h-6 mr-2" />
                      <Text>分享</Text>
                    </View>
                    <View className="flex items-center space-x-8">
                      <View className="flex items-center text-zinc-500 text-base font-medium">
                        <Image src={getIcon('message-circle', '#71717A')} className="w-6 h-6 mr-2" />
                        <Text>{post.comments || 0}</Text>
                      </View>
                      <View className="flex items-center text-zinc-500 text-base font-medium cursor-pointer active:scale-110 transition-transform" onClick={(e) => handleLike(e, post._id, post.likes || 0)}>
                        <Image src={getIcon('heart', likedPosts.includes(post._id) ? '#EF4444' : '#71717A')} className="w-6 h-6 mr-2 transition-colors" />
                        <Text className={likedPosts.includes(post._id) ? 'text-red-500' : ''}>{post.likes || 0}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
