import React, { useState } from 'react';
import { View, Text, Textarea, Button, Image, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function ForumPublish() {
  const [content, setContent] = useState('');
  const [imagePath, setImagePath] = useState('');
  const tags = ['日常分享', '求助问答', '二手避雷', '好物安利', '吐槽排雷'];
  const [tagIndex, setTagIndex] = useState(0);

  const handleUploadImage = async () => {
    try {
      const res = await Taro.chooseMedia({ count: 1, mediaType: ['image'] });
      setImagePath(res.tempFiles[0].tempFilePath);
    } catch (e) { console.log('取消选择') }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '写点内容吧~', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '发布中...', mask: true });
    try {
      const userInfo = Taro.getStorageSync('userInfo');
      let cloudImgUrl = '';
      
      // 上传图片
      if (imagePath) {
        const cloudPath = `forum/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
        const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: imagePath });
        cloudImgUrl = uploadRes.fileID;
      }

      // 写入数据库
      const db = Taro.cloud.database();
      const now = new Date();
      await db.collection('forum_posts').add({
        data: {
          author: userInfo.nickName,
          authorAvatar: userInfo.avatarUrl,
          content: content,
          imageUrl: cloudImgUrl,
          tag: tags[tagIndex],
          likes: 0,
          comments: 0,
          timeStr: `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes()}`,
          createTime: db.serverDate()
        }
      });

      Taro.hideLoading();
      Taro.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '发布失败，请重试', icon: 'error' });
    }
  };

  return (
    <View className="flex flex-col h-screen bg-white">
      <View className="flex-1 px-5 pt-4">
        <Textarea 
          placeholder="分享你的校园新鲜事、闲置心得或是避雷指南..." 
          className="w-full h-48 text-xl leading-relaxed" 
          placeholderStyle="color: #D4D4D8;"
          maxlength={800}
          onInput={(e) => setContent(e.detail.value)}
        />
        
        <View className="flex flex-wrap gap-4 mt-6">
          <View 
            className="w-32 h-32 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden active:bg-zinc-100"
            onClick={handleUploadImage}
          >
            {imagePath ? (
              <Image src={imagePath} className="w-full h-full object-cover" />
            ) : (
              <>
                <Image src={getIcon('camera', '#D4D4D8')} className="w-8 h-8 mb-2" />
                <Text className="text-sm text-zinc-400">添加图片</Text>
              </>
            )}
          </View>
        </View>

        <Picker mode="selector" range={tags} onChange={(e) => setTagIndex(Number(e.detail.value))}>
          <View className="mt-8 flex items-center bg-zinc-50 self-start px-4 py-2.5 rounded-full w-max cursor-pointer active:bg-zinc-100">
            <Text className="text-zinc-500 font-bold mr-2">话题标签：</Text>
            <Text className="text-blue-500 font-bold">{tags[tagIndex]}</Text>
            <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 ml-1" />
          </View>
        </Picker>
      </View>

      <View className="px-5 pt-4 pb-12 bg-white border-t border-zinc-50">
        <Button 
          className="w-full bg-blue-600 text-white rounded-full font-bold text-lg py-1.5 border-none active:opacity-90 shadow-lg shadow-blue-100"
          onClick={handleSubmit}
        >
          立即发布
        </Button>
      </View>
    </View>
  );
}
