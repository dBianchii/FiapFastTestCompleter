import { Configuration, OpenAIApi } from "openai"
import "dotenv/config"

const configuration = new Configuration({
	organization: "org-SE7Y6NanPOYGNGLFPKZVS8zB",
	apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

export async function CallOpenAI(prompt) {
	const completion = await openai.createCompletion({
		model: "text-davinci-003",
		prompt,
	})
	return completion.data.choices[0].text
}
