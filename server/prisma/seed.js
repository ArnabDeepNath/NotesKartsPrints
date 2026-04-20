const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function cleanBooks() {
  console.log("🧹 Cleaning existing books and related data...");

  // Delete in dependency order to respect FK constraints
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.bookVariation.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("✅ Cleanup complete.");
}

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Step 1: Clean existing books ─────────────────────────────────────────
  await cleanBooks();

  // ── Step 2: Create genres ──────────────────────────────────────────────────
  const [
    fiction,
    nonFiction,
    mystery,
    science,
    history,
    selfHelp,
    academic,
    technology,
  ] = await Promise.all([
    prisma.genre.create({
      data: { name: "Fiction", slug: "fiction", color: "#2997ff" },
    }),
    prisma.genre.create({
      data: { name: "Non-Fiction", slug: "non-fiction", color: "#f5a623" },
    }),
    prisma.genre.create({
      data: { name: "Mystery", slug: "mystery", color: "#bf5af2" },
    }),
    prisma.genre.create({
      data: { name: "Science", slug: "science", color: "#30d158" },
    }),
    prisma.genre.create({
      data: { name: "History", slug: "history", color: "#ff6961" },
    }),
    prisma.genre.create({
      data: { name: "Self Help", slug: "self-help", color: "#ffd60a" },
    }),
    prisma.genre.create({
      data: { name: "Academic", slug: "academic", color: "#34aadc" },
    }),
    prisma.genre.create({
      data: { name: "Technology", slug: "technology", color: "#5ac8fa" },
    }),
  ]);

  const genres = [
    fiction,
    nonFiction,
    mystery,
    science,
    history,
    selfHelp,
    academic,
    technology,
  ];

  // ── Step 3: Upsert admin user (preserved across re-seeds) ────────────────
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@basaklibrary.com" },
    update: {},
    create: {
      email: "admin@basaklibrary.com",
      password: adminPassword,
      name: "Basak Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  // ── Step 4: Seed books (all fields match current Prisma schema) ───────────
  const books = [
    // ── Fiction ──────────────────────────────────────────────────────────────
    {
      title: "The Midnight Library",
      subtitle: "A Novel",
      author: "Matt Haig",
      description:
        "A heartwarming and life-affirming story about all the choices that go into a life well lived. Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
      shortDesc:
        "Between life and death there is a library with infinite possibilities.",
      price: 499,
      comparePrice: 699,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/81tCtHFtOgL.jpg",
      isbn: "9781786892737",
      publisher: "Canongate Books",
      publishedAt: new Date("2020-08-13"),
      pages: 304,
      language: "English",
      format: "PHYSICAL",
      stock: 50,
      sold: 342,
      rating: 4.5,
      reviewCount: 2847,
      featured: true,
      isActive: true,
      genreId: fiction.id,
      tags: "bestseller,fiction,fantasy,life",
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      description:
        "Paulo Coelho's masterpiece tells the magical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure. His journey teaches him that the treasure he seeks is closer than he ever imagined.",
      shortDesc:
        "A magical story about following your dreams and listening to your heart.",
      price: 299,
      comparePrice: 399,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg",
      isbn: "9780062315007",
      publisher: "HarperOne",
      publishedAt: new Date("1988-01-01"),
      pages: 197,
      language: "English",
      format: "PHYSICAL",
      stock: 100,
      sold: 1203,
      rating: 4.6,
      reviewCount: 12543,
      featured: true,
      isActive: true,
      genreId: fiction.id,
      tags: "classic,fiction,philosophy,inspiration",
    },
    {
      title: "Gone Girl",
      author: "Gillian Flynn",
      description:
        "On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary. When Nick returns home to find Amy gone, he becomes the prime suspect in her disappearance. A chilling story of lies, manipulation, and the dark side of marriage.",
      shortDesc:
        "A chilling psychological thriller about marriage, deception, and identity.",
      price: 350,
      comparePrice: 499,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41LqZEIJ+HL.jpg",
      isbn: "9780307588371",
      publisher: "Crown Publishing Group",
      publishedAt: new Date("2012-06-05"),
      pages: 422,
      language: "English",
      format: "PHYSICAL",
      stock: 60,
      sold: 287,
      rating: 4.3,
      reviewCount: 4521,
      featured: false,
      isActive: true,
      genreId: mystery.id,
      tags: "thriller,mystery,psychological,suspense",
    },

    // ── Non-Fiction / Self-Help ───────────────────────────────────────────────
    {
      title: "Atomic Habits",
      subtitle: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
      author: "James Clear",
      description:
        "No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results. If you're having trouble changing your habits, the problem isn't you — it's your system.",
      shortDesc:
        "A proven framework for improving every day through tiny behavior changes.",
      price: 399,
      comparePrice: 599,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg",
      isbn: "9780735211292",
      publisher: "Penguin Random House",
      publishedAt: new Date("2018-10-16"),
      pages: 320,
      language: "English",
      format: "PHYSICAL",
      stock: 75,
      sold: 891,
      rating: 4.8,
      reviewCount: 5234,
      featured: true,
      isActive: true,
      genreId: selfHelp.id,
      tags: "bestseller,productivity,habits,self-improvement",
    },
    {
      title: "Think and Grow Rich",
      author: "Napoleon Hill",
      description:
        "The landmark bestseller now revised and updated for the 21st century. Based on Napoleon Hill's research into the mindsets of over 500 self-made millionaires, this classic teaches the thirteen steps to achieving success. Mandatory reading for anyone serious about personal achievement.",
      shortDesc:
        "The timeless classic on achieving success through the power of thought.",
      price: 249,
      comparePrice: 349,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/71UypkUjStL.jpg",
      isbn: "9781585424337",
      publisher: "Tarcher Perigee",
      publishedAt: new Date("1937-01-01"),
      pages: 320,
      language: "English",
      format: "PHYSICAL",
      stock: 80,
      sold: 654,
      rating: 4.5,
      reviewCount: 9871,
      featured: false,
      isActive: true,
      genreId: selfHelp.id,
      tags: "classic,success,motivation,finance",
    },

    // ── Science / History ─────────────────────────────────────────────────────
    {
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      description:
        "From a renowned historian comes a groundbreaking narrative of humanity's creation and evolution. Harari explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be human. From the Stone Age to the 21st century, a sweeping history of our species.",
      shortDesc:
        "A groundbreaking narrative of humanity's creation and evolution.",
      price: 549,
      comparePrice: 799,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg",
      isbn: "9780062316097",
      publisher: "Harper Perennial",
      publishedAt: new Date("2015-02-10"),
      pages: 443,
      language: "English",
      format: "PHYSICAL",
      stock: 40,
      sold: 654,
      rating: 4.7,
      reviewCount: 8912,
      featured: true,
      isActive: true,
      genreId: history.id,
      tags: "bestseller,history,anthropology,evolution",
    },
    {
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      description:
        "A landmark volume in science writing by one of the great minds of our time, Stephen Hawking's book explores such profound questions as: How did the universe begin—and what made its start possible? Does time always flow forward? Is the universe unending—or are there boundaries? Are there other dimensions in space? What will happen when it all ends?",
      shortDesc:
        "Exploring the mysteries of the universe from black holes to the big bang.",
      price: 449,
      comparePrice: 599,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/A1xkFZX5k-L.jpg",
      isbn: "9780553380163",
      publisher: "Bantam Books",
      publishedAt: new Date("1988-04-01"),
      pages: 212,
      language: "English",
      format: "PHYSICAL",
      stock: 30,
      sold: 423,
      rating: 4.7,
      reviewCount: 7832,
      featured: false,
      isActive: true,
      genreId: science.id,
      tags: "science,physics,cosmology,hawking",
    },

    // ── Academic / Technology ─────────────────────────────────────────────────
    {
      title: "Introduction to Algorithms",
      subtitle: "Fourth Edition",
      author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest",
      description:
        "The latest edition of the essential text and professional reference, with substantial new material on such topics as van Emde Boas trees, multithreaded algorithms, dynamic programming, and edge-based flow. The definitive resource for any student serious about computer science.",
      shortDesc:
        "The definitive textbook on algorithms for students and professionals.",
      price: 1299,
      comparePrice: 1999,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/61Pgdn8Ys-L.jpg",
      isbn: "9780262046305",
      publisher: "MIT Press",
      publishedAt: new Date("2022-04-05"),
      pages: 1312,
      language: "English",
      format: "PHYSICAL",
      stock: 20,
      sold: 156,
      rating: 4.6,
      reviewCount: 3241,
      featured: true,
      isActive: true,
      genreId: academic.id,
      tags: "algorithms,computer-science,textbook,programming",
    },
    {
      title: "Clean Code",
      subtitle: "A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      description:
        "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way. Noted software expert Robert C. Martin presents a revolutionary paradigm with Clean Code.",
      shortDesc: "A handbook for writing readable, maintainable software code.",
      price: 799,
      comparePrice: 999,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL.jpg",
      isbn: "9780132350884",
      publisher: "Prentice Hall",
      publishedAt: new Date("2008-08-01"),
      pages: 431,
      language: "English",
      format: "PHYSICAL",
      stock: 35,
      sold: 312,
      rating: 4.7,
      reviewCount: 6789,
      featured: false,
      isActive: true,
      genreId: technology.id,
      tags: "programming,software,clean-code,best-practices",
    },
    {
      title: "The Pragmatic Programmer",
      subtitle: "Your Journey to Mastery, 20th Anniversary Edition",
      author: "David Thomas, Andrew Hunt",
      description:
        "The Pragmatic Programmer is one of those rare tech books you'll read, re-read, and read again over the years. Whether you're new to the field or an experienced practitioner, you'll come away with fresh insights each and every time. Dave Thomas and Andy Hunt wrote the first edition of this influential book in 1999 to help their clients create better software.",
      shortDesc:
        "A timeless guide to becoming a more effective software developer.",
      price: 749,
      comparePrice: 999,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/71f743sOPoL.jpg",
      isbn: "9780135957059",
      publisher: "Addison-Wesley Professional",
      publishedAt: new Date("2019-09-13"),
      pages: 352,
      language: "English",
      format: "PHYSICAL",
      stock: 25,
      sold: 198,
      rating: 4.8,
      reviewCount: 4102,
      featured: false,
      isActive: true,
      genreId: technology.id,
      tags: "programming,software,career,best-practices",
    },
    {
      title: "Wings of Fire",
      subtitle: "An Autobiography",
      author: "A.P.J. Abdul Kalam",
      description:
        "Wings of Fire is the autobiography of A.P.J. Abdul Kalam, one of India's most beloved scientists and the 11th President of India. He recounts his early life, effort, hardship, and rare opportunities that shaped him into a world-class aerospace engineer and the father of India's missile programme.",
      shortDesc:
        "The inspiring autobiography of India's beloved scientist-president.",
      price: 199,
      comparePrice: 299,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/81HGJiib5BL.jpg",
      isbn: "9788173711466",
      publisher: "Universities Press",
      publishedAt: new Date("1999-01-01"),
      pages: 196,
      language: "English",
      format: "PHYSICAL",
      stock: 120,
      sold: 2341,
      rating: 4.9,
      reviewCount: 18923,
      featured: true,
      isActive: true,
      genreId: nonFiction.id,
      tags: "india,biography,inspiration,kalam,science",
    },
  ];

  await prisma.book.createMany({ data: books });
  const bookCount = await prisma.book.count();

  console.log(`✅ Seed complete! Created ${bookCount} books.`);
  console.log(`👤 Admin: admin@basaklibrary.com | Password: Admin@123456`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
