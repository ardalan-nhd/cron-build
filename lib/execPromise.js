const { exec } = require("child_process")

const execPromise = (command) =>
  new Promise((resolve) => {
    exec(command, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr })
    })
  })

module.exports = execPromise
