const { exec } = require("child_process");

module.exports = function runCode(code) {

  return new Promise((resolve) => {

    exec(`python3 -c "${code}"`, { timeout: 3000 }, (error, stdout, stderr) => {

      resolve({
        stdout,
        stderr
      });

    });

  });

};