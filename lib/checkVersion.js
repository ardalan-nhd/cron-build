const checkVersion = () => {
  if (parseInt(process.version.split(".")[0].slice(1)) < 18) {
    console.log(
      "\x1b[31m%s\x1b[0m\n",
      "Node version 18 or higher required. Current version is " +
        process.version.slice(1)
    )
    console.log(
      "\x1b[36m%s\x1b[0m\n",
      "Upgrade using following commands: \nsudo npm cache clean -f\nsudo npm install -g n\nsudo n latest"
    )
    console.log("\x1b[31m%s\x1b[0m\n", "Aborting build process.")
    process.exit(1)
  }
}

// exports.default = checkVersion

module.exports = checkVersion
