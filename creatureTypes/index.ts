import { type CreatureType } from "@/graphql/resolvers-types";
import humanoid from "./humanoid";

const creatureTypes: Record<string, CreatureType> = {
  HUMANOID: humanoid,
};

export default creatureTypes;
