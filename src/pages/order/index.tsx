import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

export default function Order() {
  const router = useRouter();
  const orderType = router.params.tab || 'bought'; 
  const [activeStatus, setActiveStatus] = useState('pending'); 
  const [orders, setOrders] = useState<any[]>([]);

  const tabs = [
    { key: 'pending', name: '待支付' },
    { key: 'paid', name: '已支付' },
    { key: 'completed', name: '已完成' }
  ];

  const fetchOrders = async () => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (!userInfo) return;
    
    Taro.showLoading({ title: '加载中...' });
    try {
      const db = Taro.cloud.database();
      const query = orderType === 'bought' 
        ? { buyer: userInfo.nickName, status: activeStatus } 
        : { seller: userInfo.nickName, status: activeStatus };
        
      const res = await db.collection('orders').where(query).orderBy('createTime', 'desc').get();
      setOrders(res.data);
    } catch (e) {
      console.error('获取订单失败', e);
    } finally {
      Taro.hideLoading();
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, orderType]);

  const updateOrderStatus = async (orderId: string, newStatus: string, successMsg: string) => {
    Taro.showLoading({ title: '处理中...' });
    try {
      const db = Taro.cloud.database();
      await db.collection('orders').doc(orderId).update({ data: { status: newStatus } });
      Taro.hideLoading();
      Taro.showToast({ title: successMsg, icon: 'success' });
      fetchOrders(); 
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const handleCancel = (orderId: string) => {
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          const db = Taro.cloud.database();
          db.collection('orders').doc(orderId).remove().then(() => {
            Taro.showToast({ title: '订单已取消', icon: 'success' });
            fetchOrders();
          });
        }
      }
    });
  };

  const handlePay = (orderId: string) => {
    Taro.showModal({
      title: '模拟支付',
      content: '确认支付该订单？',
      success: (res) => {
        if (res.confirm) updateOrderStatus(orderId, 'paid', '支付成功');
      }
    });
  };

  const handleRefund = (orderId: string) => {
    Taro.showModal({
      title: '申请退款',
      content: '确认向卖家发起退款申请？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) Taro.showToast({ title: '退款申请已发送', icon: 'success' });
      }
    });
  };

  const handleConfirmReceive = (orderId: string) => {
    Taro.showModal({
      title: '确认收货',
      content: '确认已收到物品？货款将打给卖家。',
      success: (res) => {
        if (res.confirm) updateOrderStatus(orderId, 'completed', '交易完成');
      }
    });
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-50">
      {/* 顶部状态切换栏 */}
      <View className="flex bg-white shadow-sm px-8 justify-between border-b border-zinc-100">
        {tabs.map(tab => (
          <View 
            key={tab.key}
            className={`py-4 px-2 relative text-xl transition-colors ${activeStatus === tab.key ? 'text-blue-600 font-bold' : 'text-zinc-500 font-medium'}`} 
            onClick={() => setActiveStatus(tab.key)}
          >
            {tab.name}
            {activeStatus === tab.key && <View className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-blue-600 rounded-full"></View>}
          </View>
        ))}
      </View>
      
      {/* 订单列表 */}
      <ScrollView scrollY className="flex-1 p-5">
        {orders.length === 0 ? (
          <View className="flex flex-col items-center mt-32">
            <Text className="text-xl text-zinc-400">该状态下暂无订单</Text>
            <Text className="text-sm text-zinc-300 mt-3">（注意：测试需确保数据库 orders 集合有数据）</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order._id} className="bg-white p-5 rounded-2xl shadow-sm mb-5 border border-zinc-100/50">
              <View className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-50">
                <Text className="text-base text-zinc-500">{orderType === 'bought' ? `卖家: ${order.seller}` : `买家: ${order.buyer}`}</Text>
                <Text className={`text-base font-bold ${activeStatus === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                  {tabs.find(t => t.key === activeStatus)?.name}
                </Text>
              </View>
              <Text className="font-bold text-zinc-800 text-xl mb-6 block">{order.title}</Text>
              <View className="flex justify-between items-center">
                <Text className="text-red-500 font-bold text-3xl"><Text className="text-lg mr-1">¥</Text>{order.price}</Text>
                
                <View className="flex space-x-3">
                  {activeStatus === 'pending' && orderType === 'bought' && (
                    <>
                      <Button className="m-0 text-base bg-zinc-100 text-zinc-600 rounded-full px-6 py-2 border-none" onClick={() => handleCancel(order._id)}>取消订单</Button>
                      <Button className="m-0 text-base bg-red-500 text-white rounded-full px-6 py-2 border-none" onClick={() => handlePay(order._id)}>去支付</Button>
                    </>
                  )}
                  {activeStatus === 'paid' && orderType === 'bought' && (
                    <>
                      <Button className="m-0 text-base bg-zinc-100 text-zinc-600 rounded-full px-6 py-2 border-none" onClick={() => handleRefund(order._id)}>申请退款</Button>
                      <Button className="m-0 text-base bg-blue-500 text-white rounded-full px-6 py-2 border-none" onClick={() => handleConfirmReceive(order._id)}>确认收货</Button>
                    </>
                  )}
                  {activeStatus === 'completed' && orderType === 'bought' && (
                    <Button className="m-0 text-base bg-zinc-100 text-zinc-600 rounded-full px-6 py-2 border-none" onClick={() => console.log('评价')}>去评价</Button>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
