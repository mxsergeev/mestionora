import { execSync } from "child_process"
import fs from "fs-extra"
import path from "path"

async function splitBook() {
  const epubPath = process.argv[2]
  if (!epubPath || !fs.existsSync(epubPath)) {
    console.error("❌ Please provide a valid EPUB path.")
    process.exit(1)
  }

  if (!process.env.CHAPTERS_PATH) {
    console.error("❌ CHAPTERS_PATH is not set. Add it to your .env file.")
    process.exit(1)
  }

  // Clean the book name for folder usage
  const bookName = path
    .parse(epubPath)
    .name.replaceAll(/[^a-z0-9]/gi, "_")
    .replaceAll(/_{2,}/g, "_")
  const outputDir = path.join(process.env.CHAPTERS_PATH, bookName)
  const tempMd = "temp_full_book.md"

  console.log(`⏳ Pandoc is converting [${bookName}] using GFM format...`)

  try {
    execSync("pandoc --version", { stdio: "ignore" })
  } catch {
    console.error("❌ pandoc is not installed. Install it from https://pandoc.org/installing.html")
    process.exit(1)
  }

  try {
    await fs.ensureDir(outputDir)

    // 1. Convert to GitHub Flavored Markdown (gfm)
    // This is the most compatible and clean format for Gemini
    execSync(`pandoc "${epubPath}" -t gfm -o "${tempMd}" --extract-media="${outputDir}/images"`)

    // 2. Read the full Markdown file
    const fullText = await fs.readFile(tempMd, "utf8")

    // 3. Splitting Strategy
    // Pandoc usually marks chapters with "# " (Level 1 Header).
    // We split the text at every occurrence of a Level 1 Header.
    const chapters = fullText.split(/\n(?=# )/g)

    console.log(`✂️  Detected ${chapters.length} potential sections/chapters.`)

    for (let i = 0; i < chapters.length; i++) {
      const content = chapters[i].trim()
      // Skip empty splits
      if (!content) continue

      const fileName = `chapter_${String(i).padStart(3, "0")}.md`
      const filePath = path.join(outputDir, fileName)

      await fs.writeFile(filePath, content)
      console.log(`  v Created: ${fileName}`)
    }

    // Clean up the massive temporary file
    await fs.remove(tempMd)

    console.log(`\n✅ Done! Chapters saved in: ${outputDir}`)
    console.log(`👉 To begin, start by scraping the lore:`)
    console.log(`   npm run lore -- --input ${bookName}/chapter_001.md`)
  } catch (err) {
    console.error("❌ Error during conversion:", err.message)
  }
}

await splitBook()
