import fs from "fs-extra"
import path from "path"

export async function updateProgress(fileName) {
  // Use STATE_PATH from .env or default to local ./state
  const statePath = process.env.STATE_PATH || "./state"
  const progressPath = path.join(statePath, "progress.md")

  // Safety check: only run if the progress file actually exists
  if (!(await fs.pathExists(progressPath))) {
    console.warn(`      ⚠️  Progress file not found at ${progressPath}. Skipping update.`)
    return
  }

  try {
    const content = await fs.readFile(progressPath, "utf8")

    /**
     * Matches checkbox patterns like "- [ ] filename.md" or "- [x] filename.md"
     */
    const escapedFileName = fileName.replaceAll(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    const regex = new RegExp(`- \\[ \\] ${escapedFileName}`, "g")

    if (regex.test(content)) {
      const updatedContent = content.replace(regex, `- [x] ${fileName}`)
      await fs.writeFile(progressPath, updatedContent)
      console.log(`      ✅ Progress updated: ${fileName} marked as done.`)
    } else {
      console.log(`      ℹ️  Chapter ${fileName} was already marked or not found in progress.md.`)
    }
  } catch (error) {
    console.error(`      ❌ Failed to update progress.md: ${error.message}`)
  }
}
