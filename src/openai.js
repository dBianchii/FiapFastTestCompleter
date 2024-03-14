import { Configuration, OpenAIApi } from "openai";
import "dotenv/config";

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function CallOpenAI(prompt) {
  const completion = await openai.createChatCompletion({
    model: "gpt-4-0125-preview", //? <--- Altere aqui o modelo caso necessário
    messages: [
      {
        role: "user",
        content:
          "Apenas responda a pergunta com uma letra maíuscula, como 'D', ou 'C'. Não explique sua resposta.\nQuais dessas não é uma das ações para minimizar impactos?\nA - Ter a economia circular.\nB - Proteger os recursos hídricos.\nC - Impressão de uso material educativo para a população.\nD - Descarbonizar a economia.\nE - Proteger a biodiversidade.",
      },
      {
        role: "assistant",
        content: "C",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  return completion.data.choices[0].message;
}
