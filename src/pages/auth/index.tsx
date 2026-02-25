import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Auth() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userInfo = Taro.getStorageSync('userInfo');
    if (userInfo && userInfo.nickName) {
      setCurrentUser(userInfo);
      checkAuthStatus(userInfo.nickName);
    }
  }, []);

  // 1. 从云端查询用户认证信息 (严格校验)
  const checkAuthStatus = async (nickName: string) => {
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('users').where({ nickName }).get();
      
      // 必须有数据，且 isAuth为true，且 realName 不为空，才算真正认证
      if (res.data.length > 0 && res.data[0].isAuth && res.data[0].realName) {
        setIsAuth(true);
        setName(res.data[0].realName);
        setStudentId(res.data[0].studentId);
        
        // 同步修正本地缓存
        const userInfo = Taro.getStorageSync('userInfo');
        Taro.setStorageSync('userInfo', { 
          ...userInfo, isAuth: true, realName: res.data[0].realName, studentId: res.data[0].studentId, campus: '浙江农林大学' 
        });
      } else {
        setIsAuth(false);
        // 如果云端没数据，但本地缓存却显示已认证(异常情况)，强制修正本地缓存为未认证
        const userInfo = Taro.getStorageSync('userInfo');
        if (userInfo && userInfo.isAuth) {
          Taro.setStorageSync('userInfo', { ...userInfo, isAuth: false, realName: '', studentId: '', campus: '' });
        }
      }
    } catch (e) {
      console.log('数据库查询失败', e);
    }
  };

  // 2. 提交认证到云数据库
  const handleSubmit = async () => {
    if (!name || !studentId || !currentUser) {
      Taro.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '学籍网核验中...' });
    
    try {
      const db = Taro.cloud.database();
      const res = await db.collection('users').where({ nickName: currentUser.nickName }).get();
      
      const updateData = {
        nickName: currentUser.nickName,
        isAuth: true,
        campus: '浙江农林大学',
        realName: name,
        studentId: studentId
      };

      if (res.data.length > 0) {
        await db.collection('users').doc(res.data[0]._id).update({ data: updateData });
      } else {
        await db.collection('users').add({ data: updateData });
      }

      Taro.hideLoading();
      
      // 同步更新本地缓存
      const updatedUserInfo = { ...currentUser, ...updateData };
      Taro.setStorageSync('userInfo', updatedUserInfo);
      
      setIsAuth(true);
      Taro.showToast({ title: '认证成功', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '认证失败，请检查网络', icon: 'error' });
    }
  };

  // 安全的字符串脱敏逻辑
  const displayRealName = name.length > 1 ? `*${name.substring(1)}` : (name || '*');
  const displayStudentId = studentId.length > 4 
    ? `${studentId.substring(0, 3)}****${studentId.substring(studentId.length - 2)}` 
    : (studentId || '***');

  return (
    <View className="h-screen bg-zinc-50 p-5">
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
        
        {isAuth ? (
          <View className="flex flex-col items-center py-6">
             <View className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
               <Text className="text-green-500 font-bold text-2xl">✓</Text> 
             </View>
             <Text className="text-xl font-bold text-zinc-900 mb-1">认证通过</Text>
             <Text className="text-sm text-zinc-500 mb-6">您已成为拾集校园实名用户</Text>
             
             <View className="w-full bg-zinc-50 p-4 rounded-xl flex flex-col space-y-2">
                <Text className="text-sm text-zinc-600">学校：浙江农林大学</Text>
                <Text className="text-sm text-zinc-600">姓名：{displayRealName}</Text>
                <Text className="text-sm text-zinc-600">学号：{displayStudentId}</Text>
             </View>
          </View>
        ) : (
          <>
            <Text className="text-xl font-bold text-zinc-900 mb-2 block">学生证核验</Text>
            <Text className="text-xs text-zinc-400 mb-6 block">为了保障交易安全，请填写真实学籍信息</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-zinc-700 mb-2 block font-medium">真实姓名</Text>
              <Input className="w-full bg-zinc-50 h-12 px-4 rounded-xl border border-zinc-100" placeholder="请输入您的真实姓名" onInput={e => setName(e.detail.value)} />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm text-zinc-700 mb-2 block font-medium">学号</Text>
              <Input type="number" className="w-full bg-zinc-50 h-12 px-4 rounded-xl border border-zinc-100" placeholder="请输入您的学号" onInput={e => setStudentId(e.detail.value)} />
            </View>

            <View className="mb-8">
              <Text className="text-sm text-zinc-700 mb-2 block font-medium">所属学校</Text>
              <Input className="w-full bg-zinc-50 h-12 px-4 rounded-xl text-zinc-500 border border-zinc-100" value="浙江农林大学" disabled />
            </View>

            <Button className="w-full bg-blue-600 text-white rounded-full font-bold border-none shadow-lg shadow-blue-500/30" onClick={handleSubmit}>
              提交认证
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
