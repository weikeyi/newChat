// src/services/aiService.ts
import { XStream } from 'ant-design-x-vue';

/**
 * 从 AI 后端流式传输聊天响应。
 * 为数据、完成或错误生成事件 (yields events)。
 */
export async function* streamAIChatResponse(
  messageContent: string,
  headers: Record<string, string>
): AsyncGenerator<{ type: 'data' | 'done' | 'error'; payload: any }, void, unknown> {
  try {
    const response = await fetch('http://localhost:3000/ai/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: messageContent }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: 'error', payload: `服务器错误 (${response.status}): ${errorText}` };
      return;
    }

    if (!response.body) {
      yield { type: 'error', payload: '响应体丢失。' };
      return;
    }

    // 逐块读取 SSE 流
    for await (const chunk of XStream({ readableStream: response.body as ReadableStream<Uint8Array> })) {
      if (chunk.data === '[DONE]') {
        yield { type: 'done', payload: null }; // 发送完成信号
        break;
      }

      try {
        const parsedChunk = JSON.parse(chunk.data); // 解析数据块
        if (!parsedChunk) continue;
        // 假设 parsedChunk 的结构是 { type: 'reasoning' | 'output', content: string }
        yield { type: 'data', payload: parsedChunk }; // 发送解析后的数据
      } catch (parseError) {
        console.warn('流式数据 JSON 解析错误:', chunk.data, parseError);
        // 可选：为此数据块发送一个特定的错误信号或继续
      }
    }
  } catch (error: any) {
    console.error('[streamAIChatResponse 错误]', error);
    yield { type: 'error', payload: error.message || '发生网络或流式处理错误。' };
  }
}