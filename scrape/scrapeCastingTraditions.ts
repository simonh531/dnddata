const fs = require("fs");
const axios = require("axios");
const HTMLParser = require("html-to-json-parser");
const { JSONToHTML } = require("html-to-json-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  DataHolder,
  toID,
  findId,
  getTitleIndex,
  Talent,
  Feature,
} from "./utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const response = await axios.get(
    "http://spheres5e.wikidot.com/casting-traditions"
  );
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");
  if (pageContent?.content) {
    const talents: Record<string, Talent> = {};
    const features: Record<string, Feature> = {};
    // Drawbacks
    const drawbackIndex = getTitleIndex(
      pageContent.content,
      "list of drawbacks"
    );
    let index = drawbackIndex + 1;
    let currentContent = pageContent.content[index];
    const drawbackList: DataHolder[] = [];
    while (
      (typeof currentContent === "string" ||
        (currentContent.type !== "h2" && currentContent.type !== "h1")) &&
      index < pageContent.content.length
    ) {
      if (typeof currentContent !== "string" && currentContent.content) {
        if (currentContent.type === "h4") {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            drawbackList.push({
              name: span.content[0].toString(),
              content: [],
            });
          }
        } else {
          drawbackList[drawbackList.length - 1].content.push(currentContent);
        }
      }
      index += 1;
      currentContent = pageContent.content[index];
    }
    const drawbackObject = {};
    await Promise.all(
      drawbackList.map(async (drawback) => {
        const text: string = await nhm.translate(
          await JSONToHTML({
            type: "div",
            content: drawback.content,
          })
        );
        drawbackObject[toID(drawback.name)] = {
          id: toID(drawback.name),
          talentId: toID(drawback.name),
          cost: text.includes("counts as") ? 2 : 1,
        };
        talents[toID(drawback.name)] = {
          id: toID(drawback.name),
          name: drawback.name.toLowerCase(),
          featureIds: [toID(drawback.name)],
        };
        features[toID(drawback.name)] = {
          id: toID(drawback.name),
          name: drawback.name.toLowerCase(),
          text,
        };
      })
    );
    console.log(drawbackObject);
    fs.writeFileSync("drawbacks.json", JSON.stringify(drawbackObject));

    // Boons
    const boonIndex = getTitleIndex(pageContent.content, "boons");
    index = boonIndex + 1;
    currentContent = pageContent.content[index];
    const boonList: DataHolder[] = [];
    while (
      (typeof currentContent === "string" ||
        (currentContent.type !== "h2" && currentContent.type !== "h1")) &&
      index < pageContent.content.length
    ) {
      if (typeof currentContent !== "string" && currentContent.content) {
        if (currentContent.type === "h4") {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            boonList.push({
              name: span.content[0].toString(),
              content: [],
            });
          }
        } else if (boonList.length) {
          boonList[boonList.length - 1].content.push(currentContent);
        }
      }
      index += 1;
      currentContent = pageContent.content[index];
    }
    const boonObject = {};
    await Promise.all(
      boonList.map(async (boon) => {
        boonObject[toID(boon.name)] = {
          id: toID(boon.name),
          talentId: toID(boon.name),
        };
        talents[toID(boon.name)] = {
          id: toID(boon.name),
          name: boon.name.toLowerCase(),
          featureIds: [toID(boon.name)],
        };
        features[toID(boon.name)] = {
          id: toID(boon.name),
          name: boon.name.toLowerCase(),
          text: await nhm.translate(
            await JSONToHTML({
              type: "div",
              content: boon.content,
            })
          ),
        };
      })
    );
    console.log(boonObject);
    fs.writeFileSync("boons.json", JSON.stringify(boonObject));
    fs.writeFileSync("talents/drawbackBoon.json", JSON.stringify(talents));
    fs.writeFileSync("features/drawbackBoon.json", JSON.stringify(features));
  }
}

main();
