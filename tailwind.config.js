/** @type {import('tailwindcss').Config} */
module.exports = {
  // 这里告诉 Tailwind 去哪里寻找带有样式的类名
  content: ["./public/index.html", "./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // 小程序不需要 preflight，因为小程序有自己的基础样式
    preflight: false
  }
}