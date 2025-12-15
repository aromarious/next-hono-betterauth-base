const fs = require("fs")
const path = require("path")

const summaryPath = process.argv[2]
const title = process.argv[3] || "Coverage Report"

if (!fs.existsSync(summaryPath)) {
  console.log(`Summary file not found at ${summaryPath}`)
  process.exit(0)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"))
const total = summary.total

const headers = ["Category", "Statements", "Branches", "Functions", "Lines"]
const rows = [
  [
    "Percentage",
    `${total.statements.pct}%`,
    `${total.branches.pct}%`,
    `${total.functions.pct}%`,
    `${total.lines.pct}%`,
  ],
  [
    "Covered/Total",
    `${total.statements.covered}/${total.statements.total}`,
    `${total.branches.covered}/${total.branches.total}`,
    `${total.functions.covered}/${total.functions.total}`,
    `${total.lines.covered}/${total.lines.total}`,
  ],
]

const markdownTable = [
  `### ${title}`,
  "",
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
  "",
].join("\n")

try {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownTable)
  console.log("Successfully wrote to GITHUB_STEP_SUMMARY")
} catch (error) {
  console.error("Error writing to GITHUB_STEP_SUMMARY:", error)
  // ローカル実行時などはGITHUB_STEP_SUMMARYがない場合があるのでエラーにしない
  console.log(markdownTable)
}
