const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

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
    
    if (genre) where.genre = { slug: String(genre) };
    if (category) where.category = { slug: String(category) };
    if (subcategory) where.subcategory = { slug: String(subcategory) };
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

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: skipNum,
        take: takeNum,
        orderBy: { [sortField]: sortOrder },
        include: {
          genre: true,
          category: true,
          variations: true,
        },
      }),
      prisma.book.count({ where }),
    ]);

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
    next(err);
  }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        genre: true,
        category: true,
        subcategory: true,
        variations: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { reviews: true, wishlist: true } },
      },
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

    res.json({ book: { ...book, inWishlist } });
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

    const book = await prisma.book.create({
      data: {
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
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
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
      },
      include: { genre: true, category: true, variations: true },
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
    if (data.categoryId === "") data.categoryId = null;
    if (data.subcategoryId === "") data.subcategoryId = null;

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
      include: { genre: true, category: true, variations: true },
    });

    res.json({ message: "Book updated", book });
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
