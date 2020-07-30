// Node Modules
const csvStringify = require("csv-stringify");
const fs = require("promise-fs");

/**
 * Reduces the functions counter objects and HTML content into a single string
 * that can be directly written as a CSV file.
 *
 * @param {Array<Object>} processedResults - an array of results from `generateFunctionsCounter` and HTML string.
 *
 * @return {String} - CSV data ready to be written into the file system.
 */
module.exports.generateCsvFileContent = async (processedResults) => {
  // The functions identifiers, the 2th ... n columns of our CSV file.
  const functions = new Set();

  // Iterate over the provided counters, function names.
  processedResults.forEach(({ functionCalls = {} }) => {
    Object.keys(functionCalls).forEach((fName) => functions.add(fName));
  });

  // Transform the Set into a array for simple iteration and transformation.
  const allFunctions = [...functions];

  const csvHeader = ["link", "raw", ...allFunctions];
  const { list: csvBody } = processedResults.reduceRight(
    (acc, result) => {
      const { type, origin, data, url, functionCalls = {} } = result;

      const isWebLoader = origin === "WebLoader";
      const isJs = type === "js";
      const isHtml = type === "html";

      if (isWebLoader && isJs) {
        Object.entries(functionCalls).forEach(([fName, calls]) => {
          if (!Object.prototype.hasOwnProperty.call(acc.counters, fName)) {
            acc.counters[fName] = 0;
          }

          acc.counters[fName] += calls;
        });
      }

      const link = isWebLoader && isJs ? "" : url;
      const rawContent = data;
      const formattedFunctionCalls = generateFormattedFunctions(
        allFunctions,
        isWebLoader && isHtml ? acc.counters : functionCalls
      );

      const row = [link, rawContent, ...formattedFunctionCalls];
      acc.list = [row, ...acc.list];

      if (isWebLoader && isHtml) {
        acc.counters = {};
      }

      return acc;
    },
    {
      counters: {},
      list: [],
    }
  );

  // Write the CSV content header.
  const csvData = [csvHeader, ...csvBody];

  return new Promise((resolve, reject) => {
    csvStringify(csvData, (err, output) => {
      if (err) {
        return reject(err);
      }

      resolve(output);
    });
  });
};

const generateFormattedFunctions = (functionsList, functionCalls) => {
  return functionsList.map((fName) => {
    if (
      functionCalls.hasOwnProperty(fName) &&
      typeof functionCalls[fName] === "number"
    ) {
      return functionCalls[fName];
    }

    return 0;
  });
};
