import fs from "fs-extra"
import path from "path"

export async function runEditing(model, relativePath) {
  const statePath = process.env.STATE_PATH || "./state"
  const guidePath = path.join(statePath, "style_guide.md")
  const lorePath = path.join(statePath, "lore_bible.md")
  const templatePath = "./instructions/tasks/editor.md"

  const sourcePath = path.join(process.env.CHAPTERS_PATH, relativePath)
  const draftPath = path.join(process.env.CHAPTERS_PATH, "translated", relativePath)
  const finalPath = path.join(process.env.CHAPTERS_PATH, "final", relativePath)

  console.log(`✍️  Editing ${relativePath}...`)

  // Check if draft exists
  if (!(await fs.pathExists(draftPath))) {
    throw new Error(`Draft not found for ${relativePath}. Run translation first.`)
  }
  if (!(await fs.pathExists(guidePath)) || !(await fs.pathExists(lorePath))) {
    throw new Error("Missing style_guide.md or lore_bible.md. Run style and lore tasks first.")
  }
  const guide = await fs.readFile(guidePath, "utf8")
  const lore = await fs.readFile(lorePath, "utf8")
  const sourceText = await fs.readFile(sourcePath, "utf8")
  const draftText = await fs.readFile(draftPath, "utf8")
  const template = await fs.readFile(templatePath, "utf8")

  const prompt = template
    .replace("{{STYLE_GUIDE}}", guide)
    .replace("{{LORE_BIBLE}}", lore)
    .replace("{{SOURCE_TEXT}}", sourceText)
    .replace("{{DRAFT_TEXT}}", draftText)

  const result = await model.generateContent(prompt)
  const editedText = result.response.text()

  await fs.outputFile(finalPath, editedText)
  console.log(`   v Final version saved to ${finalPath}`)
}
