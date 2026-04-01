const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// GET /api/books
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
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { author: { contains: search } },
          { tags: { contains: search } },
        ],
      }),
      ...(genre && { genre: { slug: genre } }),
      ...(featured === "true" && { featured: true }),
      ...(format && { format }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    };

    const validSortFields = ["createdAt", "price", "rating", "sold", "title"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortField]: sortOrder },
        include: {
          genre: { select: { id: true, name: true, slug: true, color: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);

    res.json({
      books,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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
      tags,
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
        tags,
      },
      include: { genre: true },
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

    if (data.price) data.price = Number(data.price);
    if (data.comparePrice) data.comparePrice = Number(data.comparePrice);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    if (data.pages) data.pages = Number(data.pages);
    if (data.featured !== undefined)
      data.featured = data.featured === true || data.featured === "true";
    if (data.publishedAt) data.publishedAt = new Date(data.publishedAt);

    const book = await prisma.book.update({
      where: { id: req.params.id },
      data,
      include: { genre: true },
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
