import fs from "fs-extra"
import path from "path"
// Import the tracker
import { updateProgress } from "./tracker.js"

export async function runTranslation(model, content, relativePath) {
  const statePath = process.env.STATE_PATH || "./state"
  const guidePath = path.join(statePath, "style_guide.md")
  const lorePath = path.join(statePath, "lore_bible.md")
  const templatePath = "./instructions/tasks/translator.md"

  console.log(`🌐 Translating ${relativePath}...`)

  // Ensure we have our knowledge base before starting
  if (!(await fs.pathExists(guidePath)) || !(await fs.pathExists(lorePath))) {
    throw new Error("Missing style_guide.md or lore_bible.md. Run style and lore tasks first.")
  }

  const guide = await fs.readFile(guidePath, "utf8")
  const lore = await fs.readFile(lorePath, "utf8")
  const template = await fs.readFile(templatePath, "utf8")

  const prompt = template
    .replace("{{STYLE_GUIDE}}", guide)
    .replace("{{LORE_BIBLE}}", lore)
    .replace("{{TEXT}}", content)
    .replace("{{LANGUAGE}}", process.env.LANGUAGE)

  // 1. Get Translation from Gemini
  const result = await model.generateContent(prompt)
  const translatedText = result.response.text()

  // 2. Save the translated file
  const targetPath = path.join(process.env.CHAPTERS_PATH, "translated", relativePath)
  await fs.outputFile(targetPath, translatedText)
  console.log(`   v Translation saved to ${targetPath}`)

  // 3. CALL PROGRESS TRACKER HERE
  // We use the relativePath (e.g., "BookName/chapter_001.md") to match the progress list
  await updateProgress(relativePath)
}
