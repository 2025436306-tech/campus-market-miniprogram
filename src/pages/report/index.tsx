import React, { useState } from 'react';
import { View, Text, ScrollView, Textarea, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function Report() {
  const router = useRouter();
  // 接收传过来的目标 ID 和类型 (例如 product, forum_post, user)
  const targetId = router.params.targetId || 'unknown';
  const targetType = router.params.type || 'general';

  const reasons = ['发布虚假/欺诈信息', '涉黄/涉暴/违禁品', '人身攻击/恶意骚扰', '疑似骗子/诱导站外交易', '其他问题'];
  const [activeReason, setActiveReason] = useState(reasons[0]);
  const [desc, setDesc] = useState('');
  const [imagePath, setImagePath] = useState('');

  const handleUploadImage = async () => {
    try {
      const res = await Taro.chooseMedia({ count: 1, mediaType: ['image'] });
      setImagePath(res.tempFiles[0].tempFilePath);
    } catch (e) {
      console.log('取消选择图片');
    }
  };

  const handleSubmit = async () => {
    if (!desc.trim() && activeReason === '其他问题') {
      Taro.showToast({ title: '请详细描述您遇到的问题', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...', mask: true });
    try {
      const userInfo = Taro.getStorageSync('userInfo') || { nickName: '匿名用户' };
      let cloudImgUrl = '';
      
      // 如果有图片，先上传到云存储
      if (imagePath) {
        const cloudPath = `reports/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
        const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: imagePath });
        cloudImgUrl = uploadRes.fileID;
      }

      // 将举报数据写入云数据库
      const db = Taro.cloud.database();
      await db.collection('reports').add({
        data: {
          reporter: userInfo.nickName,
          targetId: targetId,
          targetType: targetType,
          reason: activeReason,
          description: desc,
          proofImage: cloudImgUrl,
          status: 'pending', // 待处理状态
          createTime: db.serverDate()
        }
      });

      Taro.hideLoading();
      Taro.showToast({ title: '感谢您的反馈，我们将尽快核实', icon: 'none', duration: 2000 });
      setTimeout(() => {
        Taro.navigateBack();
      }, 2000);

    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '提交失败，请重试', icon: 'error' });
      console.error(error);
    }
  };

  return (
    <View className="flex flex-col h-screen bg-[#f4f4f5]">
      <ScrollView scrollY className="flex-1 p-5">
        
        <Text className="text-sm font-bold text-zinc-500 mb-3 block px-1">请选择举报原因</Text>
        <View className="bg-white rounded-2xl p-2 mb-6 shadow-sm">
          {reasons.map((reason, index) => (
            <View 
              key={reason} 
              className={`flex items-center justify-between p-4 ${index !== reasons.length - 1 ? 'border-b border-zinc-50' : ''}`}
              onClick={() => setActiveReason(reason)}
            >
              <Text className={`text-base ${activeReason === reason ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>{reason}</Text>
              {activeReason === reason && <Image src={getIcon('check-circle-2', '#2563EB')} className="w-5 h-5" />}
            </View>
          ))}
        </View>

        <Text className="text-sm font-bold text-zinc-500 mb-3 block px-1">详细描述与截图证据</Text>
        <View className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
          <Textarea 
            className="w-full h-32 text-base leading-relaxed text-zinc-800"
            placeholder="请详细描述违规行为，我们将为您严格保密..."
            placeholderTextColor="#A1A1AA"
            maxlength={500}
            onInput={(e) => setDesc(e.detail.value)}
          />
          
          <View className="mt-4 pt-4 border-t border-zinc-50">
            <View 
              className="w-24 h-24 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden active:bg-zinc-100"
              onClick={handleUploadImage}
            >
              {imagePath ? (
                <Image src={imagePath} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Image src={getIcon('image-plus', '#A1A1AA')} className="w-8 h-8 mb-1" />
                  <Text className="text-[10px] text-zinc-400">上传截图</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View className="flex items-start px-2 mb-8">
          <Image src={getIcon('info', '#A1A1AA')} className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          <Text className="text-xs text-zinc-400 leading-relaxed">
            恶意举报他人将面临封号风险。平台会在 24 小时内处理您的举报，如情况属实将对违规账号进行处罚。
          </Text>
        </View>
      </ScrollView>

      {/* 底部提交按钮 */}
      <View className="bg-white p-4 pb-8 border-t border-zinc-100 shrink-0 z-50">
        <Button 
          className="w-full bg-blue-600 text-white rounded-full font-bold py-1 border-none shadow-lg shadow-blue-500/30 active:opacity-90"
          onClick={handleSubmit}
        >
          提交举报
        </Button>
      </View>
    </View>
  );
}
