import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Radio, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';

const getIcon = (name: string, color: string = '#A1A1AA') => {
  const hex = color.replace('#', '');
  const map: any = { 'user': 'user', 'marker': 'marker', 'chevron-right': 'chevron-right', 'wallet': 'wallet', 'credit-card': 'credit-card' };
  const iconName = map[name] || 'round';
  return `https://img.icons8.com/ios-filled/64/${hex}/${iconName}.png`;
};

export default function Checkout() {
  const router = useRouter();
  const productId = router.params.id;

  const [product, setProduct] = useState<any>(null);
  const [tradeType, setTradeType] = useState<'face' | 'post'>('face'); // 恢复交易方式状态
  const [address, setAddress] = useState<any>(null);
  const [remark, setRemark] = useState(''); // 恢复面交备注状态
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'wechat' | 'alipay'>('wallet');

  useDidShow(() => {
    const fetchData = async () => {
      if (!productId) return;
      try {
        const db = Taro.cloud.database();
        const res = await db.collection('products').doc(productId).get();
        setProduct(res.data);
      } catch (e) { }
    };
    fetchData();
  });

  const handleChooseAddress = async () => {
    try {
      const res = await Taro.chooseAddress();
      setAddress(res);
    } catch (e) { }
  };

  const handlePay = async () => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (!userInfo) return Taro.showToast({ title: '请先登录', icon: 'none' });
    if (tradeType === 'post' && !address) return Taro.showToast({ title: '请选择收货地址', icon: 'none' });
    if (tradeType === 'face' && !remark.trim()) return Taro.showToast({ title: '请填写面交地点', icon: 'none' });

    Taro.showLoading({ title: '支付处理中...', mask: true });
    try {
      const db = Taro.cloud.database();
      const finalAddress = tradeType === 'post' ? `${address.provinceName}${address.cityName}${address.countyName}${address.detailInfo} (${address.userName} 收)` : `面交备注：${remark}`;

      await db.collection('orders').add({
        data: {
          productId: product._id,
          title: product.title,
          price: product.price,
          seller: product.seller,
          buyer: userInfo.nickName,
          address: finalAddress,
          status: 'paid',
          createTime: db.serverDate()
        }
      });

      // 尝试将商品标记为已售出（如果买家也是卖家自己，则成功；若是别人购买可能失败，因此首页做了双重过滤）
      try {
        await db.collection('products').doc(product._id).update({ data: { status: 'sold' } });
      } catch (err) { console.log('非创建者，无法直接更新商品状态'); }

      Taro.hideLoading();
      Taro.showToast({ title: '支付成功！', icon: 'success' });
      setTimeout(() => Taro.redirectTo({ url: '/pages/order/index?tab=bought' }), 1500);
    } catch (e) {
      Taro.hideLoading();
      Taro.showToast({ title: '支付失败', icon: 'error' });
    }
  };

  const paymentOptions = [
    { id: 'wallet', name: '我的钱包余额', balance: 128.5, icon: 'wallet', color: '#F59E0B' },
    { id: 'wechat', name: '微信支付', icon: 'credit-card', color: '#22C55E' }
  ];

  if (!product) return <View className="h-screen flex justify-center pt-32 bg-zinc-50"><Text className="text-zinc-500 text-lg">加载中...</Text></View>;

  return (
    <View className="flex flex-col h-screen bg-zinc-50 relative box-border overflow-hidden w-full">
      <ScrollView scrollY className="flex-1 w-full box-border hide-scrollbar">
        <View className="flex flex-col items-center px-5 pt-5 pb-24 w-full box-border">

          {/* 交易方式与地址选择区域 */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm flex flex-col box-border w-full">
            <Text className="text-lg font-bold text-zinc-900 mb-4 block">选择交易方式</Text>
            <View className="flex space-x-4 mb-5 w-full">
              <View onClick={() => setTradeType('face')} className={`flex-1 py-3 rounded-xl border-2 text-center transition-colors box-border ${tradeType === 'face' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-zinc-100 text-zinc-500'}`}>校园面交</View>
              <View onClick={() => setTradeType('post')} className={`flex-1 py-3 rounded-xl border-2 text-center transition-colors box-border ${tradeType === 'post' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-zinc-100 text-zinc-500'}`}>邮寄快递</View>
            </View>

            {tradeType === 'post' ? (
              <View className="flex items-center cursor-pointer active:opacity-60 bg-zinc-50 p-4 rounded-2xl w-full box-border" onClick={handleChooseAddress}>
                <Image src={getIcon('marker', '#F97316')} className="w-8 h-8 shrink-0" />
                <View className="flex-1 ml-4">
                  {address ? (
                    <>
                      <Text className="font-bold text-lg text-zinc-900 leading-none mb-1 block">{address.userName} <Text className="text-zinc-500 text-sm font-normal ml-1">{address.telNumber}</Text></Text>
                      <Text className="text-xs text-zinc-500 leading-relaxed block pr-2">{`${address.provinceName}${address.cityName}${address.countyName}${address.detailInfo}`}</Text>
                    </>
                  ) : (
                    <Text className="text-base font-bold text-blue-600">点击选择微信收货地址</Text>
                  )}
                </View>
                <Image src={getIcon('chevron-right', '#D4D4D8')} className="w-5 h-5 shrink-0" />
              </View>
            ) : (
              <View className="w-full box-border">
                <Text className="text-sm font-bold text-zinc-700 mb-2 block">约定面交地点及时间</Text>
                <Input value={remark} onInput={(e) => setRemark(e.detail.value)} placeholder="例如：明天中午一食堂门口见..." className="w-full bg-zinc-50 p-4 rounded-2xl text-base box-border" />
              </View>
            )}
          </View>

          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm flex items-center box-border w-full">
            <View className="w-24 h-24 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              <Image src={product.imageUrl} mode="aspectFill" className="w-full h-full object-cover" />
            </View>
            <View className="flex-1 ml-5 overflow-hidden">
              <Text className="text-xl font-bold text-zinc-900 leading-snug truncate block mb-1.5">{product.title}</Text>
              <View className="flex items-center text-sm text-zinc-400 mb-4">
                <Image src={getIcon('user', '#A1A1AA')} className="w-4 h-4 mr-1.5 shrink-0" />
                <Text className="truncate flex-1">{product.seller}</Text>
              </View>
              <Text className="text-red-500 font-bold text-2xl tracking-tight leading-none"><Text className="text-sm mr-1">¥</Text>{product.price.toFixed(2)}</Text>
            </View>
          </View>

          <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm flex items-center box-border w-full">
            <View className="w-full box-border">
              <Text className="text-xl font-bold text-zinc-900 mb-6 block">选择付款方式</Text>
              {paymentOptions.map((opt, index) => (
                <View key={opt.id} className={`flex items-center justify-between py-5 cursor-pointer ${index !== paymentOptions.length - 1 ? 'border-b border-zinc-50' : ''}`} onClick={() => setPaymentMethod(opt.id as any)}>
                  <View className="flex items-center">
                    <View className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: `${opt.color}10` }}>
                      <Image src={getIcon(opt.icon, opt.color)} className="w-6 h-6" />
                    </View>
                    <View className="ml-4">
                      <Text className="text-base font-medium text-zinc-800">{opt.name}</Text>
                      {opt.balance && <Text className="text-xs text-zinc-400 block mt-1">余额 ¥{opt.balance.toFixed(2)}</Text>}
                    </View>
                  </View>
                  <Radio value={opt.id} checked={paymentMethod === opt.id} color="#2563EB" className="shrink-0" />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-100 px-6 py-4 pb-10 flex items-center justify-between z-50 box-border" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <View className="flex flex-col items-start overflow-hidden mr-4">
          <Text className="text-red-500 font-bold text-3xl tracking-tight leading-none"><Text className="text-sm mr-1">¥</Text>{product.price.toFixed(2)}</Text>
        </View>
        <View className="bg-red-500 px-12 py-3.5 rounded-full shadow-lg shadow-red-500/30 active:opacity-90 cursor-pointer" onClick={handlePay}>
          <Text className="text-white text-lg font-bold">立即付款</Text>
        </View>
      </View>
    </View>
  );
}
