import { JSONToHTML, JSONType } from "html-to-json-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";

const nhm = new NodeHtmlMarkdown(
  /* options (optional) */ {},
  /* customTransformers (optional) */ undefined,
  /* customCodeBlockTranslators (optional) */ undefined
);

export interface DataHolder {
  name: string;
  category?: string;
  content: (JSONType | string)[];
}

export interface Talent {
  id: string;
  name?: string;
  featureIds?: string[];
  modifierIds?: string[];
  categoryId?: string;
}

export interface Feature {
  id: string;
  name: string;
  text: string;
}

export interface Action {
  id: string;
  name: string;
  text: string;
}

export interface Modifier {
  id: string;
  type: string;
  name: string;
  text: string;
  modifyId: string;
}

export const sphere = {
  freeCategoryIds: [],
  featureIds: [],
  actionIds: [],
  bonusActionIds: [],
  reactionIds: [],
  modifierIds: [],
  categoryIds: [],
  packageIds: [],
};

export function toID(name: string) {
  return name
    .toUpperCase()
    .replace(/[():\[\]]/g, "")
    .replace(/[ \-’'\/]/g, "_");
}

export function findId(htmlJson: JSONType, id: string): null | JSONType {
  if (
    htmlJson.attributes &&
    "id" in htmlJson.attributes &&
    htmlJson.attributes?.id === id
  ) {
    return htmlJson;
  } else if (htmlJson.content) {
    let find: null | JSONType = null;
    let index = 0;
    while (find === null && index < htmlJson.content.length) {
      const searchItem = htmlJson.content[index];
      if (typeof searchItem !== "string") {
        find = findId(searchItem, id);
      }
      index += 1;
    }
    if (find) {
      return find;
    }
  }
  return null;
}

export function findType(htmlJson: JSONType, type): null | JSONType {
  if (htmlJson.type === type) {
    return htmlJson;
  } else if (htmlJson.content) {
    let find: null | JSONType = null;
    let index = 0;
    while (find === null && index < htmlJson.content.length) {
      const searchItem = htmlJson.content[index];
      if (typeof searchItem !== "string") {
        find = findType(searchItem, type);
      }
      index += 1;
    }
    if (find) {
      return find;
    }
  }
  return null;
}

export function getTitleIndex(elements: (JSONType | string)[], search) {
  return elements.findIndex((item) => {
    if (typeof item !== "string" && item.content) {
      const firstChild = item.content[0];
      if (typeof firstChild !== "string" && firstChild.content) {
        const text = firstChild.content[0];
        if (typeof text === "string" && text.toLowerCase() === search) {
          return true;
        }
      }
    }
    return false;
  });
}

export async function createClassTalent(
  content: (JSONType | string)[],
  name: string
) {
  const featureIndex = getTitleIndex(content, name);
  let index = featureIndex + 1;
  let currentContent = content[index];
  const featureText: (string | JSONType)[] = [];
  while (
    (typeof currentContent === "string" ||
      (currentContent.type !== "h2" &&
        currentContent.type !== "h1" &&
        currentContent.type !== "hr")) &&
    index < content.length
  ) {
    featureText.push(currentContent);
    index += 1;
    currentContent = content[index];
  }
  const text = await nhm.translate(
    (await JSONToHTML({
      type: "div",
      content: featureText,
    })) as string
  );
  return {
    id: toID(name),
    name,
    text,
  };
}

export async function createClassFeature(
  content: (JSONType | string)[],
  name: string
) {
  const feature = await createClassTalent(content, name);
  return [
    {
      id: feature.id,
      name: feature.name,
      featureIds: [feature.id],
    },
    feature,
  ];
}

export async function createClassAction(
  content: (JSONType | string)[],
  name: string
) {
  const action = await createClassTalent(content, name);
  return [
    {
      id: action.id,
      name: action.name,
      actionIds: [action.id],
    },
    action,
  ];
}

export async function createClassBonusAction(
  content: (JSONType | string)[],
  name: string
) {
  const action = await createClassTalent(content, name);
  return [
    {
      id: action.id,
      name: action.name,
      bounsActionIds: [action.id],
    },
    action,
  ];
}

export async function getTextFromIndex(
  content: (JSONType | string)[],
  index: number,
  customStop = "h"
) {
  let currentContent = content[index];
  const featureText: (string | JSONType)[] = [];
  while (
    (typeof currentContent === "string" ||
      currentContent.type.slice(0, customStop.length) !== customStop) &&
    index < content.length
  ) {
    featureText.push(currentContent);
    index += 1;
    currentContent = content[index];
  }
  const text: string = await nhm.translate(
    (await JSONToHTML({
      type: "div",
      content: featureText,
    })) as string
  );
  return text;
}

export async function getTitleText(
  content: (JSONType | string)[],
  name: string,
  customStop?: string
) {
  const index = getTitleIndex(content, name);
  return getTextFromIndex(content, index + 1, customStop);
}

export function getHitDice(text: string) {
  const hitDiceRegex = text.match(/<strong>Hit Dice:<\/strong> 1d(\d+?) /);
  let hitDice = 8;
  if (hitDiceRegex) {
    hitDice = parseInt(hitDiceRegex[1]);
  }
  return hitDice;
}

export function getSkillCount(text: string) {
  let skillCount = 0;
  const regexResult = text.match(
    /<strong>Skills:<\/strong> Choose any (\w+?)\W/
  );
  if (regexResult) {
    const stringSkillCount = regexResult[1];
    switch (stringSkillCount) {
      case "two":
        skillCount = 2;
        break;
      case "three":
        skillCount = 3;
        break;
      case "three":
        skillCount = 4;
        break;
    }
  }
  return skillCount;
}

export function getFeatures(content: JSONType, exclude: string[]) {
  const features: string[][] = [];
  const table = findType(content, "table");
  table?.content?.forEach((element) => {
    if (
      typeof element !== "string" &&
      element.content &&
      typeof element.content[5] !== "string" &&
      element.content[5].type !== "th"
    ) {
      const levelFeatures: string[] = [];
      element.content[5].content?.forEach((contentString) => {
        if (typeof contentString === "string") {
          contentString.split(", ").forEach((featureText) => {
            const feature = featureText.toLowerCase();
            if (!exclude.includes(feature)) {
              levelFeatures.push(toID(feature));
            }
          });
        }
      });
      features.push(levelFeatures);
    }
  });
  return features;
}

export async function scrapeTalentList(
  content: (string | JSONType)[],
  contentTitle: string,
  name: string,
  receiver: Record<string, Feature | Modifier>,
  talents: Record<string, Talent>,
  modifyId?: string,
  type?: string
) {
  const list: DataHolder[] = [];
  const titleIndex = getTitleIndex(content, contentTitle);
  let index = titleIndex + 1;
  let currentContent = content[index];
  while (
    (typeof currentContent === "string" || currentContent.type !== "hr") &&
    index < content.length
  ) {
    if (typeof currentContent !== "string" && currentContent.content) {
      if (currentContent.type === "h4") {
        const span = currentContent.content[0];
        if (typeof span !== "string" && span.content) {
          list.push({
            name: span.content[0].toString(),
            content: [],
          });
        }
      } else if (list.length && currentContent.type !== "div") {
        list[list.length - 1].content.push(currentContent);
      }
    }
    index += 1;
    currentContent = content[index];
  }

  return {
    id: toID(name),
    name,
    text: "",
    talentIds: await Promise.all(
      list.map(async (listItem) => {
        const newTalent: Talent = {
          id: toID(listItem.name),
          name: listItem.name.toLowerCase(),
          categoryId: toID(name),
        };
        if (modifyId) {
          newTalent.modifierIds = [toID(listItem.name)];
        } else {
          newTalent.featureIds = [toID(listItem.name)];
        }
        talents[newTalent.id] = newTalent;
        if (modifyId && type) {
          const newModifier: Modifier = {
            id: toID(listItem.name),
            type,
            name: listItem.name.toLowerCase(),
            text: await nhm.translate(
              (await JSONToHTML({
                type: "div",
                content: listItem.content,
              })) as string
            ),
            modifyId,
          };
          receiver[newModifier.id] = newModifier;
        } else {
          const newFeature: Feature = {
            id: toID(listItem.name),
            name: listItem.name.toLowerCase(),
            text: await nhm.translate(
              (await JSONToHTML({
                type: "div",
                content: listItem.content,
              })) as string
            ),
          };
          receiver[newFeature.id] = newFeature;
        }
        return toID(listItem.name);
      })
    ),
  };
}

export function featureArrayToObject(features: Feature[]) {
  const featureObject: Record<string, Feature> = {};
  features.forEach((feature) => (featureObject[feature.id] = feature));
  return featureObject;
}
