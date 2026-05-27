require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function readArg(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] || null;
}

function readPositionalArg(position) {
  const positionalArgs = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--"));

  return positionalArgs[position] || null;
}

async function main() {
  const email =
    readArg("--email") ||
    readPositionalArg(0) ||
    process.env.ADMIN_EMAIL ||
    "admin@basaklibrary.com";
  const password =
    readArg("--password") || readPositionalArg(1) || process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "Provide the new password with --password or ADMIN_PASSWORD.",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(`Admin user not found for ${email}.`);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  console.log(`Admin password reset for ${email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
