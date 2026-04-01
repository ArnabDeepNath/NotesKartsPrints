const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { slug: "fiction" },
      update: {},
      create: { name: "Fiction", slug: "fiction", color: "#2997ff" },
    }),
    prisma.genre.upsert({
      where: { slug: "non-fiction" },
      update: {},
      create: { name: "Non-Fiction", slug: "non-fiction", color: "#f5a623" },
    }),
    prisma.genre.upsert({
      where: { slug: "mystery" },
      update: {},
      create: { name: "Mystery", slug: "mystery", color: "#bf5af2" },
    }),
    prisma.genre.upsert({
      where: { slug: "science" },
      update: {},
      create: { name: "Science", slug: "science", color: "#30d158" },
    }),
    prisma.genre.upsert({
      where: { slug: "history" },
      update: {},
      create: { name: "History", slug: "history", color: "#ff6961" },
    }),
    prisma.genre.upsert({
      where: { slug: "self-help" },
      update: {},
      create: { name: "Self Help", slug: "self-help", color: "#ffd60a" },
    }),
  ]);

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
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

  // Create sample books
  const sampleBooks = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      description:
        "A heartwarming and life-affirming story about all the choices that go into a life well lived. Between life and death there is a library, and within that library, the shelves go on forever.",
      shortDesc:
        "Between life and death there is a library with infinite possibilities.",
      price: 499,
      comparePrice: 699,
      featured: true,
      stock: 50,
      pages: 304,
      publisher: "Canongate Books",
      isbn: "9781786892737",
      genreId: genres[0].id,
      rating: 4.5,
      reviewCount: 2847,
      sold: 342,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/81tCtHFtOgL.jpg",
      tags: "bestseller,fiction,fantasy",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      description:
        "No matter your goals, Atomic Habits offers a proven framework for improving — every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
      shortDesc:
        "A proven framework for improving every day through tiny behavior changes.",
      price: 399,
      comparePrice: 599,
      featured: true,
      stock: 75,
      pages: 320,
      publisher: "Penguin Random House",
      isbn: "9780735211292",
      genreId: genres[5].id,
      rating: 4.8,
      reviewCount: 5234,
      sold: 891,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg",
      tags: "bestseller,productivity,habits",
    },
    {
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      description:
        'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution—a #1 international bestseller—that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be "human."',
      shortDesc:
        "A groundbreaking narrative of humanity's creation and evolution.",
      price: 549,
      comparePrice: 799,
      featured: true,
      stock: 40,
      pages: 443,
      publisher: "Harper Perennial",
      isbn: "9780062316097",
      genreId: genres[4].id,
      rating: 4.7,
      reviewCount: 8912,
      sold: 654,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/713jIoMO3UL.jpg",
      tags: "bestseller,history,anthropology",
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      description:
        "Paulo Coelho's masterpiece tells the magical story of Santiago, an Andalusian shepherd boy who yearns to travel in search of a worldly treasure as extravagant as any ever found.",
      shortDesc:
        "A magical story about following your dreams and listening to your heart.",
      price: 299,
      comparePrice: 399,
      stock: 100,
      pages: 197,
      publisher: "HarperOne",
      isbn: "9780062315007",
      genreId: genres[0].id,
      rating: 4.6,
      reviewCount: 12543,
      sold: 1203,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg",
      tags: "classic,fiction,philosophy",
    },
    {
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      description:
        "A landmark volume in science writing by one of the great minds of our time, Stephen Hawking's book explores such profound questions as: How did the universe begin and what made its start possible?",
      shortDesc:
        "Exploring the mysteries of the universe from black holes to the big bang.",
      price: 449,
      comparePrice: 599,
      stock: 30,
      pages: 212,
      publisher: "Bantam Books",
      isbn: "9780553380163",
      genreId: genres[3].id,
      rating: 4.7,
      reviewCount: 7832,
      sold: 423,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/A1xkFZX5k-L.jpg",
      tags: "science,physics,cosmology",
    },
    {
      title: "Gone Girl",
      author: "Gillian Flynn",
      description:
        "On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary. Presents are being wrapped and reservations are being made when Nick heads out to find his wife, returning home to discover the frontend door ajar.",
      shortDesc:
        "A chilling psychological thriller about marriage, deception, and identity.",
      price: 350,
      comparePrice: 499,
      stock: 60,
      pages: 422,
      publisher: "Crown Publishing Group",
      isbn: "9780307588371",
      genreId: genres[2].id,
      rating: 4.3,
      reviewCount: 4521,
      sold: 287,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41LqZEIJ+HL.jpg",
      tags: "thriller,mystery,psychological",
    },
  ];

  for (const book of sampleBooks) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: book,
    });
  }

  console.log("✅ Seed complete!");
  console.log(`👤 Admin: admin@basaklibrary.com | Password: Admin@123456`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
