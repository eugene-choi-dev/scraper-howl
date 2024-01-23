const fs = require("fs");

function compileData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log("File not found:", filePath);
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let compiledData = [];

    for (let page in data) {
      compiledData = compiledData.concat(data[page]);
    }

    console.log(`Successfully compiled ${compiledData.length} objects`);

    fs.writeFileSync(
      "compiled_data.json",
      JSON.stringify(compiledData, null, 2),
      "utf8"
    );
    console.log("Compiled data saved to 'compiled_data.json'");
  } catch (error) {
    console.error("Error compiling data:", error);
  }
}

compileData("scraped_data.json");
