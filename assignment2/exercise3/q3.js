const os = require("os");

const fs = require("fs");
function logSystemInfo() {
        setInterval(() => {
                    let info = `
CPU: ${os.cpus()[0].model}
Total Memory: ${os.totalmem()}
Platform: ${os.platform()}
------------------------
`;
        fs.appendFile("systemInfo.txt", info, (err) => {
            if (err) throw err;
            console.log("System info logged");
        });
    }, 6000);
}
module.exports = logSystemInfo;