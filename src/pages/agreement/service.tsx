import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';

export default function ServiceAgreement() {
  return (
    <ScrollView scrollY className="h-screen bg-white p-6">
      <Text className="text-xl font-bold text-zinc-900 mb-6 block text-center mt-4">用户服务协议</Text>
      
      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        欢迎您使用拾集校园！本协议是您与拾集校园平台之间关于使用本服务所订立的协议。
      </Text>
      
      <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-6">1. 账号注册与使用</Text>
      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        您应当提供真实、准确的校园身份信息进行认证。平台有权对您的身份信息进行审核。
      </Text>

      <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-4">2. 交易规范</Text>
      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        平台仅作为校园闲置信息发布媒介，请买卖双方在校园内当面交易，注意财产安全。
      </Text>

      <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-4">3. 违规处理</Text>
      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4 pb-10">
        严禁发布虚假、违禁物品信息，一经发现将永久封号。
      </Text>
    </ScrollView>
  );
}
