import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';

export default function PrivacyPolicy() {
  return (
    <ScrollView scrollY className="h-screen bg-white p-6">
     <Text className="text-xl font-bold text-zinc-900 mb-6 block text-center mt-4">隐私权政策</Text>

      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        拾集校园深知个人信息对您的重要性，我们将按法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
      </Text>

      <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-6">1. 信息收集</Text>
      <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        我们仅在您授权的情况下收集您的微信头像、昵称及绑定的手机号。
        </Text>

        <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-4">2. 信息使用</Text>
        <Text className="text-[13px] text-zinc-600 leading-loose block mb-4">
        您的信息仅用于平台内的身份标识和交易联系，我们不会向任何第三方出售您的个人信息。
        </Text>

         <Text className="text-[14px] text-zinc-800 font-bold block mb-2 mt-4">3. 账号注销</Text>
         <Text className="text-[13px] text-zinc-600 leading-loose block mb-4 pb-10">
        您可以在设置中随时注销账号，我们将清除您的所有相关数据。
        （此处为模拟展示文本，实际开发中需填写真实法务条款）
      </Text>
    </ScrollView>
  );
}
