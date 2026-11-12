const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const { parseBookImages, serializeBookImages } = require("../utils/bookImages");

// Helper: convert Prisma Decimal fields to plain numbers for JSON serialization
function serializeBook(book) {
  if (!book) return book;
  const b = { ...book };
  if (b.price != null) b.price = Number(b.price);
  if (b.comparePrice != null) b.comparePrice = Number(b.comparePrice);
  b.images = parseBookImages(b.images);
  if (b.variations && Array.isArray(b.variations)) {
    b.variations = b.variations.map(v => ({
      ...v,
      price: v.price != null ? Number(v.price) : v.price,
      comparePrice: v.comparePrice != null ? Number(v.comparePrice) : v.comparePrice,
    }));
  }
  return b;
}

function normalizeVariationInput(variation) {
  const price = Number(variation.price);
  const stock = variation.stock === undefined || variation.stock === null || variation.stock === ""
    ? 0
    : Number(variation.stock);
  const comparePrice = variation.comparePrice === undefined || variation.comparePrice === null || variation.comparePrice === ""
    ? null
    : Number(variation.comparePrice);

  if (!variation.attributes || typeof variation.attributes !== "object" || Array.isArray(variation.attributes)) {
    throw new AppError("Each variation must have valid attributes", 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError("Variation price must be a non-negative number", 400);
  }
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0)) {
    throw new AppError("Variation compare price must be a non-negative number", 400);
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError("Variation stock must be a non-negative whole number", 400);
  }

  return {
    attributes: variation.attributes,
    price,
    comparePrice,
    stock,
    sku: variation.sku || null,
    image: variation.image || null,
  };
}

// Check if category columns exist in the books table
let _hasCategoryColumns = null;
async function hasCategoryColumns() {
  if (_hasCategoryColumns !== null) return _hasCategoryColumns;
  // These are the exact column names mapped by the Prisma Book model.
  // Unexpected database errors must not silently disable category filtering.
  const columns = await prisma.$queryRaw`SHOW COLUMNS FROM books WHERE Field IN ('categoryId', 'subcategoryId')`;
  _hasCategoryColumns = columns.length === 2;
  return _hasCategoryColumns;
}

// Check if book_variations table exists
let _hasVariationsTable = null;
async function hasVariationsTable() {
  if (_hasVariationsTable !== null) return _hasVariationsTable;
  try {
    const tables = await prisma.$queryRaw`SHOW TABLES LIKE 'book_variations'`;
    _hasVariationsTable = tables.length > 0;
  } catch {
    _hasVariationsTable = false;
  }
  return _hasVariationsTable;
}

// Reset the schema caches (called when a P2022 or P2021 error is caught)
function resetCategoryColumnsCache() {
  _hasCategoryColumns = null;
  _hasVariationsTable = null;
}

// Explicit select that excludes categoryId / subcategoryId (fallback for P2022)
const SAFE_BOOK_SELECT = {
  id: true, title: true, subtitle: true, author: true,
  description: true, shortDesc: true, price: true, comparePrice: true,
  coverImage: true, images: true, isbn: true, publisher: true,
  publishedAt: true, pages: true, language: true, format: true,
  stock: true, sold: true, rating: true, reviewCount: true,
  featured: true, isActive: true, genreId: true, tags: true,
  createdAt: true, updatedAt: true,
  genre: true,
};

// Books can be assigned to any depth through either category field.
// Resolve the selected node and all descendants without including its siblings.
function getCategoryBranchIds(categories, slug) {
  const selected = categories.find((item) => item.slug === String(slug));
  if (!selected) return [];

  const childrenByParent = new Map();
  for (const item of categories) {
    const children = childrenByParent.get(item.parentId) || [];
    children.push(item.id);
    childrenByParent.set(item.parentId, children);
  }

  const ids = new Set();
  const pending = [selected.id];
  while (pending.length) {
    const id = pending.pop();
    if (ids.has(id)) continue;
    ids.add(id);
    pending.push(...(childrenByParent.get(id) || []));
  }
  return [...ids];
}

const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      genre,
      featured,
      section,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      format,
      category,
      subcategory,
    } = req.query;

    const takeNum = Math.min(Math.max(1, Number(limit) || 12), 100);
    const skipNum = Math.max(0, (Number(page) || 1) - 1) * takeNum;

    const where = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { author: { contains: String(search) } },
        { tags: { contains: String(search) } },
      ];
    }
    
    // Use scalar ID filters instead of relational filters (more reliable on MySQL)
    if (genre) {
      const genreRecord = await prisma.genre.findUnique({ where: { slug: String(genre) } });
      if (genreRecord) where.genreId = genreRecord.id;
      else where.genreId = "___none___";
    }

    const catColumnsExist = await hasCategoryColumns();
    if (category || subcategory) {
      if (!catColumnsExist) {
        throw new AppError("Category filtering is unavailable. Please update the database schema.", 503);
      }

      const categories = await prisma.category.findMany({
        select: { id: true, slug: true, parentId: true },
      });
      // Keep search's OR separate and intersect category/subcategory branches.
      where.AND = [category, subcategory].filter(Boolean).map((slug) => {
        const ids = getCategoryBranchIds(categories, slug);
        return {
          OR: [
            { categoryId: { in: ids } },
            { subcategoryId: { in: ids } },
          ],
        };
      });
    }
    if (featured === "true") where.featured = true;
    if (section) where.section = String(section);
    if (format) where.format = String(format);

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) where.price.gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) where.price.lte = Number(maxPrice);
    }

    const validSortFields = ["createdAt", "price", "rating", "sold", "title"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // Build include - only include category and variations if they exist
    const include = { genre: true };
    const variationsExist = await hasVariationsTable();
    if (variationsExist) {
      include.variations = true;
    }
    if (catColumnsExist) {
      include.category = true;
    }

    let rawBooks, total;
    try {
      [rawBooks, total] = await Promise.all([
        prisma.book.findMany({
          where,
          skip: skipNum,
          take: takeNum,
          orderBy: { [sortField]: sortOrder },
          include,
        }),
        prisma.book.count({ where }),
      ]);
    } catch (queryErr) {
      // P2022 = column does not exist, P2021 = table does not exist
      if (queryErr.code === "P2022" || queryErr.code === "P2021") {
        console.warn(`[getBooks] Schema missing (${queryErr.code}), falling back to safe select...`);
        resetCategoryColumnsCache();
        // Never broaden a filtered request into the full catalog.
        if ((category || subcategory) && !(await hasCategoryColumns())) {
          throw new AppError("Category filtering is unavailable. Please update the database schema.", 503);
        }

        const fallbackSelect = { ...SAFE_BOOK_SELECT };
        if (await hasVariationsTable()) {
          fallbackSelect.variations = true;
        }

        [rawBooks, total] = await Promise.all([
          prisma.book.findMany({
            where,
            skip: skipNum,
            take: takeNum,
            orderBy: { [sortField]: sortOrder },
            select: fallbackSelect,
          }),
          prisma.book.count({ where }),
        ]);
      } else {
        throw queryErr;
      }
    }

    // Serialize Decimal fields to plain numbers
    const books = rawBooks.map(serializeBook);

    res.json({
      books,
      pagination: {
        total,
        page: Number(page) || 1,
        limit: takeNum,
        totalPages: Math.ceil(total / takeNum),
      },
    });
  } catch (err) {
    console.error("[getBooks] ERROR:", err.message);
    console.error("[getBooks] Code:", err.code);
    console.error("[getBooks] Stack:", err.stack);
    // Return real error for debugging
    res.status(err.statusCode || 500).json({
      message: err instanceof AppError ? err.message : "Failed to load books",
      debug: err.message,
      code: err.code,
    });
  }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const catColumnsExist = await hasCategoryColumns();
    const variationsExist = await hasVariationsTable();
    const include = {
      genre: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { reviews: true, wishlist: true } },
    };
    if (variationsExist) {
      include.variations = true;
    }
    if (catColumnsExist) {
      include.category = true;
      include.subcategory = true;
    }

    let book;
    const whereClause = { id: req.params.id };
    if (!req.user || req.user.role !== "ADMIN") {
      whereClause.isActive = true;
    }
    console.warn(`[getBook DEBUG] fetching for:`, whereClause);

    try {
      book = await prisma.book.findUnique({
        where: whereClause,
        include,
      });
      console.warn(`[getBook DEBUG] first query result:`, !!book);
    } catch (queryErr) {
      if (queryErr.code === "P2022" || queryErr.code === "P2021") {
        console.warn(`[getBook DEBUG] Schema missing ${queryErr.code}`);
        resetCategoryColumnsCache();
        
        const fallbackSelect = { ...SAFE_BOOK_SELECT };
        if (await hasVariationsTable()) {
          fallbackSelect.variations = true;
        }

        book = await prisma.book.findUnique({
          where: whereClause,
          select: {
            ...fallbackSelect,
            reviews: {
              take: 10,
              orderBy: { createdAt: "desc" },
              include: { user: { select: { id: true, name: true, avatar: true } } },
            },
            _count: { select: { reviews: true, wishlist: true } },
          },
        });
        console.warn(`[getBook DEBUG] fallback query result:`, !!book);
      } else {
        console.warn(`[getBook DEBUG] caught non-schema err:`, queryErr);
        throw queryErr;
      }
    }

    if (!book) {
      console.warn(`[getBook DEBUG] Return 404 because book is null`);
      throw new AppError("Book not found", 404);
    }

    // If user is authenticated, check wishlist
    let inWishlist = false;
    if (req.user) {
      const wl = await prisma.wishlist.findUnique({
        where: { userId_bookId: { userId: req.user.id, bookId: book.id } },
      });
      inWishlist = !!wl;
    }

    res.json({ book: serializeBook({ ...book, inWishlist }) });
  } catch (err) {
    next(err);
  }
};

// POST /api/books  (Admin)
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      author,
      description,
      shortDesc,
      price,
      comparePrice,
      coverImage,
      images,
      isbn,
      publisher,
      publishedAt,
      pages,
      language,
      format,
      stock,
      featured,
      genreId,
      categoryId,
      subcategoryId,
      tags,
      section,
      variations,
    } = req.body;

    const catColumnsExist = await hasCategoryColumns();
    const variationsExist = await hasVariationsTable();
    const createData = {
        title,
        subtitle,
        author,
        description,
        shortDesc,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        coverImage,
        images: serializeBookImages(images),
        isbn,
        publisher,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        pages: pages ? Number(pages) : null,
        language: language || "English",
        format: format || "PHYSICAL",
        stock: Number(stock) || 0,
        featured: featured === true || featured === "true",
        genreId: genreId || null,
        section: section || null,
        tags,
        ...(variationsExist && variations && Array.isArray(variations) && variations.length > 0 && {
           variations: {
             create: variations.map(normalizeVariationInput),
           },
        }),
    };
    if (catColumnsExist) {
      createData.categoryId = categoryId || null;
      createData.subcategoryId = subcategoryId || null;
    }

    let selectFields = undefined;
    if (!catColumnsExist) {
        selectFields = { ...SAFE_BOOK_SELECT };
        const variationsExist = await hasVariationsTable();
        if (variationsExist) selectFields.variations = true;
    } else {
        const variationsExist = await hasVariationsTable();
        selectFields = { genre: true };
        if (variationsExist) selectFields.variations = true;
        if (catColumnsExist) selectFields.category = true;
    }

    const book = await prisma.book.create({
      data: createData,
      ...(catColumnsExist ? { include: selectFields } : { select: selectFields }),
    });

    res.status(201).json({ message: "Book created", book: serializeBook(book) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/books/:id  (Admin)
const updateBook = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const variations = data.variations;
    delete data.variations; // Prevent direct update of this array

    if (data.price) data.price = Number(data.price);
    if (data.comparePrice) data.comparePrice = Number(data.comparePrice);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    if (data.pages) data.pages = Number(data.pages);
    if (data.featured !== undefined)
      data.featured = data.featured === true || data.featured === "true";
    if (data.section != null) data.section = data.section.trim() || null;
    if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
    if (data.images !== undefined) data.images = serializeBookImages(data.images);
    const catColumnsExist = await hasCategoryColumns();
    if (catColumnsExist) {
      if (data.categoryId === "") data.categoryId = null;
      if (data.subcategoryId === "") data.subcategoryId = null;
    } else {
      delete data.categoryId;
      delete data.subcategoryId;
    }

    let updateData = { ...data };

    const variationsExist = await hasVariationsTable();
    if (variationsExist && Array.isArray(variations)) {
      const existingVariations = variations
        .filter((variation) => variation.id)
        .map((variation) => ({
          where: { id: variation.id },
          data: normalizeVariationInput(variation),
        }));
      const newVariations = variations
        .filter((variation) => !variation.id)
        .map(normalizeVariationInput);

      // Update in place so historical order items keep their variation relation.
      if (existingVariations.length > 0 || newVariations.length > 0) {
        updateData.variations = {
          ...(existingVariations.length > 0 ? { update: existingVariations } : {}),
          ...(newVariations.length > 0 ? { create: newVariations } : {}),
        };
      }
    }

    let selectFields = undefined;
    if (!catColumnsExist) {
        selectFields = { ...SAFE_BOOK_SELECT };
        const variationsExist = await hasVariationsTable();
        if (variationsExist) selectFields.variations = true;
    } else {
        const variationsExist = await hasVariationsTable();
        selectFields = { genre: true, category: true };
        if (variationsExist) selectFields.variations = true;
    }

    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: updateData,
      ...(catColumnsExist 
        ? { include: selectFields } 
        : { select: selectFields }),
    });

    res.json({ message: "Book updated", book: serializeBook(book) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  (Admin)
const deleteBook = async (req, res, next) => {
  try {
    await prisma.book.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true }, // Explicit select prevents P2022 implicit return scalar check
    });
    res.json({ message: "Book removed" });
  } catch (err) {
    next(err);
  }
};

// POST /api/books/:id/review
const createReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const bookId = req.params.id;
    const userId = req.user.id;

    // Check user purchased this book
    const purchased = await prisma.orderItem.findFirst({
      where: {
        bookId,
        order: { userId, status: { in: ["PAID", "DELIVERED"] } },
      },
    });

    const review = await prisma.review.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: { rating: Number(rating), title, comment, verified: !!purchased },
      create: {
        userId,
        bookId,
        rating: Number(rating),
        title,
        comment,
        verified: !!purchased,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Recalculate aggregate rating
    const agg = await prisma.review.aggregate({
      where: { bookId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.book.update({
      where: { id: bookId },
      data: {
        rating: agg._avg.rating || 0,
        reviewCount: agg._count.rating,
      },
    });

    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/genres
const getGenres = async (req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ genres });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  createReview,
  getGenres,
};
