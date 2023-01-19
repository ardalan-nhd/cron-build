#! /usr/bin/env node
require("../lib/checkVersion")()
require("../lib/loadEnv")()

const execPromise = require("../lib/execPromise")
const fetchAppInfo = require("../lib/fetchAppInfo")
const { spawn } = require("child_process")
const fs = require("fs-extra")
const path = require("path")

const isEqual = require("lodash.isequal")
const cron = require("node-cron")

let buildingState = "IDLE"
const appInfoPath = path.resolve(process.cwd(), "./src/appInfo.json")

/**
 * fetchs app info and then starts build procedure depending on strictMode and appInfo status.
 */
const build = async (rebuilding, strictMode) => {
  if (strictMode && !rebuilding)
    console.log("\x1b[35m%s\x1b[0m\n", "Strict mode is enabled.")
  if (rebuilding)
    console.log("\x1b[35m%s\x1b[0m\n", "Cron job. Starting rebuild procedure.")
  if (buildingState === "BUILDING") {
    console.log(
      "\x1b[36m%s\x1b[0m\n",
      "Another build is already in progress. Aborting."
    )
    return
  }
  let currentAppInfo = null
  let changedAppInfo = false

  try {
    console.log("\x1b[36m%s\x1b[0m\n", "fetching app info")
    try {
      currentAppInfo = await fs.readJSON(appInfoPath)
    } catch (e) {}
    const appInfo = await fetchAppInfo()
    changedAppInfo = !isEqual(appInfo, currentAppInfo)
    if (!changedAppInfo && rebuilding) {
      console.log("\x1b[36m%s\x1b[0m\n", "No change found in app info\n")
      startServer(true)
      return
    }
    fs.writeJson(appInfoPath, appInfo)
  } catch (e) {
    console.log("\x1b[31m%s\x1b[0m\n", e)
    if (!rebuilding && strictMode) {
      console.log("\x1b[31m%s\x1b[0m\n", "Strict mode is enabled. Aborting.")
      process.exit(1)
    }
    if (!!currentAppInfo) {
      console.log(
        "\x1b[33m%s\x1b[0m\n",
        "Continuing with the current appInfo.json"
      )
      if (rebuilding) {
        startServer(true)
        return
      }
    } else {
      console.log(
        "\x1b[31m%s\x1b[0m",
        "No appInfo.json found! Aborting build process."
      )
      throw e + "No appInfo.json found! Aborting build process."
    }
  }

  console.log(
    "\x1b[36m%s\x1b[0m",
    `\n${
      changedAppInfo ? "Change detected in app info." : ""
    } Building application...\n`
  )

  buildingState = "BUILDING"
  const buildProcess = spawn("npm", ["run", "build"])
  buildProcess.addListener("error", (data) => console.log("error", data))
  buildProcess.on("exit", (exitCode) => {
    if (exitCode === 0) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        "Successful build. Restarting server...\n"
      )
      buildingState = "IDLE"
      startServer()
    } else {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Build failed. Run `npm run build` in your terminal to see the logs"
      )
      buildingState = "ERROR"
      if (!rebuilding) {
        process.exit(exitCode)
      }
    }
  })
  buildProcess.stdout.on("data", (data) => console.log(`${data}`))
}

/**
 * The rest of the build process (killing current running server and restarting server)
 * @param {boolean} noRestart If set to true, only starts the server and won't kill already running server
 * @returns
 */
const startServer = async (noRestart, strictMode) => {
  const { err: err2, stdout } = await execPromise(
    `ss -lptn 'sport = :${process.env.SERVER_PORT || 8080}'`
  )
  if (err2) {
    console.log(err2)
    return
  }
  const pid = stdout
    .toString()
    .match(/pid=\d+/)?.[0]
    ?.split("=")?.[1]

  if (pid) {
    if (noRestart) return
    const { err } = execPromise(`kill ${pid}`)
    if (err) {
      console.log("failed to kill current running server. error:", err)
      return
    }
  }

  const server = spawn("npx", [
    "next",
    "start",
    "-p",
    process.env.SERVER_PORT || 8080
  ])
  server.stdout.on("data", (data) => console.log(`${data}`))
  server.stdout.on("error", (data) => console.log(`${data}`))
  server.on("exit", (exitCode) => {
    server.removeAllListeners()
    if (exitCode !== 0) {
      startServer()
    }
  })
}

const strictMode = !!process.argv.find(
  (item) => item === "-s" || item === "--strict"
)
build(false, strictMode)
cron.schedule("0 0 * * * *", () => build(true, strictMode))
