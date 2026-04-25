const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function cleanBooks() {
  console.log("ðŸ§¹ Cleaning existing books and related data...");

  // Delete in dependency order to respect FK constraints
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.bookVariation.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("âœ… Cleanup complete.");
}

async function seed() {
  console.log("ðŸŒ± Seeding database...");

  // â”€â”€ Step 1: Clean existing books â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await cleanBooks();

  // â”€â”€ Step 2: Create genres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [
    neetPG,
    rapidRevision,
    btr,
    superSpeciality,
    usmle,
    bdsDental,
    mbbs,
    thesis,
  ] = await Promise.all([
    prisma.genre.create({ data: { name: "NEET PG", slug: "neet-pg", color: "#e47911" } }),
    prisma.genre.create({ data: { name: "Rapid Revision", slug: "rapid-revision", color: "#30d158" } }),
    prisma.genre.create({ data: { name: "BTR", slug: "btr", color: "#bf5af2" } }),
    prisma.genre.create({ data: { name: "Super Speciality", slug: "super-speciality", color: "#ff6961" } }),
    prisma.genre.create({ data: { name: "USMLE", slug: "usmle", color: "#2997ff" } }),
    prisma.genre.create({ data: { name: "BDS Dental", slug: "bds-dental", color: "#ffd60a" } }),
    prisma.genre.create({ data: { name: "MBBS", slug: "mbbs", color: "#34aadc" } }),
    prisma.genre.create({ data: { name: "Thesis & Research", slug: "thesis", color: "#5ac8fa" } }),
  ]);

  // â”€â”€ Step 3: Upsert admin user (preserved across re-seeds) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Step 4: Seed books (all fields match current Prisma schema) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const books = [
    // â”€â”€ NEET PG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "NEET PG Full Notes â€“ Medicine",
      subtitle: "Comprehensive Notes for NEET PG Aspirants",
      author: "Basak Notes Team",
      description:
        "Complete, exam-focused Medicine notes for NEET PG preparation. Covers all high-yield topics systematically with mnemonics, tables, and previous-year question analysis. Updated for the latest NEET PG pattern.",
      shortDesc: "Exam-ready Medicine notes for NEET PG with mnemonics and PYQ analysis.",
      price: 799,
      comparePrice: 1199,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BNPG-MED-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-15"),
      pages: 450,
      language: "English",
      format: "PHYSICAL",
      stock: 100,
      sold: 892,
      rating: 4.8,
      reviewCount: 512,
      featured: true,
      isActive: true,
      genreId: neetPG.id,
      tags: "neet-pg,medicine,internal-medicine,notes",
    },
    {
      title: "NEET PG Full Notes â€“ Surgery",
      subtitle: "High-Yield Surgery Notes for NEET PG",
      author: "Basak Notes Team",
      description:
        "Concise and comprehensive Surgery notes covering all major surgical topics for NEET PG. Includes important operative details, surgical anatomy, and targeted MCQ tips for maximum scores.",
      shortDesc: "High-yield Surgery notes with operative details and MCQ tips for NEET PG.",
      price: 749,
      comparePrice: 1099,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BNPG-SUR-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-15"),
      pages: 380,
      language: "English",
      format: "PHYSICAL",
      stock: 80,
      sold: 654,
      rating: 4.7,
      reviewCount: 388,
      featured: true,
      isActive: true,
      genreId: neetPG.id,
      tags: "neet-pg,surgery,notes,high-yield",
    },
    {
      title: "NEET PG Full Notes â€“ Pharmacology",
      subtitle: "Complete Pharmacology Notes for PG Entrance",
      author: "Basak Notes Team",
      description:
        "All-in-one Pharmacology notes designed for NEET PG and other PG entrance exams. Covers drug classes, mechanisms, side effects, and clinical pharmacology with easy-to-remember tables and flow charts.",
      shortDesc: "All-in-one Pharmacology notes with drug charts and clinical tips.",
      price: 699,
      comparePrice: 999,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BNPG-PHARM-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-15"),
      pages: 320,
      language: "English",
      format: "PHYSICAL",
      stock: 90,
      sold: 723,
      rating: 4.9,
      reviewCount: 431,
      featured: false,
      isActive: true,
      genreId: neetPG.id,
      tags: "neet-pg,pharmacology,drugs,notes",
    },

    // â”€â”€ Rapid Revision â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "Rapid Revision â€“ Pathology",
      subtitle: "Quick Review for NEET PG & NBE",
      author: "Basak Notes Team",
      description:
        "A focused rapid-revision guide for Pathology covering all major topics in a concise, point-by-point format. Perfect for last-minute exam preparation. Includes important pathological tables and recent advances.",
      shortDesc: "Quick-review Pathology guide perfect for last-minute NEET PG prep.",
      price: 499,
      comparePrice: 699,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BRRV-PATH-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-03-01"),
      pages: 220,
      language: "English",
      format: "PHYSICAL",
      stock: 120,
      sold: 981,
      rating: 4.8,
      reviewCount: 556,
      featured: true,
      isActive: true,
      genreId: rapidRevision.id,
      tags: "rapid-revision,pathology,neet-pg,quick-review",
    },
    {
      title: "Rapid Revision â€“ Pharmacology",
      subtitle: "Quick Review for NEET PG & NBE",
      author: "Basak Notes Team",
      description:
        "Rapid revision guide for Pharmacology focusing on high-yield exam topics. All drug classes covered in a structured table format with side effects, indications and contraindications highlighted for quick recall.",
      shortDesc: "Fast-track Pharmacology revision guide with drug tables for NEET PG.",
      price: 449,
      comparePrice: 649,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BRRV-PHARM-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-03-01"),
      pages: 190,
      language: "English",
      format: "PHYSICAL",
      stock: 110,
      sold: 812,
      rating: 4.7,
      reviewCount: 478,
      featured: false,
      isActive: true,
      genreId: rapidRevision.id,
      tags: "rapid-revision,pharmacology,neet-pg,quick-review",
    },

    // â”€â”€ BTR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "BTR Surgery Notes",
      subtitle: "Best Theory Revision for Surgery",
      author: "Basak Notes Team",
      description:
        "Best Theory Revision (BTR) Surgery notes crafted specifically for PG entrance exam aspirants. Covers all surgical conditions, investigations, and management protocols in exam-oriented language with margin notes.",
      shortDesc: "Exam-oriented BTR Surgery notes with management protocols.",
      price: 599,
      comparePrice: 899,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BBTR-SUR-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-02-10"),
      pages: 340,
      language: "English",
      format: "PHYSICAL",
      stock: 70,
      sold: 534,
      rating: 4.7,
      reviewCount: 312,
      featured: true,
      isActive: true,
      genreId: btr.id,
      tags: "btr,surgery,theory,revision",
    },
    {
      title: "BTR Anatomy Notes",
      subtitle: "Best Theory Revision for Anatomy",
      author: "Basak Notes Team",
      description:
        "Detailed BTR Anatomy notes covering gross anatomy, embryology, histology, and neuroanatomy for NEET PG and other PG entrance exams. Complete with labeled diagrams and memory aids.",
      shortDesc: "Comprehensive BTR Anatomy notes with diagrams and memory aids.",
      price: 649,
      comparePrice: 949,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BBTR-ANAT-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-02-10"),
      pages: 410,
      language: "English",
      format: "PHYSICAL",
      stock: 60,
      sold: 421,
      rating: 4.6,
      reviewCount: 267,
      featured: false,
      isActive: true,
      genreId: btr.id,
      tags: "btr,anatomy,diagrams,revision",
    },

    // â”€â”€ USMLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "USMLE Step 1 Notes â€“ Pathology",
      subtitle: "High-Yield Notes for USMLE Step 1",
      author: "Basak Notes Team",
      description:
        "Targeted USMLE Step 1 Pathology notes covering all high-yield disease mechanisms, lab findings, and clinical correlations. Aligned with the latest USMLE test specifications. Ideal for international medical graduates.",
      shortDesc: "High-yield USMLE Step 1 Pathology notes for IMGs and US medical students.",
      price: 1299,
      comparePrice: 1799,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BUSMLE-PATH-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-20"),
      pages: 480,
      language: "English",
      format: "PHYSICAL",
      stock: 50,
      sold: 345,
      rating: 4.8,
      reviewCount: 201,
      featured: true,
      isActive: true,
      genreId: usmle.id,
      tags: "usmle,step1,pathology,img",
    },

    // â”€â”€ BDS Dental â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "BDS Dental Notes â€“ Oral Medicine",
      subtitle: "Complete Notes for BDS & MDS Entrance",
      author: "Basak Notes Team",
      description:
        "Comprehensive Oral Medicine notes for BDS students and MDS entrance exam aspirants. Covers diagnosis, clinical features, investigations, and management of oral diseases with clinical photographs.",
      shortDesc: "Complete Oral Medicine notes for BDS final year and MDS entrance.",
      price: 599,
      comparePrice: 899,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BBDS-OM-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-02-20"),
      pages: 290,
      language: "English",
      format: "PHYSICAL",
      stock: 75,
      sold: 412,
      rating: 4.7,
      reviewCount: 234,
      featured: false,
      isActive: true,
      genreId: bdsDental.id,
      tags: "bds,dental,oral-medicine,mds",
    },
    {
      title: "BDS Dental Notes â€“ Conservative Dentistry",
      subtitle: "Complete Notes for BDS & MDS Entrance",
      author: "Basak Notes Team",
      description:
        "Structured Conservative Dentistry and Endodontics notes for BDS university exams and MDS entrance. Covers cavity preparation, pulp therapy, bleaching, and restorative procedures with step-by-step technique illustrations.",
      shortDesc: "Structured Conservative Dentistry and Endodontics notes for BDS/MDS.",
      price: 549,
      comparePrice: 849,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BBDS-CON-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-02-20"),
      pages: 260,
      language: "English",
      format: "PHYSICAL",
      stock: 65,
      sold: 376,
      rating: 4.6,
      reviewCount: 198,
      featured: false,
      isActive: true,
      genreId: bdsDental.id,
      tags: "bds,dental,conservative,endodontics",
    },

    // â”€â”€ MBBS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "MBBS Notes â€“ First Year Complete Package",
      subtitle: "Anatomy, Physiology & Biochemistry",
      author: "Basak Notes Team",
      description:
        "Complete MBBS First Year notes combining Anatomy, Physiology, and Biochemistry in a single package. Simplified for university exams with important diagrams, flowcharts, and university question banks.",
      shortDesc: "All-in-one MBBS First Year notes for Anatomy, Physiology, and Biochemistry.",
      price: 1499,
      comparePrice: 2199,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BMBBS-1ST-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-10"),
      pages: 680,
      language: "English",
      format: "PHYSICAL",
      stock: 150,
      sold: 1243,
      rating: 4.9,
      reviewCount: 789,
      featured: true,
      isActive: true,
      genreId: mbbs.id,
      tags: "mbbs,first-year,anatomy,physiology,biochemistry",
    },
    {
      title: "MBBS Notes â€“ Clinical Skills & Case Studies",
      subtitle: "Practical Skills for Clinical Rotations",
      author: "Basak Notes Team",
      description:
        "Essential clinical skills guide for MBBS students entering clinical postings. Covers history taking, physical examination, clinical procedures, and common case presentations for wards and OSCE exams.",
      shortDesc: "Clinical skills guide for MBBS students covering history, examination, and OSCEs.",
      price: 399,
      comparePrice: 599,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BMBBS-CLIN-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-01-10"),
      pages: 310,
      language: "English",
      format: "PHYSICAL",
      stock: 130,
      sold: 945,
      rating: 4.7,
      reviewCount: 567,
      featured: false,
      isActive: true,
      genreId: mbbs.id,
      tags: "mbbs,clinical,osce,skills",
    },

    // â”€â”€ Super Speciality â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      title: "Super Speciality Notes â€“ Cardiology",
      subtitle: "MCh / DM Cardiology Entrance Prep",
      author: "Basak Notes Team",
      description:
        "High-yield Cardiology notes for DM Cardiology entrance exams. Covers ECG interpretation, valvular heart disease, heart failure, arrhythmias, interventional cardiology, and recent advances in clinical cardiology.",
      shortDesc: "High-yield DM Cardiology entrance notes covering ECG, heart failure, and interventions.",
      price: 999,
      comparePrice: 1499,
      coverImage: "https://images-na.ssl-images-amazon.com/images/I/71qkMm7QPZL.jpg",
      isbn: "BSS-CARDIO-001",
      publisher: "Basak Notes Publications",
      publishedAt: new Date("2024-03-15"),
      pages: 520,
      language: "English",
      format: "PHYSICAL",
      stock: 40,
      sold: 287,
      rating: 4.8,
      reviewCount: 167,
      featured: false,
      isActive: true,
      genreId: superSpeciality.id,
      tags: "super-speciality,cardiology,dm,mch",
    },
  ];

  await prisma.book.createMany({ data: books });
  const bookCount = await prisma.book.count();

  console.log(`âœ… Seed complete! Created ${bookCount} books.`);
  console.log(`ðŸ‘¤ Admin: admin@basaklibrary.com | Password: Admin@123456`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
