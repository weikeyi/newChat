<script setup lang="ts">
import type {
  AttachmentsProps,
  BubbleListProps,
  ConversationsProps,
} from "ant-design-x-vue";

import {
  CloudUploadOutlined,
  PaperClipOutlined,
  PlusOutlined,
} from "@ant-design/icons-vue";
import { Badge, Button, Flex, Typography, theme } from "ant-design-vue";
import {
  Attachments,
  Bubble,
  Conversations,
  Welcome,
  Sender,
  useXAgent,
  useXChat,
  XStream,
} from "ant-design-x-vue";
import { computed, ref, watch } from "vue";
import { h } from "vue";
import { UserOutlined } from "@ant-design/icons-vue";
import { useChatStore } from "../stores/chat";

const chatStore = useChatStore();

const { token } = theme.useToken();

const styles = computed(() => {
  return {
    layout: {
      width: "100%",
      "min-width": "1000px",
      height: "100vh",
      "border-radius": `${token.value.borderRadius}px`,
      display: "flex",
      background: `${token.value.colorBgContainer}`,
      "font-family": `AlibabaPuHuiTi, ${token.value.fontFamily}, sans-serif`,
    },
    menu: {
      background: `${token.value.colorBgLayout}80`,
      width: "280px",
      height: "100%",
      display: "flex",
      "flex-direction": "column",
    },
    conversations: {
      padding: "0 12px",
      flex: 1,
      "overflow-y": "auto",
    },
    chat: {
      background: `${token.value.colorFillQuaternary}`,
      height: "100%",
      width: "100%",
      "max-width": "1700px",
      margin: "0 auto",
      "box-sizing": "border-box",
      display: "flex",
      "flex-direction": "column",
      padding: `${token.value.paddingLG}px`,
      gap: "16px",
    },
    messages: {
      flex: 1,
    },
    placeholder: {
      "padding-top": "32px",
      "text-align": "left",
      flex: 1,
    },
    sender: {
      "box-shadow": token.value.boxShadow,
      "max-width": "700px",
      margin: "0 auto",
    },
    logo: {
      display: "flex",
      height: "72px",
      "align-items": "center",
      "justify-content": "start",
      padding: "0 24px",
      "box-sizing": "border-box",
    },
    "logo-img": {
      width: "24px",
      height: "24px",
      display: "inline-block",
    },
    "logo-span": {
      display: "inline-block",
      margin: "0 8px",
      "font-weight": "bold",
      color: token.value.colorText,
      "font-size": "16px",
    },
    addBtn: {
      background: "#1677ff0f",
      border: "1px solid #1677ff34",
      width: "calc(100% - 24px)",
      margin: "0 12px 24px 12px",
    },
  } as const;
});

defineOptions({ name: "PlaygroundIndependentSetup" });

// const sleep = () => new Promise(resolve => setTimeout(resolve, 500))

// function renderTitle(icon: VNode, title: string) {
//   return h(Space, { align: 'start' }, [icon, h('span', title)])
// }

const placeholderNode = computed(() =>
  h(Welcome, {
    variant: "borderless",
    icon: "https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp", // 一张图标图片
    title: "欢迎来到这里！",
    description:
      "很高兴能与您相遇。无论您是想获取信息、解决问题，还是单纯想聊聊天，我都在这里陪伴您。请随时提出您的需求，我会尽最大努力为您提供帮助。让我们一起开启一段愉快的交流吧！😊",
    // extra: h(Space, {}, )
  })
);

const defaultConversationsItems = [
  {
    key: "0",
    label: "Conversation 1",
  },
];

const roles: BubbleListProps["roles"] = {
  ai: {
    placement: "start",
    avatar: {
      icon: h(UserOutlined),
      style: {
        color: "#f56a00",
        backgroundColor: "#fde3cf",
      },
    },
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: "16px",
      },
    },
  },
  local: {
    placement: "end",
    avatar: {
      icon: h(UserOutlined),
      style: {
        color: "#fff",
        backgroundColor: "#87d068",
      },
    },
    variant: "shadow",
  },
};

// ==================== State ====================
const headerOpen = ref(false);
const content = ref("");
const conversationsItems = ref(defaultConversationsItems);
const activeKey = ref(defaultConversationsItems[0].key);
const attachedFiles = ref<AttachmentsProps["items"]>([]);
const agentRequestLoading = ref(false);

// ==================== Runtime ====================
const [agent] = useXAgent({
  request: async ({ message }, { onSuccess, onError, onUpdate }) => {
    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      // 用于拼接最终完整文本
      let fullText = "";

      // 逐块读取 SSE 流
      for await (const chunk of XStream({
        readableStream: response.body as ReadableStream<Uint8Array>,
      })) {
        const raw = chunk.data;
        if (!raw) continue;

        try {
          const json = JSON.parse(raw);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onUpdate?.(fullText); // 实时更新内容
          }
        } catch (err) {
          console.warn("JSON parse error: ", raw);
        }
      }

      onSuccess?.(fullText || "（空内容）");
    } catch (err: any) {
      console.error("[agent error]", err);
      onError?.(err.message || "Server error");
    }
  },
});

const { onRequest, messages } = useXChat({
  agent: agent.value,
});

watch(
  activeKey,
  () => {
    if (activeKey.value !== undefined) {
      const history = chatStore.getMessages(activeKey.value);
      if (history) {
        messages.value = history;
      } else {
        messages.value = [];
      }
    }
  },
  { immediate: true }
);
watch(
  messages,
  () => {
    if (activeKey.value !== undefined) {
      chatStore.setMessages(activeKey.value, messages.value);
    }
  },
  { deep: true }
);

// ==================== Event ====================
function onSubmit(nextContent: string) {
  if (!nextContent) return;
  onRequest(nextContent);
  content.value = "";
}

function onAddConversation() {
  conversationsItems.value = [
    ...conversationsItems.value,
    {
      key: `${conversationsItems.value.length}`,
      label: `New Conversation ${conversationsItems.value.length}`,
    },
  ];
  activeKey.value = `${conversationsItems.value.length}`;
}

const onConversationClick: ConversationsProps["onActiveChange"] = (key) => {
  activeKey.value = key;
  console.log("[onConversationClick]", key);
  messages.value = chatStore.getMessages(key) || [];
  console.log("[onConversationClick] messages", messages.value);
};

const handleFileChange: AttachmentsProps["onChange"] = (info) =>
  (attachedFiles.value = info.fileList);

const items = computed<BubbleListProps["items"]>(() => {
  if (messages.value.length === 0) {
    return [{ content: placeholderNode, variant: "borderless" }];
  }
  return messages.value.map(({ id, message, status }) => ({
    key: id,
    role: status === "local" ? "local" : "ai",
    content: message,
  }));
});
</script>

<template>
  <div :style="styles.layout">
    <div :style="styles.menu">
      <!-- 🌟 Logo -->
      <div :style="styles.logo">
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable="false"
          alt="logo"
          :style="styles['logo-img']"
        />
        <span :style="styles['logo-span']">Ant Design X Vue</span>
      </div>

      <!-- 🌟 添加会话 -->
      <Button type="link" :style="styles.addBtn" @click="onAddConversation">
        <PlusOutlined />
        New Conversation
      </Button>

      <!-- 🌟 会话管理 -->
      <Conversations
        :items="conversationsItems"
        :style="styles.conversations"
        :active-key="activeKey"
        @active-change="onConversationClick"
      />
    </div>

    <div :style="styles.chat">
      <!-- 🌟 消息列表 -->
      <Bubble.List :items="items" :roles="roles" :style="styles.messages" />

      <Sender
        :value="content"
        :style="styles.sender"
        :loading="agentRequestLoading"
        @submit="onSubmit"
        @change="(value) => (content = value)"
      >
        <template #prefix>
          <Badge :dot="attachedFiles.length > 0 && !headerOpen">
            <Button type="text" @click="() => (headerOpen = !headerOpen)">
              <template #icon>
                <PaperClipOutlined />
              </template>
            </Button>
          </Badge>
        </template>

        <template #header>
          <Sender.Header
            title="Attachments"
            :open="headerOpen"
            :styles="{ content: { padding: 0 } }"
            @open-change="(open) => (headerOpen = open)"
          >
            <Attachments
              :before-upload="() => false"
              :items="attachedFiles"
              @change="handleFileChange"
            >
              <template #placeholder="type">
                <Flex
                  v-if="type && type.type === 'inline'"
                  align="center"
                  justify="center"
                  vertical
                  gap="2"
                >
                  <Typography.Text style="font-size: 30px; line-height: 1">
                    <CloudUploadOutlined />
                  </Typography.Text>
                  <Typography.Title
                    :level="5"
                    style="margin: 0; font-size: 14px; line-height: 1.5"
                  >
                    Upload files
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Click or drag files to this area to upload
                  </Typography.Text>
                </Flex>
                <Typography.Text v-if="type && type.type === 'drop'">
                  Drop file here
                </Typography.Text>
              </template>
            </Attachments>
          </Sender.Header>
        </template>
      </Sender>
    </div>
  </div>
</template>
