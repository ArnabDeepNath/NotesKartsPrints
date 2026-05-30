import type {
  CategoryTile,
  MenuTargetType,
  TargetedMenuItem,
} from "@/lib/site-settings";

export type ManagedCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: ManagedCategory[];
};

export type ResolvedMenuItem = {
  id: string;
  label: string;
  href: string;
  targetType: MenuTargetType;
  targetId: string | null;
  missingTarget: boolean;
};

export type MenuTargetOption = {
  label: string;
  value: string;
  targetType: Exclude<MenuTargetType, "custom">;
  targetId: string;
};

export type MenuTargetOptionGroup = {
  label: string;
  options: MenuTargetOption[];
};

const MENU_TARGET_SEPARATOR = "::";

export const createMenuItemId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const flattenCategories = (items: ManagedCategory[]): ManagedCategory[] => {
  const flattened: ManagedCategory[] = [];

  items.forEach((item) => {
    flattened.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      parentId: item.parentId,
    });

    if (item.children?.length) {
      flattened.push(...flattenCategories(item.children));
    }
  });

  return flattened;
};

export const buildCategoryMap = (items: ManagedCategory[]) =>
  new Map(flattenCategories(items).map((item) => [item.id, item]));

export const buildMenuTargetGroups = (
  items: ManagedCategory[],
): MenuTargetOptionGroup[] => {
  const categoryMap = buildCategoryMap(items);
  const topLevelOptions = flattenCategories(items)
    .filter((item) => !item.parentId)
    .map((item) => ({
      label: item.name,
      value: stringifyMenuTargetValue("category", item.id),
      targetType: "category" as const,
      targetId: item.id,
    }));

  const subcategoryOptions = flattenCategories(items)
    .filter((item) => Boolean(item.parentId))
    .map((item) => ({
      label: `${categoryMap.get(item.parentId || "")?.name || "Category"} / ${item.name}`,
      value: stringifyMenuTargetValue("subcategory", item.id),
      targetType: "subcategory" as const,
      targetId: item.id,
    }));

  return [
    ...(topLevelOptions.length
      ? [{ label: "Categories", options: topLevelOptions }]
      : []),
    ...(subcategoryOptions.length
      ? [{ label: "Subcategories", options: subcategoryOptions }]
      : []),
  ];
};

export const stringifyMenuTargetValue = (
  targetType: Exclude<MenuTargetType, "custom">,
  targetId: string,
) => `${targetType}${MENU_TARGET_SEPARATOR}${targetId}`;

export const parseMenuTargetValue = (value: string) => {
  const [targetType, targetId] = value.split(MENU_TARGET_SEPARATOR);

  if (
    (targetType === "category" || targetType === "subcategory") &&
    targetId
  ) {
    return {
      targetType,
      targetId,
    } as const;
  }

  return null;
};

export const resolveMenuItem = (
  item: TargetedMenuItem,
  categoryMap: Map<string, ManagedCategory>,
): ResolvedMenuItem => {
  if (
    item.targetType !== "custom" &&
    item.targetId &&
    categoryMap.has(item.targetId)
  ) {
    const category = categoryMap.get(item.targetId)!;
    return {
      id: item.id,
      label: item.label.trim() || category.name,
      href:
        item.targetType === "category"
          ? `/books?category=${category.slug}`
          : `/books?subcategory=${category.slug}`,
      targetType: item.targetType,
      targetId: item.targetId,
      missingTarget: false,
    };
  }

  return {
    id: item.id,
    label: item.label,
    href: item.href,
    targetType: item.targetType,
    targetId: item.targetId,
    missingTarget:
      item.targetType !== "custom" && Boolean(item.targetId) && !item.href,
  };
};

export const resolveCategoryTile = (
  tile: CategoryTile,
  categoryMap: Map<string, ManagedCategory>,
) => {
  const resolved = resolveMenuItem(
    {
      id: tile.id,
      label: tile.name,
      href: tile.href,
      targetType: tile.targetType,
      targetId: tile.targetId,
    },
    categoryMap,
  );

  return {
    ...tile,
    name: resolved.label,
    href: resolved.href,
    missingTarget: resolved.missingTarget,
  };
};