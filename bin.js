global.__basedir = __dirname;

// Node Modules
const path = require("path");
const fs = require("promise-fs");
const moment = require("moment");

// Application Modules
const { ProcessorFactory } = require("./src/processor");
const createDataLoaders = require("./src/cli");
const { generateCsvFileContent } = require("./src/data_processing");

// Constants
const REPORTS_DIR = path.resolve(__dirname, "reports");
const REQUIRED_FOLDERS = [REPORTS_DIR];

(async function execute() {
  // Create the necessary folder structure for the program.
  await createFolderStructure();

  // Get data loaders.
  const dataLoaders = await createDataLoaders(process.argv);

  // Output file name
  const date = moment().format();
  const outputFilePath = path.resolve(REPORTS_DIR, `${date}.csv`);

  // Go through each loader, fetching and processing their data.
  const processedResults = [];
  for (const loader of dataLoaders) {
    const dataContent = await loader.load();

    const processedContent = [];
    for (const content of dataContent) {
      console.log("Processing ", content.url);
      const processor = ProcessorFactory.create(content.type);
      const proccessedValue = await processor.process(content);
      processedContent.push(proccessedValue);
    }

    processedResults.push(...processedContent.flat());
  }

  const csvContent = await generateCsvFileContent(processedResults);
  return fs.writeFile(outputFilePath, csvContent);
})();

function createFolderStructure() {
  return Promise.all(
    REQUIRED_FOLDERS.map(async (folderPath) => {
      try {
        await fs.mkdir(folderPath);
      } catch (err) {}
    })
  );
}
