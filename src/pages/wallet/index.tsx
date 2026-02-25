import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Wallet() {
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    // 读取本地存储的余额
    const storedBalance = Taro.getStorageSync('walletBalance');
    if (storedBalance) setBalance(storedBalance);
  }, []);

  // 模拟充值功能
  const handleTopUp = () => {
    Taro.showModal({
      title: '模拟充值',
      editable: true,
      placeholderText: '请输入充值金额(如: 100)',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseFloat(res.content);
          if (isNaN(amount) || amount <= 0) {
            Taro.showToast({ title: '请输入有效金额', icon: 'none' });
            return;
          }
          const newBalance = (parseFloat(balance) + amount).toFixed(2);
          setBalance(newBalance);
          Taro.setStorageSync('walletBalance', newBalance); // 更新缓存
          Taro.showToast({ title: `成功充值 ¥${amount}`, icon: 'success' });
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
          <Button className="flex-1 bg-white/20 text-white rounded-full font-bold text-sm m-0 border-none" onClick={() => Taro.showToast({ title: '暂未开放提现', icon: 'none' })}>
            提现
          </Button>
          <Button className="flex-1 bg-white text-blue-600 rounded-full font-bold text-sm m-0 border-none" onClick={handleTopUp}>
            充值
          </Button>
        </View>
      </View>
      
      <Text className="text-zinc-500 text-sm mt-8 block font-medium px-1">最近账单</Text>
      <View className="mt-4 flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-zinc-100">
        <Text className="text-zinc-400 text-sm">还没有产生过交易记录</Text>
      </View>
    </View>
  );
}
