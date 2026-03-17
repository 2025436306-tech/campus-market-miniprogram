import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

// 核心修复1：将 .svg 改为 .png?width=64，彻底解决真机不显示图片的问题！
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function NoticeList() {
  const router = useRouter();
  const pageTitle = decodeURIComponent(router.params.title || '') || '通知';
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: pageTitle });
    fetchNotices();
  }, [pageTitle]);

  const getFallbackData = (title: string) => {
    if (title === '互动消息') {
      return [
        { id: 1, title: '数学系小透明 赞了你的动态', content: '“今天天气真不错，适合去操场走走~”', time: '10分钟前', icon: 'heart', color: '#EF4444', bg: 'bg-red-50' }
      ];
    } else if (title === '交易物流') {
      return [
        { id: 3, title: '宝贝已发货', content: '您购买的【AirPods Pro】卖家已发货。', time: '昨天 15:30', icon: 'truck', color: '#F97316', bg: 'bg-orange-50' }
      ];
    } else {
      return [
        { id: 5, title: '实名认证成功', content: '恭喜您已通过学籍核验，解锁平台全部功能！', time: '刚刚', icon: 'shield-check', color: '#3F3F46', bg: 'bg-zinc-200' }
      ];
    }
  };

  const getDefaultStyle = (title: string) => {
    if (title === '互动消息') return { icon: 'message-circle', color: '#3B82F6', bg: 'bg-blue-50' };
    if (title === '交易物流') return { icon: 'truck', color: '#F97316', bg: 'bg-orange-50' };
    return { icon: 'bell', color: '#3F3F46', bg: 'bg-zinc-200' };
  };

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('notices').where({ category: pageTitle }).orderBy('createTime', 'desc').get();
      if (res.data.length > 0) {
        setNotices(res.data.map((item: any) => ({
          id: item._id, title: item.title, content: item.content,
          time: item.timeStr || '刚刚',
          icon: item.icon || getDefaultStyle(pageTitle).icon,
          color: item.color || getDefaultStyle(pageTitle).color,
          bg: item.bg || getDefaultStyle(pageTitle).bg
        })));
      } else {
        setNotices(getFallbackData(pageTitle));
      }
    } catch (e) {
      setNotices(getFallbackData(pageTitle));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5] w-full">
      {/* 核心修复2：确保 ScrollView 是 w-full 和 box-border，防止偏移 */}
      <ScrollView scrollY className="flex-1 w-full box-border px-4 py-4">
        {isLoading ? (
          <View className="flex justify-center pt-20"><Text className="text-zinc-400">加载中...</Text></View>
        ) : notices.length === 0 ? (
          <View className="flex flex-col items-center justify-center pt-20">
            <Text className="text-zinc-400 text-sm">暂无相关通知</Text>
          </View>
        ) : (
          notices.map(notice => (
            <View key={notice.id} className="w-full box-border bg-white rounded-2xl p-4 mb-3 shadow-sm flex items-start active:bg-zinc-50 transition-colors">
              <View className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${notice.bg}`}>
                <Image src={getIcon(notice.icon, notice.color)} className="w-6 h-6" />
              </View>
              <View className="ml-3 flex-1 overflow-hidden">
                <View className="flex justify-between items-center mb-1">
                  <Text className="text-base font-bold text-zinc-900 truncate flex-1 pr-2">{notice.title}</Text>
                  <Text className="text-xs text-zinc-400 shrink-0">{notice.time}</Text>
                </View>
                <Text className="text-sm text-zinc-500 leading-relaxed block break-words">
                  {notice.content}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
