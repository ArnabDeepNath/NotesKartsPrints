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
