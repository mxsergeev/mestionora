import { GoogleGenerativeAI } from "@google/generative-ai"

const args = process.argv.slice(2)
const getArg = (flag) => {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null
}

async function testConnection() {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = getArg("--model") || process.env.GEMINI_MODEL || "gemini-1.5-flash"

  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not defined in your .env file.")
    return
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Using the model you requested
  const model = genAI.getGenerativeModel({ model: modelName })

  console.log("⏳ Contacting Gemini API...")

  try {
    const result = await model.generateContent(
      "Respond with the words 'Connection Successful!' if you can read this.",
    )
    const response = await result.response
    const text = response.text()

    console.log("------------------------------------")
    console.log("🤖 Gemini says:", text.trim())
    console.log("------------------------------------")
    console.log("✅ Everything is working! You are ready to translate.")
  } catch (error) {
    console.error("❌ Connection failed!")
    console.error("Error details:", error.message)

    if (error.message.includes("API_KEY_INVALID")) {
      console.error("👉 Tip: Check if your API key in the .env file is correct.")
    }
  }
}

await testConnection()
