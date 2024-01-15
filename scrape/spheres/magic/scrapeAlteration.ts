const fs = require("fs");
import axios from "axios"
import { HTMLToJSON } from "html-to-json-parser";
const { NodeHtmlMarkdown } = require("node-html-markdown");
import {
  findId,
  toID,
  getTextFromIndex,
  getTitleText,
  scrapeTalentList,
  Feature,
  Modifier,
  sphereDefault,
  AddInitialTalent
} from "../../utils";
import { Sphere, Talent } from "../../types";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export default async function main() {
  const fileName = "alteration";
  const response = await axios.get(`http://spheres5e.wikidot.com/${fileName}`);
  const body = response.data.match(/<body[\w\W]+<\/body>/)[0];
  const sanitized = body.replace(/&\w+?;/g, "");
  const result = await HTMLToJSON(sanitized);
  if (typeof result === "string") return

  const pageContent = findId(result, "page-content");
  if (!pageContent?.content) return

  const name = "alteration";
  const sphereId = toID(name);
  const features: Record<string, Feature> = {};
  const modifiers: Record<string, Modifier> = {};
  const talents: Record<string, Talent> = {};

  const shapeshift = {
    id: "SHAPESHIFT",
    name: "shapeshift",
    text: await getTitleText(pageContent.content, "shapeshift"),
  }

  const genotype = await scrapeTalentList(
    pageContent.content,
    "genotype talents",
    "genotype",
    modifiers,
    talents,
    {
      modifyId: shapeshift.id,
      type: "GENOTYPE",
      requireIds: {
        actionIds: [shapeshift.id]
      }
    }
  );

  const trait = await scrapeTalentList(
    pageContent.content,
    "trait talents",
    "trait",
    modifiers,
    talents,
    {
      modifyId: shapeshift.id,
      type: "TRAIT",
      requireIds: {
        actionIds: [shapeshift.id]
      }
    }
  );

  const basicTalents = await scrapeTalentList(
    pageContent.content,
    "other talents",
    "basic",
    features,
    talents,
    {
      requireIds: {
        tags: ["alteration"]
      }
    }
  );

  const advancedTalents = await scrapeTalentList(
    pageContent.content,
    "alteration advanced talents",
    "advanced",
    features,
    talents,
    {
      requireIds: {
        tags: ["alteration"]
      }
    }
  );

  AddInitialTalent(talents, "default alteration", {
    actionIds: [shapeshift.id],
    acquireFromCategoryId: [[genotype.id]],
    tags: ["alteration"]
  })

  AddInitialTalent(talents, "flesh warper", {
    text: await getTitleText(pageContent.content, "flesh warper"),
    actionIds: [shapeshift.id],
    acquireIds: [["TWISTED_BODY_TRAIT"]],
    acquireFromCategoryId: [[genotype.id]],
    tags: ["alteration"]
  })

  AddInitialTalent(talents, "lycanthropic", {
    text: await getTitleText(pageContent.content, "lycanthropic"),
    actionIds: [shapeshift.id],
    acquireFromCategoryId: [[genotype.id]],
    acquireFromSphereId: [[sphereId]],
    tags: ["alteration"]
  })

  AddInitialTalent(talents, "material weakness", {
    text: await getTitleText(pageContent.content, "material weakness"),
    actionIds: [shapeshift.id],
    acquireFromCategoryId: [[genotype.id]],
    acquireFromSphereId: [[sphereId]],
    tags: ["alteration"]
  })

  const sphere: Sphere = {
    ...sphereDefault,
    id: sphereId,
    name,
    type: "MAGIC",
    text: await getTextFromIndex(pageContent.content, 7),
    actionIds: [shapeshift.id],
    categoryIds: [
      genotype.id,
      trait.id,
      basicTalents.id,
      advancedTalents.id,
    ],
  }

  fs.writeFileSync(
    `spheres/${fileName}.json`,
    JSON.stringify(sphere)
  );
  fs.writeFileSync(
    `categories/${fileName}.json`,
    JSON.stringify({
      [genotype.id]: genotype,
      [trait.id]: trait,
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
      SHAPESHIFT: shapeshift,
    })
  );
}
