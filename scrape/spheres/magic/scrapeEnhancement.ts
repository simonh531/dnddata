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
  getTextFromIndex,
  getTitleText,
  scrapeTalentList,
  Feature,
  Modifier,
  Talent,
  sphere,
} from "../../utils";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "enhancement";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "enhancement";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const modifiers: Record<string, Modifier> = {};
    const talents: Record<string, Talent> = {};

    const enhanceDegradeList: DataHolder[] = [];
    const enhanceDegradeIndex = getTitleIndex(
      pageContent.content,
      "enhance and degrade talents"
    );
    let currentTitle = "";
    let currentTalentId = "";
    let dontAdd = true;
    let index = enhanceDegradeIndex + 1;
    let currentContent = pageContent.content[index];
    while (
      (typeof currentContent === "string" || currentContent.type !== "hr") &&
      index < pageContent.content.length
    ) {
      if (typeof currentContent !== "string" && currentContent.content) {
        if (currentContent.type === "h4") {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            const regexResult = span.content[0]
              .toString()
              .toLowerCase()
              .match(/(.+?) \(/);
            currentTitle = regexResult ? regexResult[1] : "";
            currentTalentId = toID(currentTitle);
            dontAdd = true;
            talents[currentTalentId] = {
              id: currentTalentId,
              name: currentTitle,
              modifierIds: [],
              categoryId: sphereId,
            };
          }
        } else if (
          currentContent.type === "h5" &&
          typeof currentContent.content[0] !== "string" &&
          currentContent.content[0].content &&
          currentContent.content[0].content[0].toString().slice(0, 5) !==
            "table"
        ) {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            currentTitle = span.content[0].toString().toLowerCase();
            dontAdd = true;
          }
        } else {
          const currentContentCopy = [...currentContent.content];
          if (
            typeof currentContentCopy[0] !== "string" &&
            currentContentCopy[0].type === "em"
          ) {
            const em = currentContentCopy[0].content;
            const strong = em && typeof em[0] !== "string" && em[0].content;
            const category = strong ? strong[0].toString().toLowerCase() : "";
            dontAdd = false;
            currentContentCopy.shift();
            talents[currentTalentId].modifierIds?.push(
              `${toID(currentTitle)}_${category?.toUpperCase()}`
            );
            enhanceDegradeList.push({
              name: currentTitle,
              category,
              content: currentContentCopy,
            });
          } else if (enhanceDegradeList.length && !dontAdd) {
            enhanceDegradeList[enhanceDegradeList.length - 1].content.push(
              currentContent
            );
          }
        }
      }
      index += 1;
      currentContent = pageContent.content[index];
    }

    enhanceDegradeList.forEach(async ({ name, category, content }) => {
      const modifierId = `${toID(name)}_${category?.toUpperCase()}`;
      modifiers[modifierId] = {
        id: modifierId,
        name: name,
        type: "ENHANCE_DEGRADE",
        text: await nhm.translate(
          await JSONToHTML({
            type: "div",
            content,
          })
        ),
        modifyId: category?.toUpperCase() || "",
      };
    });

    const enhanceDegradeCategory = {
      id: "ENHANCE_DEGRADE",
      name: "enhance and degrade",
      text: "",
      talentIds: Object.keys(talents),
    };

    const basicTalents = await scrapeTalentList(
      pageContent.content,
      "other talents",
      "basic",
      features,
      talents
    );

    const advancedTalents = await scrapeTalentList(
      pageContent.content,
      "advanced enhancement talents",
      "advanced",
      features,
      talents
    );

    fs.writeFileSync(
      `spheres/${fileName}.json`,
      JSON.stringify({
        ...sphere,
        id: "ENHANCEMENT",
        name: "enhancement",
        text: await getTextFromIndex(pageContent.content, 7),
        freeCategoryIds: [[enhanceDegradeCategory.id]],
        actionIds: ["DEGRADE", "ENHANCE"],
        categoryIds: [
          enhanceDegradeCategory.id,
          basicTalents.id,
          advancedTalents.id,
        ],
      })
    );
    fs.writeFileSync(
      `categories/${fileName}.json`,
      JSON.stringify({
        [enhanceDegradeCategory.id]: enhanceDegradeCategory,
        [basicTalents.id]: basicTalents,
        [advancedTalents.id]: advancedTalents,
      })
    );
    fs.writeFileSync(`talents/${fileName}.json`, JSON.stringify(talents));
    fs.writeFileSync(`modifiers/${fileName}.json`, JSON.stringify(modifiers));
    fs.writeFileSync(`features/${fileName}.json`, JSON.stringify(features));

    fs.writeFileSync(
      `actions/${fileName}.json`,
      JSON.stringify({
        DEGRADE: {
          id: "DEGRADE",
          name: "degrade",
          text: await getTitleText(pageContent.content, "degrade"),
        },
        ENHANCE: {
          id: "ENHANCE",
          name: "enhance",
          text: await getTitleText(pageContent.content, "enhance"),
        },
      })
    );
  }
}
