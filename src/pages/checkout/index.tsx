import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

export default function Checkout() {
  const router = useRouter();
  const { id } = router.params;
  const [product, setProduct] = useState<any>(null);
  const [tradeType, setTradeType] = useState('face'); // face: 当面交易, post: 邮寄
  const [remark, setRemark] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      Taro.showLoading({ title: '加载中' });
      try {
        const res = await Taro.cloud.database().collection('products').doc(id).get();
        setProduct(res.data);
      } catch (e) {} finally { Taro.hideLoading(); }
    };
    fetchProduct();
  }, [id]);

  const handlePay = () => {
    Taro.showLoading({ title: '拉起微信支付...' });
    setTimeout(async () => {
      // 模拟支付成功，生成订单
      try {
        const userInfo = Taro.getStorageSync('userInfo');
        const db = Taro.cloud.database();
        await db.collection('orders').add({
          data: {
            productId: id,
            title: product.title,
            price: product.price,
            seller: product.seller,
            buyer: userInfo.nickName,
            tradeType,
            remark,
            status: 'paid', // paid: 待收货/待发货
            createTime: db.serverDate()
          }
        });
        Taro.hideLoading();
        Taro.showToast({ title: '支付成功', icon: 'success' });
        setTimeout(() => Taro.redirectTo({ url: '/pages/order/index?tab=bought' }), 1500);
      } catch (e) {
        Taro.hideLoading();
        Taro.showToast({ title: '订单生成失败', icon: 'error' });
      }
    }, 1500);
  };

  if (!product) return null;

  return (
    <View className="flex flex-col h-screen bg-zinc-50">
      <ScrollView scrollY className="flex-1 p-4">
        {/* 交易方式选择 */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="font-bold text-lg mb-4 block">选择交易方式</Text>
          <View className="flex space-x-4">
            <View onClick={() => setTradeType('face')} className={`flex-1 py-3 rounded-xl border-2 text-center transition-colors ${tradeType === 'face' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-zinc-100 text-zinc-500'}`}>
              校园面交
            </View>
            <View onClick={() => setTradeType('post')} className={`flex-1 py-3 rounded-xl border-2 text-center transition-colors ${tradeType === 'post' ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold' : 'border-zinc-100 text-zinc-500'}`}>
              邮寄快递
            </View>
          </View>
          {tradeType === 'face' && <Text className="text-xs text-blue-500 mt-3 block">支持扫码收货，资金安全有保障</Text>}
        </View>

        {/* 商品卡片 */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm flex items-center">
           <Image src={product.imageUrl} className="w-20 h-20 rounded-lg bg-zinc-100 object-cover" />
           <View className="ml-4 flex-1">
             <Text className="font-bold text-zinc-800 line-clamp-2">{product.title}</Text>
             <Text className="text-red-500 font-bold mt-2 block">¥{product.price}</Text>
           </View>
        </View>

        {/* 备注 */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="font-bold text-zinc-800 block mb-2">订单备注</Text>
          <Input placeholder="约定面交地点或填写收货地址..." onInput={e => setRemark(e.detail.value)} className="bg-zinc-50 p-3 rounded-xl w-full text-sm" />
        </View>
      </ScrollView>

      {/* 底部支付栏 */}
      <View className="bg-white p-4 pb-8 border-t border-zinc-100 flex justify-between items-center z-50">
        <View>
          <Text className="text-zinc-500 text-sm">合计：</Text>
          <Text className="text-red-500 font-bold text-2xl">¥{product.price}</Text>
        </View>
        <View className="bg-red-500 text-white font-bold px-10 py-3 rounded-full shadow-lg shadow-red-500/30 active:opacity-80 cursor-pointer" onClick={handlePay}>
          确认支付
        </View>
      </View>
    </View>
  );
}
