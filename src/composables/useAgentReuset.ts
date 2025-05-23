// src/composables/useAgentRequest.ts
import { useXAgent } from 'ant-design-x-vue'
import { XStream } from 'ant-design-x-vue'
import type { chatMessage } from './../type'


export function useAgentRequest(onUpdate: (msg: chatMessage) => void, onFinish: (msg: chatMessage) => void) {
  const getHeader = () => {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}
  const [agent] = useXAgent({
    request: async ({ message }, { onSuccess, onError, onUpdate }) => {
        try {
            const response = await fetch('http://localhost:3000/ai/chat', {
                method: 'POST',
                headers: getHeader(),
                body: JSON.stringify({ content: message }),
            })

            // 用于拼接最终完整文本
            let reasoningText = ''
            let outputText = ''

            // 逐块读取 SSE 流
            for await (const chunk of XStream({
                readableStream: response.body as ReadableStream<Uint8Array>,
            })) {
                if (chunk.data == '[DONE]') {
                    const fullMarkdown = [
                        reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                        outputText,
                    ]
                        .filter(Boolean)
                        .join('\n\n')
                    onSuccess?.(fullMarkdown)
                    break
                }

                const raw = JSON.parse(chunk.data)
                if (!raw) continue
                try {
                    // 只需要解析一次
                    const parsedChunk = JSON.parse(chunk.data)
                    if (!parsedChunk) continue
                    const delta = parsedChunk.content
                    if (!delta) continue

                    if (parsedChunk.type === 'reasoning') {
                        reasoningText += delta
                    } else if (parsedChunk.type === 'output') {
                        outputText += delta
                    }

                    // 实时组合展示（optional）
                    const liveMarkdown = [
                        reasoningText ? `> ${reasoningText.replace(/\n/g, '\n> ')}` : '',
                        outputText,
                    ]
                        .filter(Boolean)
                        .join('\n\n')

                    onUpdate?.(liveMarkdown)
                } catch (err) {
                    console.warn('JSON parse error: ', raw)
                }
            }
        } catch (err: any) {
            console.error('[agent error]', err)
            onError?.(err.message || 'Server error')
        }
    },
})
  return { agent: agent.value }
}
