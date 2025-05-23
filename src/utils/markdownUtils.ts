// src/utils/markdownUtils.ts
import markdownit from 'markdown-it';
import { h } from 'vue';
import { Typography } from 'ant-design-vue';
import type { BubbleProps } from 'ant-design-x-vue';

// 初始化 markdown-it 实例
const md = markdownit({ html: true, breaks: true });

// 实现 Markdown 渲染函数
export const renderMarkdown: BubbleProps['messageRender'] = content =>
  h(Typography, null, {
    default: () => h('div', { innerHTML: md.render(content) }),
  });