export interface Sphere {
  id: string
  name: string
  type: "MAGIC" | "MARTIAL"
  text: string
  featureIds: string[]
  actionIds: string[]
  bonusActionIds: string[]
  reactionIds: string[]
  modifierIds: string[]
  categoryIds: string[]
  packageIds: string[]
}

export interface RequireIds {
  actionIds?: string[],
  tags?: string[],
}

export interface Talent {
  id: string
  name: string
  text?: string
  requireIds?: RequireIds
  actionIds?: string[]
  featureIds?: string[]
  modifierIds?: string[]
  acquireIds?: string[][]
  acquireFromCategoryId?: string[][]
  acquireFromSphereId?: string[][]
  tags: string[]
}