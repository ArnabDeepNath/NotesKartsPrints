const router = require("express").Router();
const prisma = require("../config/prisma");
const { authenticate } = require("../middleware/auth");
const { requireUser } = require("../middleware/rbac");
const { AppError } = require("../middleware/errorHandler");

router.use(authenticate, requireUser);

// POST /api/wishlist/:bookId — toggle
router.post("/:bookId", async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const book = await prisma.book.findUnique({
      where: { id: bookId, isActive: true },
    });
    if (!book) throw new AppError("Book not found", 404);

    const existing = await prisma.wishlist.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { userId_bookId: { userId, bookId } },
      });
      return res.json({ message: "Removed from wishlist", inWishlist: false });
    }

    await prisma.wishlist.create({ data: { userId, bookId } });
    res.json({ message: "Added to wishlist", inWishlist: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/wishlist
router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { book: { include: { genre: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ wishlist: items.map((i) => ({ ...i.book, wishlisted: true })) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
