"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// aws/lambdas/weather/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};
function generateTemperature(location, date) {
  const inputString = location + (date || "");
  const hash = inputString.split("").reduce((acc, char) => {
    return acc + (char.charCodeAt(0) || 0);
  }, 0);
  const temperature = 15 + hash % 15;
  return temperature;
}
var handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  try {
    const method = event.httpMethod;
    if (method === "GET") {
      const location = event.queryStringParameters?.location;
      const date = event.queryStringParameters?.date;
      if (!location) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing required parameter: location"
          })
        };
      }
      const temperature = generateTemperature(location, date || "");
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          data: {
            weather: {
              temperature,
              condition: "Sunny",
              // Adding a dummy condition as well
              location
            }
          }
        })
      };
    }
    return {
      statusCode: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
