// src/pages/wallet/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';

export default function Wallet() {
  const [balance, setBalance] = useState('0.00');
  const [userInfo, setUserInfo] = useState<any>(null);

  // 每次进入页面，从数据库实时读取余额
  useDidShow(() => {
    const user = Taro.getStorageSync('userInfo');
    if (user) {
      setUserInfo(user);
      fetchBalance(user.nickName);
    }
  });

  const fetchBalance = async (nickName: string) => {
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('users').where({ nickName }).get();
      if (res.data.length > 0 && res.data[0].balance) {
        setBalance(res.data[0].balance.toFixed(2));
      }
    } catch (e) { }
  };

  // 提现功能
  const handleWithdraw = () => {
    if (parseFloat(balance) <= 0) {
      return Taro.showToast({ title: '余额不足', icon: 'none' });
    }

    Taro.showModal({
      title: '余额提现',
      content: `确认将 ¥${balance} 提现到微信零钱吗？(预计2小时内到账)`,
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '提现处理中...' });
          try {
            const db = Taro.cloud.database();
            const userRes = await db.collection('users').where({ nickName: userInfo.nickName }).get();
            // 数据库余额清零
            await db.collection('users').doc(userRes.data[0]._id).update({ data: { balance: 0 } });
            setBalance('0.00');
            Taro.hideLoading();
            Taro.showToast({ title: '提现发起成功', icon: 'success' });
          } catch (e) {
            Taro.hideLoading();
            Taro.showToast({ title: '提现失败', icon: 'error' });
          }
        }
      }
    });
  };

  return (
    <View className="h-screen bg-zinc-50 p-5">
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
        <Text className="text-blue-100 text-sm block mb-2 font-medium">账户总余额 (元)</Text>
        <Text className="text-[40px] font-bold tracking-tight block mb-6">{balance}</Text>

        <View className="flex space-x-4 mt-4">
          <Button className="flex-1 bg-white/20 text-white rounded-full font-bold text-sm m-0 border-none" onClick={handleWithdraw}>
            全部提现
          </Button>
          <Button className="flex-1 bg-white text-blue-600 rounded-full font-bold text-sm m-0 border-none" onClick={() => Taro.showToast({ title: '校园版不支持充值', icon: 'none' })}>
            充值
          </Button>
        </View>
      </View>

      <Text className="text-zinc-500 text-sm mt-8 block font-medium px-1">最近账单</Text>
      <View className="mt-4 flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-zinc-100">
        <Text className="text-zinc-400 text-sm">暂无明细记录</Text>
      </View>
    </View>
  );
}
