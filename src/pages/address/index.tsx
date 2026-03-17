import React, { useState } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hexColor = color.replace('#', '%23');
  return `https://api.iconify.design/lucide/${name}.svg?color=${hexColor}&stroke-width=2`;
};

export default function AddressList() {
  const [addresses, setAddresses] = useState<any[]>([]);

  // 每次进入页面时刷新地址列表
  useDidShow(() => {
    fetchAddresses();
  });

  // 从云数据库拉取地址
  const fetchAddresses = async () => {
    Taro.showLoading({ title: '加载中' });
    try {
      const userInfo = Taro.getStorageSync('userInfo');
      const db = Taro.cloud.database();
      // 在 addresses 表中查询当前用户的地址
      const res = await db.collection('addresses').where({ userName: userInfo.nickName }).get();
      setAddresses(res.data);
    } catch (e) {
      console.log('拉取地址失败', e);
    } finally {
      Taro.hideLoading();
    }
  };

  // 核心：调用微信原生接口，然后存入我们的云数据库
  const handleImportWechat = async () => {
    try {
      // 1. 拉起微信原生地址选择（自带完善的编辑/新增功能）
      const res = await Taro.chooseAddress();
      const userInfo = Taro.getStorageSync('userInfo');
      const db = Taro.cloud.database();

      Taro.showLoading({ title: '正在同步到云端...' });

      // 2. 将选中的地址写入云数据库 addresses 表
      await db.collection('addresses').add({
        data: {
          userName: userInfo.nickName,
          name: res.userName,
          phone: res.telNumber,
          province: res.provinceName,
          city: res.cityName,
          county: res.countyName,
          detail: res.detailInfo,
          fullAddress: `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`,
          createTime: db.serverDate()
        }
      });

      Taro.hideLoading();
      Taro.showToast({ title: '地址添加成功', icon: 'success' });
      fetchAddresses(); // 刷新列表
    } catch (e) {
      // 用户取消了选择，不需要报错
      Taro.hideLoading();
    }
  };

  // 从云数据库删除地址
  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '删除地址',
      content: '确定要删除这条收货地址吗？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '删除中' });
          try {
            const db = Taro.cloud.database();
            await db.collection('addresses').doc(id).remove();
            Taro.hideLoading();
            Taro.showToast({ title: '已删除', icon: 'success' });
            fetchAddresses();
          } catch (e) {
            Taro.hideLoading();
            Taro.showToast({ title: '删除失败', icon: 'error' });
          }
        }
      }
    });
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50">
      <ScrollView scrollY className="flex-1 p-4 pb-24">
        {addresses.length === 0 ? (
          <View className="flex flex-col items-center justify-center pt-32">
            <Image src={getIcon('map', '#D4D4D8')} className="w-16 h-16 mb-4 opacity-50" />
            <Text className="text-zinc-400 text-lg">暂无收货地址</Text>
            <Text className="text-zinc-400 text-sm mt-2">点击下方按钮快速导入微信地址</Text>
          </View>
        ) : (
          addresses.map(addr => (
            <View key={addr._id} className="bg-white p-5 rounded-2xl mb-4 shadow-sm flex justify-between items-center active:scale-[0.98] transition-transform">
              <View className="flex-1 pr-4">
                <View className="flex items-end mb-2">
                  <Text className="font-bold text-xl text-zinc-900 leading-none">{addr.name}</Text>
                  <Text className="text-zinc-500 text-base font-normal ml-3 leading-none">{addr.phone}</Text>
                </View>
                <Text className="text-sm text-zinc-500 leading-relaxed block pr-2">{addr.fullAddress}</Text>
              </View>

              <View
                className="pl-5 py-2 border-l border-zinc-100 flex flex-col items-center justify-center shrink-0 cursor-pointer active:opacity-50"
                onClick={() => handleDelete(addr._id)}
              >
                <Image src={getIcon('trash-2', '#EF4444')} className="w-6 h-6 mb-1" />
                <Text className="text-xs text-red-500 font-medium">删除</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部悬浮添加按钮 */}
      <View className="fixed bottom-0 left-0 w-full p-4 pb-8 bg-white border-t border-zinc-100 z-50">
        <View
          className="w-full bg-blue-600 text-white rounded-full font-bold text-lg py-3.5 flex items-center justify-center shadow-lg shadow-blue-500/30 active:opacity-80 cursor-pointer"
          onClick={handleImportWechat}
        >
          <Image src={getIcon('plus', '#FFFFFF')} className="w-6 h-6 mr-2" />
          <Text>导入微信收货地址</Text>
        </View>
      </View>
    </View>
  );
}
