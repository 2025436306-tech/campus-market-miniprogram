import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function NoticeList() {
  const router = useRouter();
  // 解析传递过来的中文标题
  const pageTitle = decodeURIComponent(router.params.title || '') || '通知';
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: pageTitle });
    fetchNotices();
  }, [pageTitle]);

  // 兜底的静态显示数据
  const getFallbackData = (title: string) => {
    if (title === '互动消息') {
      return [
        { id: 1, title: '数学系小透明 赞了你的动态', content: '“今天天气真不错，适合去操场走走~”', time: '10分钟前', icon: 'heart', color: '#EF4444', bg: 'bg-red-50' },
        { id: 2, title: '张三 评论了你的宝贝', content: '“请问这本书包邮吗？”', time: '2小时前', icon: 'message-circle', color: '#3B82F6', bg: 'bg-blue-50' }
      ];
    } else if (title === '交易物流') {
      return [
        { id: 3, title: '宝贝已发货', content: '您购买的【AirPods Pro 二代】卖家已发货，请注意查收。', time: '昨天 15:30', icon: 'truck', color: '#F97316', bg: 'bg-orange-50' },
        { id: 4, title: '交易成功', content: '买家已确认收货，货款已打入您的微信零钱。', time: '周一 09:12', icon: 'check-circle', color: '#22C55E', bg: 'bg-green-50' }
      ];
    } else {
      return [
        { id: 5, title: '实名认证成功', content: '恭喜您已通过学籍核验，解锁平台全部功能！', time: '刚刚', icon: 'shield-check', color: '#3F3F46', bg: 'bg-zinc-200' },
        { id: 6, title: '系统维护公告', content: '平台将于今晚凌晨 2:00 进行服务器升级，期间可能无法访问。', time: '1周前', icon: 'info', color: '#3F3F46', bg: 'bg-zinc-200' }
      ];
    }
  };

  // 根据类型配置默认的 UI 颜色和图标
  const getDefaultStyle = (title: string) => {
    if (title === '互动消息') return { icon: 'message-circle', color: '#3B82F6', bg: 'bg-blue-50' };
    if (title === '交易物流') return { icon: 'truck', color: '#F97316', bg: 'bg-orange-50' };
    return { icon: 'bell', color: '#3F3F46', bg: 'bg-zinc-200' };
  };

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const db = Taro.cloud.database();
      // 在数据库中查找 category (分类) 匹配该页面的数据
      const res = await db.collection('notices').where({ category: pageTitle }).orderBy('createTime', 'desc').get();
      
      if (res.data.length > 0) {
        // 如果云端有数据，进行映射格式化
        const formattedData = res.data.map((item: any) => ({
          id: item._id,
          title: item.title,
          content: item.content,
          time: item.timeStr || '刚刚',
          icon: item.icon || getDefaultStyle(pageTitle).icon,
          color: item.color || getDefaultStyle(pageTitle).color,
          bg: item.bg || getDefaultStyle(pageTitle).bg
        }));
        setNotices(formattedData);
      } else {
        // 云端没数据，使用兜底数据展示效果
        setNotices(getFallbackData(pageTitle));
      }
    } catch (e) {
      console.log('拉取通知失败或未建表，使用默认数据', e);
      setNotices(getFallbackData(pageTitle));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      <ScrollView scrollY className="flex-1 p-4">
        {isLoading ? (
           <View className="flex justify-center pt-32"><Text className="text-zinc-400">加载中...</Text></View>
        ) : notices.length === 0 ? (
          <View className="flex flex-col items-center justify-center pt-32">
            <Text className="text-zinc-400 text-lg">暂无相关通知</Text>
          </View>
        ) : (
          notices.map(notice => (
            <View key={notice.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm flex active:bg-zinc-50 transition-colors">
              <View className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${notice.bg}`}>
                <Image src={getIcon(notice.icon, notice.color)} className="w-7 h-7" />
              </View>
              <View className="ml-4 flex-1">
                <View className="flex justify-between items-start mb-1">
                  <Text className="text-lg font-bold text-zinc-900 line-clamp-1 flex-1 mr-2">{notice.title}</Text>
                  <Text className="text-xs text-zinc-400 shrink-0 mt-1">{notice.time}</Text>
                </View>
                <Text className="text-base text-zinc-500 leading-relaxed mt-1 block">
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
