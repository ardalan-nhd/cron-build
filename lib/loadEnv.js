const path = require("path")
const fs = require("fs-extra")

const loadEnv = () => {
  let envPath = ""
  try {
    envPath = path.resolve(process.cwd(), "./.env.local")
    fs.accessSync(envPath)
  } catch {
    envPath = ""
  }
  try {
    if (envPath === "") {
      envPath = path.resolve(process.cwd(), "./.env.production.local")
      fs.accessSync(envPath)
    }
  } catch {
    console.log(
      "\x1b[31m%s\x1b[0m\n",
      "Can't find env file. Make a `.env.local` or `.env.production.local` in your project root"
    )
    process.exit(1)
  }
  require("dotenv").config({
    path: envPath
  })
}

module.exports = loadEnv
