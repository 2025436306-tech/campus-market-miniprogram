import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Image, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';

// 强制纯 PNG 图标，彻底解决真机不显示问题
const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = { 'user': 'user', 'camera': 'camera', 'check-circle': 'security-checked', 'chevron-right': 'chevron-right' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

export default function Settings() {
  const [nickName, setNickName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [campus, setCampus] = useState('');
  const [qq, setQq] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const campuses = ['南京大学', '东南大学', '南京航空航天大学', '南京理工大学', '南京邮电大学'];
  const [campusIndex, setCampusIndex] = useState(0);

  useEffect(() => {
    // 初始化数据
    let currentUserInfo = Taro.getStorageSync('userInfo');
    if (!currentUserInfo || !currentUserInfo.nickName) {
      // 模拟一个默认数据
      currentUserInfo = {
        nickName: '拾集小透明', avatarUrl: '', campus: '南京理工大学', isAuth: false, qq: '123456789'
      };
      Taro.setStorageSync('userInfo', currentUserInfo);
    }

    setNickName(currentUserInfo.nickName);
    setAvatarUrl(currentUserInfo.avatarUrl || '');
    setIsAuth(currentUserInfo.isAuth || false);
    setQq(currentUserInfo.qq || '');

    if (currentUserInfo.campus) {
      const condIdx = campuses.indexOf(currentUserInfo.campus);
      if (condIdx !== -1) setCampusIndex(condIdx);
      else setCampusIndex(2); // 默认南理工
    } else {
      setCampusIndex(2);
    }
  }, []);

  const handleUploadImage = async () => {
    try {
      const res = await Taro.chooseMedia({ count: 1, mediaType: ['image'] });
      setAvatarUrl(res.tempFiles[0].tempFilePath);
    } catch (e) { }
  };

  const handleSubmit = async () => {
    if (!nickName.trim()) return Taro.showToast({ title: '昵称不能为空', icon: 'none' });
    if (!qq.trim() && isAuth) return Taro.showToast({ title: '认证用户请填写QQ以方便联系', icon: 'none' });

    Taro.showLoading({ title: '修改中...', mask: true });

    try {
      let cloudImgUrl = avatarUrl;
      // 模拟本地上传并转换为永久网络链接
      if (!avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('http')) {
        const cloudPath = `avatars/${Date.now()}.png`;
        const uploadRes = await Taro.cloud.uploadFile({ cloudPath, filePath: avatarUrl });
        try {
          const urlRes = await Taro.cloud.getTempFileURL({ fileList: [uploadRes.fileID] });
          if (urlRes.fileList && urlRes.fileList.length > 0 && urlRes.fileList[0].tempFileURL) {
            cloudImgUrl = urlRes.fileList[0].tempFileURL;
          } else { cloudImgUrl = uploadRes.fileID; }
        } catch (e) { cloudImgUrl = uploadRes.fileID; }
      }

      const currentUserInfo = Taro.getStorageSync('userInfo') || {};
      const updatedUserInfo = { ...currentUserInfo, nickName, avatarUrl: cloudImgUrl, qq, campus: campuses[campusIndex] };
      Taro.setStorageSync('userInfo', updatedUserInfo);
      Taro.setStorageSync('isLoggedIn', true); // 确保已登录

      Taro.hideLoading();
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: '保存失败，请重试', icon: 'error' });
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录', content: '确定要退出当前账号吗？', confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.setStorageSync('isLoggedIn', false);
          Taro.showToast({ title: '已退出' });
          setTimeout(() => Taro.navigateBack(), 1500);
        }
      }
    });
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50 w-full box-border overflow-hidden">
      <ScrollView scrollY className="flex-1 hide-scrollbar w-full box-border pt-4 pb-20 px-4">
        <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm flex flex-col items-center justify-center w-full box-border" onClick={handleUploadImage}>
          <View className="relative">
            <View className="w-24 h-24 bg-zinc-50 rounded-full border border-zinc-200 shadow-inner flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // 核心修复：在此 Image 上添加 mode="aspectFill"，强制不拉伸填满
                <Image src={avatarUrl} mode="aspectFill" className="w-full h-full object-cover" />
              ) : (
                <Image src={getIcon('user', '#A1A1AA')} className="w-10 h-10 object-cover" />
              )}
            </View>
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow">
              <Image src={getIcon('camera', '#FFFFFF')} className="w-5 h-5" />
            </View>
          </View>
          <Text className="text-base text-blue-600 font-bold mt-4">更换头像</Text>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm w-full box-border">
          <View className="border-b border-zinc-50 py-3 flex items-center justify-between">
            <Text className="text-base font-medium text-zinc-500 mr-4">昵称</Text>
            <Input value={nickName} placeholder="给自己起个名字吧" className="flex-1 text-right text-base text-zinc-800" onInput={(e) => setNickName(e.detail.value)} />
          </View>

          <Picker mode="selector" range={campuses} value={campusIndex} onChange={(e) => setCampusIndex(Number(e.detail.value))}>
            <View className="border-b border-zinc-50 py-3 flex items-center justify-between">
              <Text className="text-base font-medium text-zinc-500 mr-4">校园</Text>
              <View className="flex items-center">
                <Text className="text-base text-zinc-800">{campuses[campusIndex]}</Text>
                <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-4 h-4 ml-1" />
              </View>
            </View>
          </Picker>

          <View className="py-3 flex items-center justify-between border-b border-zinc-50">
            <Text className="text-base font-medium text-zinc-500 mr-4">联系QQ</Text>
            <Input value={qq} placeholder="方便交易联系" type="number" className="flex-1 text-right text-base text-zinc-800" onInput={(e) => setQq(e.detail.value)} />
          </View>

          <View className="pt-3 flex items-center justify-between">
            <Text className="text-base font-medium text-zinc-500 mr-4">校园身份</Text>
            {isAuth ? (
              <View className="flex items-center text-green-500">
                <Image src={getIcon('check-circle', '#22C55E')} className="w-4 h-4 mr-1.5" />
                <Text className="text-base font-bold">已通过认证</Text>
              </View>
            ) : (
              <View className="flex items-center cursor-pointer" onClick={() => Taro.navigateTo({ url: '/pages/auth/index' })}>
                <Text className="text-base text-zinc-400">去认证</Text>
                <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-4 h-4 ml-1" />
              </View>
            )}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-10 shadow-sm w-full box-border cursor-pointer active:bg-zinc-100" onClick={handleLogout}>
          <Text className="w-full text-center text-red-500 text-lg font-bold">退出登录</Text>
        </View>
      </ScrollView>

      <View className="px-5 py-4 pb-8 bg-white border-t border-zinc-100 w-full box-border shrink-0 z-50">
        <Button className="w-full bg-blue-600 text-white rounded-full font-bold py-1 border-none active:opacity-90 shadow-lg shadow-blue-100" onClick={handleSubmit}>
          保存修改
        </Button>
      </View>
    </View>
  );
}
