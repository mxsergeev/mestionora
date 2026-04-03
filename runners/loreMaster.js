import fs from "fs-extra"
import path from "path"

export async function runLoreMining(model, newContent, fileName) {
  const statePath = process.env.STATE_PATH || "./state"
  const lorePath = path.join(statePath, "lore_bible.md")
  const templatePath = "./instructions/tasks/lore_miner.md"

  console.log(`⛏️  Mining lore from ${fileName}...`)

  const existingLore = (await fs.pathExists(lorePath))
    ? await fs.readFile(lorePath, "utf8")
    : "Lore Bible is currently empty."

  const template = await fs.readFile(templatePath, "utf8")

  const prompt = template
    .replace("{{EXISTING_LORE}}", existingLore)
    .replace("{{NEW_CONTENT}}", newContent)

  const result = await model.generateContent(prompt)
  const updatedLore = result.response.text()

  await fs.outputFile(lorePath, updatedLore)
  console.log(`   v Lore Bible updated.`)
}
