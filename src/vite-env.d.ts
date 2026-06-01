/// <reference types="vite/client" />

/* eslint-disable @typescript-eslint/no-explicit-any */

// 声明 .jsx 文件模块
declare module '*.jsx' {
  const value: any
  export default value
}

// 如果需要更精确的类型，可以这样写：
declare module '*.jsx' {
  import { ComponentType } from 'react'
  const Component: ComponentType<any>
  export default Component
}