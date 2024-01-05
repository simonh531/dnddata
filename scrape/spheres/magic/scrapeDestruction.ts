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
  const fileName = "destruction";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLParser.default(sanitized);
  const pageContent = findId(result, "page-content");

  if (pageContent?.content) {
    const name = "destruction";
    const sphereId = toID(name);
    const features: Record<string, Feature> = {};
    const modifiers: Record<string, Modifier> = {};
    const talents: Record<string, Talent> = {};

    const blastTypeList: DataHolder[] = [];
    const blastTypeIndex = getTitleIndex(
      pageContent.content,
      "blast type talents"
    );
    let sphereOrigin = "";
    let dontAdd = true;
    let index = blastTypeIndex + 1;
    let currentContent = pageContent.content[index];
    while (
      (typeof currentContent === "string" || currentContent.type !== "hr") &&
      index < pageContent.content.length
    ) {
      if (typeof currentContent !== "string" && currentContent.content) {
        if (currentContent.type === "h3") {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            sphereOrigin = span.content[0].toString();
            dontAdd = true;
          }
        } else if (currentContent.type === "h4") {
          const span = currentContent.content[0];
          if (typeof span !== "string" && span.content) {
            dontAdd = false;
            blastTypeList.push({
              name: span.content[0].toString(),
              category: sphereOrigin,
              content: [],
            });
          }
        } else if (blastTypeList.length && !dontAdd) {
          blastTypeList[blastTypeList.length - 1].content.push(currentContent);
        }
      }
      index += 1;
      currentContent = pageContent.content[index];
    }

    const blastType = {
      id: "BLAST_TYPE",
      name: "blast type",
      text: await getTitleText(pageContent.content, "blast type talents"),
      talentIds: await Promise.all(
        blastTypeList.map(async (blastType) => {
          const talentId = toID(`${blastType.category} ${blastType.name}`);
          talents[talentId] = {
            id: talentId,
            name: `${blastType.category}: ${blastType.name}`,
            modifierIds: [toID(blastType.name)],
            categoryId: "BLAST_TYPE",
          };
          const modifierId = toID(blastType.name);
          modifiers[modifierId] = {
            id: modifierId,
            name: blastType.name.toLowerCase(),
            type: "BLAST_TYPE",
            text: await nhm.translate(
              await JSONToHTML({
                type: "div",
                content: blastType.content,
              })
            ),
            modifyId: "DESTRUCTIVE_BLAST",
          };
          return talentId;
        })
      ),
    };

    const blastShape = await scrapeTalentList(
      pageContent.content,
      "blast shape talents",
      "blast shape",
      modifiers,
      talents,
      "DESTRUCTIVE_BLAST",
      "BLAST_SHAPE"
    );

    const basicTalents = await scrapeTalentList(
      pageContent.content,
      "other talents",
      "basic",
      features,
      talents
    );

    const advancedTalents = await scrapeTalentList(
      pageContent.content,
      "destruction advanced talents",
      "advanced",
      features,
      talents
    );

    fs.writeFileSync(
      `spheres/${fileName}.json`,
      JSON.stringify({
        ...sphere,
        id: sphereId,
        name,
        text: await getTextFromIndex(pageContent.content, 7),
        freeCategoryIds: [["BLAST_TYPE"], ["BLAST_SHAPE"]],
        actionIds: ["DESTRUCTIVE_BLAST"],
        categoryIds: [
          blastType.id,
          blastShape.id,
          basicTalents.id,
          advancedTalents.id,
        ],
      })
    );
    fs.writeFileSync(
      `categories/${fileName}.json`,
      JSON.stringify({
        [blastType.id]: blastType,
        [blastShape.id]: blastShape,
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
        DESTRUCTIVE_BLAST: {
          id: "DESTRUCTIVE_BLAST",
          name: "destructive blast",
          text: await getTitleText(pageContent.content, "destructive blast"),
        },
      })
    );
  }
}
