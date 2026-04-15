import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs-extra"
import path from "path"

// Import Runners
import { runStyleAnalysis } from "./runners/styleAnalyser.js"
import { runLoreMining } from "./runners/loreMaster.js"
import { runTranslation } from "./runners/translator.js"
import { runEditing } from "./runners/editor.js"

const args = process.argv.slice(2)

// Helper to get CLI arguments
const getArg = (flag) => {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null
}

// Config
// style, lore, translate
const task = getArg("--task")
// e.g. "Book_Vol_1/chapter_001.md"
const inputPath = getArg("--input")
const isAll = args.includes("--all")
const modelName = getArg("--model") || process.env.GEMINI_MODEL || "gemini-1.5-flash"

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set. Add it to your .env file.")
    process.exit(1)
  }

  if (!task || (!inputPath && !isAll)) {
    console.error(
      "❌ Usage: npm run <style|lore|translate|edit> -- [--input <chapter> | --all --input <folder>] [--model <name>]",
    )
    process.exit(1)
  }

  if (!process.env.STATE_PATH) {
    console.error("❌ STATE_PATH is not set. Add it to your .env file.")
    process.exit(1)
  }

  if (!process.env.CHAPTERS_PATH) {
    console.error("❌ CHAPTERS_PATH is not set. Add it to your .env file.")
    process.exit(1)
  }

  if (!process.env.LANGUAGE) {
    console.error("❌ LANGUAGE is not set. Add it to your .env file.")
    process.exit(1)
  }

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
    model: modelName,
  })

  // Determine which files to process
  let filesToProcess = []
  if (isAll) {
    if (!inputPath) {
      console.error("❌ --all requires --input <folder> to specify the book folder.")
      process.exit(1)
    }
    const folder = inputPath.split("/")[0]
    const dir = path.join(process.env.CHAPTERS_PATH, folder)
    const files = await fs.readdir(dir)
    filesToProcess = files
      .filter((f) => f.endsWith(".md"))
      .toSorted()
      .map((f) => path.join(folder, f))
  } else {
    filesToProcess = [inputPath]
  }

  console.log(`🚀 Starting [${task.toUpperCase()}] using model: ${modelName}`)

  for (const relativePath of filesToProcess) {
    // Note: For 'edit', we don't necessarily read 'content' from 'source'
    // in the same way, but the runner handles file loading internally.

    const sourcePath = path.join(process.env.CHAPTERS_PATH, relativePath)

    if (!(await fs.pathExists(sourcePath))) {
      console.warn(`⚠️ File not found, skipping: ${sourcePath}`)
      continue
    }

    const content = await fs.readFile(sourcePath, "utf8")

    try {
      // Validate task is one of the allowed values
      if (!["style", "lore", "translate", "edit"].includes(task)) {
        console.error(`❌ Unknown task: ${task}. Allowed tasks: style, lore, translate, edit`)
        continue
      }

      switch (task) {
        case "style":
          await runStyleAnalysis(model, content, relativePath)
          break
        case "lore":
          await runLoreMining(model, content, relativePath)
          break
        case "translate":
          await runTranslation(model, content, relativePath)
          break
        case "edit":
          await runEditing(model, relativePath)
          break
        default:
          console.error("❌ Unknown task:", task)
      }
    } catch (readError) {
      console.error(`❌ Failed to read file ${relativePath}:`, readError.message)
      continue
    }

    // Add rate limiting between API calls to avoid hitting rate limits
    if (filesToProcess.length > 1 && relativePath !== filesToProcess[0]) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

await main()
