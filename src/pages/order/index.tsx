import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

export default function Order() {
  const router = useRouter();
  const orderType = router.params.tab || 'bought';
  const [activeStatus, setActiveStatus] = useState('pending');
  const [orders, setOrders] = useState<any[]>([]);

  // 优化：将 'paid' 标签名字改为 '进行中'，以涵盖待发货和已发货状态
  const tabs = [
    { key: 'pending', name: '待支付' },
    { key: 'paid', name: '进行中' },
    { key: 'completed', name: '已完成' }
  ];

  const fetchOrders = async () => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (!userInfo) return;

    Taro.showLoading({ title: '加载中...' });
    try {
      const db = Taro.cloud.database();
      const _ = db.command; // 引入数据库查询指令

      const query: any = orderType === 'bought'
        ? { buyer: userInfo.nickName }
        : { seller: userInfo.nickName };

      // 核心修复：当选中“进行中(paid)”标签时，同时查询 paid(待发货) 和 shipped(已发货) 的订单
      if (activeStatus === 'paid') {
        query.status = _.in(['paid', 'shipped']);
      } else {
        query.status = activeStatus;
      }

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

  // 新增：卖家发货逻辑
  const handleShip = (order: any) => {
    Taro.showModal({
      title: '确认发货',
      content: '确认已将物品交付给买家吗？',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '处理中...' });
          try {
            const db = Taro.cloud.database();
            // 1. 更新订单状态为已发货
            await db.collection('orders').doc(order._id).update({ data: { status: 'shipped' } });
            // 2. 动态生成【交易物流】通知给买家
            await db.collection('notices').add({
              data: {
                category: '交易物流',
                title: '宝贝已发货',
                content: `您购买的【${order.title}】卖家已发货，配送/面交信息：${order.address || '无备注'}。`,
                timeStr: '刚刚',
                createTime: db.serverDate()
              }
            });
            Taro.hideLoading();
            Taro.showToast({ title: '发货成功', icon: 'success' });
            fetchOrders();
          } catch (e) {
            Taro.hideLoading();
            Taro.showToast({ title: '发货失败', icon: 'error' });
          }
        }
      }
    });
  };

  // 修改：买家确认收货与打款逻辑
  const handleConfirmReceive = (order: any) => {
    Taro.showModal({
      title: '确认收货',
      content: '确认已收到物品？货款将打入卖家钱包。',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '处理中...' });
          try {
            const db = Taro.cloud.database();
            // 1. 更新订单状态为完成
            await db.collection('orders').doc(order._id).update({ data: { status: 'completed' } });
            // 2. 动态生成通知给卖家
            await db.collection('notices').add({
              data: {
                category: '交易物流',
                title: '交易成功',
                content: `买家已确认收货，货款 ¥${order.price} 已自动打入您的钱包余额。`,
                timeStr: '刚刚',
                createTime: db.serverDate()
              }
            });
            // 3. 给卖家账户余额打款
            const userRes = await db.collection('users').where({ nickName: order.seller }).get();
            if (userRes.data.length > 0) {
              await db.collection('users').doc(userRes.data[0]._id).update({
                data: { balance: db.command.inc(order.price) } // 金额累加
              });
            }
            Taro.hideLoading();
            Taro.showToast({ title: '交易完成', icon: 'success' });
            fetchOrders();
          } catch (e) {
            Taro.hideLoading();
            Taro.showToast({ title: '操作失败', icon: 'error' });
          }
        }
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

                {/* 动态显示更精确的订单状态 */}
                <Text className={`text-base font-bold ${order.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>
                  {order.status === 'pending' ? '待支付' :
                    order.status === 'paid' ? '待发货' :
                      order.status === 'shipped' ? '已发货' : '已完成'}
                </Text>
              </View>

              <Text className="font-bold text-zinc-800 text-xl mb-3 block">{order.title}</Text>

              {/* 显示收货地址或备注 */}
              {order.address && (
                <Text className="text-sm text-zinc-500 mb-5 block bg-zinc-50 p-3 rounded-lg leading-relaxed">
                  物流/备注: {order.address}
                </Text>
              )}

              <View className="flex justify-between items-center">
                <Text className="text-red-500 font-bold text-3xl"><Text className="text-lg mr-1">¥</Text>{order.price}</Text>

                <View className="flex space-x-3">
                  {/* 买卖双方操作按钮逻辑分离 */}
                  {order.status === 'pending' && orderType === 'bought' && (
                    <>
                      <Button className="m-0 text-base bg-zinc-100 text-zinc-600 rounded-full px-6 py-2 border-none" onClick={() => handleCancel(order._id)}>取消订单</Button>
                      <Button className="m-0 text-base bg-red-500 text-white rounded-full px-6 py-2 border-none" onClick={() => handlePay(order._id)}>去支付</Button>
                    </>
                  )}
                  {order.status === 'paid' && orderType === 'bought' && (
                    <Button className="m-0 text-base bg-zinc-100 text-zinc-600 rounded-full px-6 py-2 border-none" onClick={() => handleRefund(order._id)}>申请退款</Button>
                  )}
                  {order.status === 'paid' && orderType === 'sold' && (
                    <Button className="m-0 text-base bg-blue-500 text-white rounded-full px-6 py-2 border-none" onClick={() => handleShip(order)}>去发货</Button>
                  )}
                  {order.status === 'shipped' && orderType === 'bought' && (
                    <Button className="m-0 text-base bg-green-500 text-white rounded-full px-6 py-2 border-none shadow-md shadow-green-500/20" onClick={() => handleConfirmReceive(order)}>确认收货</Button>
                  )}
                  {order.status === 'completed' && orderType === 'bought' && (
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
