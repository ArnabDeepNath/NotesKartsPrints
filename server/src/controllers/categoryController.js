const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    // Fetch all categories with their children (1 level deep) or just fetch all and build a tree frontend
    const categories = await prisma.category.findMany({
      include: {
        children: true,
      },
    });
    res.json(categories);
  } catch (err) {
    if (err.code === "P2021") {
      console.warn("[getCategories] Schema missing (P2021), categories table does not exist.");
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
    const { name, slug, description, image, parentId } = req.body;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
      },
    });

    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === "P2021") {
      return next(new AppError("Categories table does not exist. Please push schema changes.", 400));
    }
    next(err);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, parentId } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        image,
        parentId,
      },
    });

    res.json(category);
  } catch (err) {
    if (err.code === "P2021") {
      return next(new AppError("Categories table does not exist. Please push schema changes.", 400));
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
