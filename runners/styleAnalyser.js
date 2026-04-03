import fs from "fs-extra"
import path from "path"

export async function runStyleAnalysis(model, newContent, fileName) {
  const statePath = process.env.STATE_PATH || "./state"
  const guidePath = path.join(statePath, "style_guide.md")
  const templatePath = "./instructions/tasks/style_analyzer.md"

  console.log(`🧐 Analyzing style in ${fileName}...`)

  const existingGuide = (await fs.pathExists(guidePath))
    ? await fs.readFile(guidePath, "utf8")
    : "No style guide established yet."

  const template = await fs.readFile(templatePath, "utf8")

  const prompt = template
    .replace("{{EXISTING_STYLE}}", existingGuide)
    .replace("{{NEW_CONTENT}}", `[Source File: ${fileName}]\n${newContent}`)

  const result = await model.generateContent(prompt)
  const updatedGuide = result.response.text()

  await fs.outputFile(guidePath, updatedGuide)
  console.log(`   v Style guide updated.`)
}
