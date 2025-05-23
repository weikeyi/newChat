// src/config/chatConfig.ts
import { h } from 'vue';
import { UserOutlined } from '@ant-design/icons-vue';
import type { BubbleListProps } from 'ant-design-x-vue';
import { renderMarkdown } from '../utils/markdownUtils'; // 如果 renderMarkdown 在这里需要

export const roles: BubbleListProps['roles'] = {
  ai: {
    placement: 'start',
    avatar: {
      icon: h(UserOutlined),
      style: {
        color: '#f56a00',
        backgroundColor: '#fde3cf',
      },
    },
    typing: { step: 5, interval: 20 },
    messageRender: renderMarkdown, // 如果 renderMarkdown 与角色定义耦合
    styles: {
      content: {
        borderRadius: '16px',
      },
    },
  },
  local: {
    placement: 'end',
    avatar: {
      icon: h(UserOutlined),
      style: {
        color: '#fff',
        backgroundColor: '#87d068',
      },
    },
    variant: 'shadow',
  },
};