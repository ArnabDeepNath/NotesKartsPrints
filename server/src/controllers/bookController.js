const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// Helper: convert Prisma Decimal fields to plain numbers for JSON serialization
function serializeBook(book) {
  if (!book) return book;
  const b = { ...book };
  if (b.price != null) b.price = Number(b.price);
  if (b.comparePrice != null) b.comparePrice = Number(b.comparePrice);
  if (b.variations && Array.isArray(b.variations)) {
    b.variations = b.variations.map(v => ({
      ...v,
      price: v.price != null ? Number(v.price) : v.price,
      comparePrice: v.comparePrice != null ? Number(v.comparePrice) : v.comparePrice,
    }));
  }
  return b;
}

// Check if category columns exist in the books table
let _hasCategoryColumns = null;
async function hasCategoryColumns() {
  if (_hasCategoryColumns !== null) return _hasCategoryColumns;
  try {
    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM books LIKE 'categoryId'`;
    _hasCategoryColumns = columns.length > 0;
  } catch {
    _hasCategoryColumns = false;
  }
  return _hasCategoryColumns;
}

const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      genre,
      featured,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      format,
      category,
      subcategory,
    } = req.query;

    const skipNum = Math.max(0, (Number(page) || 1) - 1) * (Number(limit) || 12);
    const takeNum = Number(limit) || 12;

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
    if (category && catColumnsExist) {
      const catRecord = await prisma.category.findUnique({ where: { slug: String(category) } });
      if (catRecord) where.categoryId = catRecord.id;
      else where.categoryId = "___none___";
    }
    if (subcategory && catColumnsExist) {
      const subRecord = await prisma.category.findUnique({ where: { slug: String(subcategory) } });
      if (subRecord) where.subcategoryId = subRecord.id;
      else where.subcategoryId = "___none___";
    }
    if (featured === "true") where.featured = true;
    if (format) where.format = String(format);

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice && !isNaN(Number(minPrice))) where.price.gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) where.price.lte = Number(maxPrice);
    }

    const validSortFields = ["createdAt", "price", "rating", "sold", "title"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // Build include - only include category if columns exist
    const include = { genre: true, variations: true };
    if (catColumnsExist) {
      include.category = true;
    }

    const [rawBooks, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: skipNum,
        take: takeNum,
        orderBy: { [sortField]: sortOrder },
        include,
      }),
      prisma.book.count({ where }),
    ]);

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
    res.status(500).json({ 
      message: "Failed to load books", 
      debug: err.message,
      code: err.code,
    });
  }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const catColumnsExist = await hasCategoryColumns();
    const include = {
      genre: true,
      variations: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { reviews: true, wishlist: true } },
    };
    if (catColumnsExist) {
      include.category = true;
      include.subcategory = true;
    }

    const book = await prisma.book.findUnique({
      where: { id: req.params.id, isActive: true },
      include,
    });

    if (!book) throw new AppError("Book not found", 404);

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
      variations,
    } = req.body;

    const catColumnsExist = await hasCategoryColumns();
    const createData = {
        title,
        subtitle,
        author,
        description,
        shortDesc,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        coverImage,
        images,
        isbn,
        publisher,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        pages: pages ? Number(pages) : null,
        language: language || "English",
        format: format || "PHYSICAL",
        stock: Number(stock) || 0,
        featured: featured === true || featured === "true",
        genreId: genreId || null,
        tags,
        ...(variations && Array.isArray(variations) && variations.length > 0 && {
          variations: {
            create: variations.map((v) => ({
              attributes: v.attributes,
              price: Number(v.price),
              comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
              stock: Number(v.stock) || 0,
              sku: v.sku || null,
              image: v.image || null,
            })),
          },
        }),
    };
    if (catColumnsExist) {
      createData.categoryId = categoryId || null;
      createData.subcategoryId = subcategoryId || null;
    }

    const createInclude = { genre: true, variations: true };
    if (catColumnsExist) createInclude.category = true;

    const book = await prisma.book.create({
      data: createData,
      include: createInclude,
    });

    res.status(201).json({ message: "Book created", book });
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
    if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);
    const catColumnsExist = await hasCategoryColumns();
    if (catColumnsExist) {
      if (data.categoryId === "") data.categoryId = null;
      if (data.subcategoryId === "") data.subcategoryId = null;
    } else {
      delete data.categoryId;
      delete data.subcategoryId;
    }

    let updateData = { ...data };

    if (variations && Array.isArray(variations)) {
      updateData.variations = {
        deleteMany: {}, // The simplest way to update variations is to replace them
        create: variations.map((v) => ({
          attributes: v.attributes,
          price: Number(v.price),
          comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
          stock: Number(v.stock) || 0,
          sku: v.sku || null,
          image: v.image || null,
        })),
      };
    }

    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: updateData,
      include: catColumnsExist
        ? { genre: true, category: true, variations: true }
        : { genre: true, variations: true },
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
