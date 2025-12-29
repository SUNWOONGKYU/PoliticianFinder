const fs = require("fs");
const content = require("./route_content.json").content;
fs.writeFileSync("src/app/api/posts/[id]/route.ts", content, "utf8");
console.log("File written successfully");
