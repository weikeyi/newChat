import OpenAI from "openai";
import { useXAgent, useXChat, Sender, Bubble } from "ant-design-x-vue";

const client = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: import.meta.env.VITE_DASHSCOPE_API_KEY,
  dangerouslyAllowBrowser: true,
})

const DeepSeek=()=>{
  const [agent] = useXAgent({
    request: async (info: any, callbacks: any) => {
      const { messages, message } = info;

      const { onSuccess, onUpdate, onError } = callbacks;

      // current message
      console.log('message', message);

      // history messages
      console.log('messages', messages);

      let content: string = '';

      try {
        const stream = await client.chat.completions.create({
          model: 'deepseek-v3',
          // if chat context is needed, modify the array
          messages: [{ role: 'user', content: message }],
          // stream mode
          stream: true,
        });

        for await (const chunk of stream) {
          content += chunk.choices[0]?.delta?.content || '';

          onUpdate(content);
        }

        onSuccess(content);
      } catch (error) {
        // handle error
        // onError();
      }
    },
  });

  const {

    onRequest,

    messages,
  } = useXChat({ agent });
  return {
    onRequest,
    messages
  }
}

export default DeepSeek