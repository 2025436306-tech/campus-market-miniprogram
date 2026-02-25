import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

const fallbackChats = [
  { _id: '1', name: '李四 (卖家)', avatar: 'bg-green-500', msg: '那本书还在的，你什么时候方便过来拿？', time: '10:42', unread: 2, isSystem: false },
  { _id: '2', name: '考研学长', avatar: 'bg-indigo-500', msg: '笔记我已经拍下来发你了，注意查收。', time: '昨天', unread: 0, isSystem: false },
  { _id: '3', name: '二手平台官方助手', avatar: 'bg-zinc-800', msg: '您的宝贝「AirPods Pro」被 5 位同学收藏啦，快去看看！', time: '周二', unread: 0, isSystem: true }
];

export default function Messages({ refreshTrigger = 0, onUnreadUpdate }: { refreshTrigger?: number, onUnreadUpdate?: (count: number) => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [topNoticesUnread, setTopNoticesUnread] = useState({
    '互动消息': 0, '交易物流': 0, '系统通知': 0
  });

  const [swipedId, setSwipedId] = useState('');
  let startX = 0;
  let startY = 0;

  useEffect(() => {
    let initialMockChats = Taro.getStorageSync('mock_chats');
    if (!initialMockChats || initialMockChats.length === 0) {
      Taro.setStorageSync('mock_chats', fallbackChats);
    }
    
    let sysUnread = Taro.getStorageSync('unread_系统通知');
    if (sysUnread === '') sysUnread = 1; 
    setTopNoticesUnread({
      '互动消息': Taro.getStorageSync('unread_互动消息') || 0,
      '交易物流': Taro.getStorageSync('unread_交易物流') || 0,
      '系统通知': sysUnread
    });

    fetchMessages();
  }, [refreshTrigger]);

  const fetchMessages = async () => {
    setIsLoading(true);
    const isLoggedIn = Taro.getStorageSync('isLoggedIn');
    if (!isLoggedIn) {
      setChats([]); setIsLoading(false); setIsRefreshing(false);
      if (onUnreadUpdate) onUnreadUpdate(0); return;
    }

    try {
      const db = Taro.cloud.database();
      const res = await db.collection('message_sessions').orderBy('updateTime', 'desc').get();
      const localChats = Taro.getStorageSync('mock_chats') || fallbackChats;
      
      let loadedChats = res.data.length === 0 ? localChats : res.data.map((dbChat: any) => {
        const localMatch = localChats.find((lc: any) => lc._id === dbChat._id);
        return (localMatch && localMatch.unread === 0) ? { ...dbChat, unread: 0 } : dbChat;
      });
      
      setChats(loadedChats);
      if (onUnreadUpdate) onUnreadUpdate(loadedChats.reduce((sum: number, c: any) => sum + (c.unread || 0), 0));
    } catch (error) {
      const loadedChats = Taro.getStorageSync('mock_chats') || fallbackChats;
      setChats(loadedChats);
      if (onUnreadUpdate) onUnreadUpdate(loadedChats.reduce((sum: number, c: any) => sum + (c.unread || 0), 0));
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); fetchMessages(); };
  const handleTouchStart = (e: any) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
  const handleTouchEnd = (e: any, id: string) => {
    const endX = e.changedTouches[0].clientX; const endY = e.changedTouches[0].clientY;
    if (startX - endX > 40 && Math.abs(startY - endY) < 40) setSwipedId(id); 
    else if (endX - startX > 40 && Math.abs(startY - endY) < 40) if (swipedId === id) setSwipedId(''); 
  };

  const handleChatClick = async (chat: any) => {
    if (swipedId !== '') { setSwipedId(''); return; }
    clearUnread(chat);
    if (chat.isSystem) {
        Taro.navigateTo({ url: '/pages/notice/index?title=系统通知' });
        return;
    }
    Taro.navigateTo({ url: `/pages/chat/detail?id=${chat._id}&name=${encodeURIComponent(chat.name)}` });
  };

  const clearUnread = async (chat: any) => {
    if (chat.unread > 0) {
      const updatedChats = chats.map(c => c._id === chat._id ? { ...c, unread: 0 } : c);
      setChats(updatedChats);
      Taro.setStorageSync('mock_chats', updatedChats);
      if (onUnreadUpdate) onUnreadUpdate(updatedChats.reduce((sum, c) => sum + (c.unread || 0), 0));
      try { await Taro.cloud.database().collection('message_sessions').doc(chat._id).update({ data: { unread: 0 } }); } catch (e) {}
    }
  };

  const handleDelete = (chatId: string) => {
    Taro.showModal({
      title: '删除会话',
      content: '确定要删除这条聊天记录吗？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            try { await Taro.cloud.database().collection('message_sessions').doc(chatId).remove(); } catch (e) {} 
            const newChats = chats.filter(c => c._id !== chatId);
            setChats(newChats); Taro.setStorageSync('mock_chats', newChats);
            if (onUnreadUpdate) onUnreadUpdate(newChats.reduce((sum, c) => sum + (c.unread || 0), 0));
            Taro.showToast({ title: '已删除', icon: 'success' });
          } catch (e) { Taro.showToast({ title: '删除失败', icon: 'none' }); }
        }
        setSwipedId('');
      }
    });
  };

  const handleNoticeClick = (title: string) => {
    const newUnread = { ...topNoticesUnread, [title]: 0 };
    setTopNoticesUnread(newUnread);
    Taro.setStorageSync(`unread_${title}`, 0);
    Taro.navigateTo({ url: `/pages/notice/index?title=${encodeURIComponent(title)}` });
  };

  return (
    <View className="flex flex-col h-full bg-zinc-50 relative pb-32">
      <View className="bg-white px-6 pt-4 pb-4 sticky top-0 bg-white/95 z-20 flex justify-between items-center border-b border-zinc-100/50 shrink-0">
        <Text className="text-4xl font-bold text-zinc-900 tracking-tight">消息</Text>
        <Image src={getIcon('settings', '#3F3F46')} className="w-8 h-8 cursor-pointer" />
      </View>

      <View className="flex-1 relative">
        <ScrollView scrollY className="absolute inset-0 hide-scrollbar" refresherEnabled={true} refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          
          {/* 顶部分类放大 */}
          <View className="flex justify-around py-8 mb-2 bg-white border-b border-zinc-100/50 px-2">
            <View className="flex flex-col items-center relative cursor-pointer active:opacity-60" onClick={() => handleNoticeClick('互动消息')}>
              {topNoticesUnread['互动消息'] > 0 && <View className="absolute top-0 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10"></View>}
              <View className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Image src={getIcon('message-circle', '#3B82F6')} className="w-8 h-8" />
              </View>
              <Text className="text-base font-medium text-zinc-600">互动消息</Text>
            </View>

            <View className="flex flex-col items-center relative cursor-pointer active:opacity-60" onClick={() => handleNoticeClick('交易物流')}>
              {topNoticesUnread['交易物流'] > 0 && <View className="absolute top-0 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10"></View>}
              <View className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Image src={getIcon('file-text', '#F97316')} className="w-8 h-8" />
              </View>
              <Text className="text-base font-medium text-zinc-600">交易物流</Text>
            </View>

            <View className="flex flex-col items-center relative cursor-pointer active:opacity-60" onClick={() => handleNoticeClick('系统通知')}>
              {topNoticesUnread['系统通知'] > 0 && <View className="absolute top-0 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10"></View>}
              <View className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Image src={getIcon('bell', '#3F3F46')} className="w-8 h-8" />
              </View>
              <Text className="text-base font-medium text-zinc-600">系统通知</Text>
            </View>
          </View>

          <View className="bg-white min-h-[500px]">
            {isLoading && !isRefreshing ? (
               <View className="flex justify-center py-12"><Text className="text-zinc-400 text-lg">加载中...</Text></View>
            ) : chats.length === 0 ? (
               <View className="flex flex-col items-center justify-center py-24">
                 <Text className="text-zinc-400 text-lg mb-6">暂无消息记录</Text>
                 <View className="bg-blue-600 px-8 py-3 rounded-full active:opacity-80 cursor-pointer" onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
                   <Text className="text-white text-lg font-bold">去登录</Text>
                 </View>
               </View>
            ) : (
              chats.map(chat => (
                <View key={chat._id} className="relative w-full overflow-hidden border-b border-zinc-50 bg-red-500">
                  <View className="absolute right-0 top-0 h-full w-[80px] bg-red-500 flex items-center justify-center cursor-pointer active:bg-red-600" onClick={() => handleDelete(chat._id)}>
                    <Text className="text-white text-lg font-bold">删除</Text>
                  </View>
                  <View className="flex items-center px-6 py-5 bg-white w-full transition-transform duration-300 relative z-10" style={{ transform: swipedId === chat._id ? 'translateX(-80px)' : 'translateX(0)' }} onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, chat._id)} onClick={() => handleChatClick(chat)}>
                    <View className="relative">
                      {/* 头像从 12 放大到 16 */}
                      <View className={`w-16 h-16 rounded-full ${chat.avatar || 'bg-zinc-300'} flex items-center justify-center text-white shadow-inner`}>
                        <Image src={getIcon(chat.isSystem ? 'shield-check' : 'user', '#FFFFFF')} className="w-8 h-8" />
                      </View>
                      {chat.unread > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full border-2 border-white">
                          <Text className="text-white text-xs font-bold">{chat.unread}</Text>
                        </View>
                      )}
                    </View>
                    <View className="ml-5 flex-1 overflow-hidden pointer-events-none">
                      <View className="flex justify-between items-center mb-2">
                        {/* 名字从 15px 放大到 xl */}
                        <Text className="text-xl font-bold text-zinc-900 truncate">{chat.name}</Text>
                        {/* 时间从 11px 放大到 sm */}
                        <Text className="text-sm text-zinc-400 flex-shrink-0">{chat.time}</Text>
                      </View>
                      {/* 消息预览从 13px 放大到 lg */}
                      <Text className="text-lg text-zinc-500 truncate block">{chat.msg}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View className="h-10"></View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
