const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureParentCategory = async (parentId, currentCategoryId) => {
  if (!parentId) {
    return null;
  }

  if (parentId === currentCategoryId) {
    throw new AppError("A category cannot be its own parent", 400);
  }

  const parentCategory = await prisma.category.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      parentId: true,
    },
  });

  if (!parentCategory) {
    throw new AppError("Parent category not found", 404);
  }

  if (parentCategory.parentId) {
    throw new AppError("Only one level of subcategories is supported", 400);
  }

  return parentCategory.id;
};

const buildCategoryData = async (payload, currentCategoryId = null) => {
  const name = String(payload.name || "").trim();

  if (!name) {
    throw new AppError("Category name is required", 400);
  }

  const parentId = await ensureParentCategory(
    payload.parentId || null,
    currentCategoryId,
  );

  if (currentCategoryId && parentId) {
    const existingCategory = await prisma.category.findUnique({
      where: { id: currentCategoryId },
      select: {
        id: true,
        children: {
          select: { id: true },
        },
      },
    });

    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }

    if (existingCategory.children.length > 0) {
      throw new AppError(
        "Move or delete the existing subcategories before nesting this category",
        400,
      );
    }
  }

  const slug = slugify(name);

  if (!slug) {
    throw new AppError("Unable to generate a valid category URL", 400);
  }

  return {
    name,
    slug,
    description: payload.description
      ? String(payload.description).trim()
      : null,
    image: payload.image || null,
    parentId,
  };
};

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        children: {
          orderBy: [{ name: "asc" }],
        },
      },
    });
    res.json(categories);
  } catch (err) {
    if (err.code === "P2021") {
      console.warn(
        "[getCategories] Schema missing (P2021), categories table does not exist.",
      );
      return res.json([]);
    }
    next(err);
  }
};

// GET /api/categories/:id
const getCategory = async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        children: true,
      },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    res.json(category);
  } catch (err) {
    if (err.code === "P2021") {
      return next(new AppError("Category not found", 404));
    }
    next(err);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const data = await buildCategoryData(req.body);

    const newCategory = await prisma.category.create({
      data,
    });

    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === "P2021") {
      return next(
        new AppError(
          "Categories table does not exist. Please push schema changes.",
          400,
        ),
      );
    }
    if (err.code === "P2002") {
      return next(
        new AppError("A category with this generated URL already exists", 400),
      );
    }
    next(err);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const data = await buildCategoryData(req.body, req.params.id);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });

    res.json(category);
  } catch (err) {
    if (err.code === "P2021") {
      return next(
        new AppError(
          "Categories table does not exist. Please push schema changes.",
          400,
        ),
      );
    }
    if (err.code === "P2002") {
      return next(
        new AppError("A category with this generated URL already exists", 400),
      );
    }
    if (err.code === "P2025") {
      return next(new AppError("Category not found", 404));
    }
    next(err);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2021") {
      return next(new AppError("Categories table does not exist.", 400));
    }
    next(err);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
