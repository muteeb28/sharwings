import "dotenv/config";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const { PrismaClient } = prismaPkg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    // clear existing data
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.user.deleteMany();

    // Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const admin = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@example.com",
            password: hashedPassword,
            role: "admin",
        },
    });

    console.log("Created Admin:", admin.email);

    // Create Customer User
    const customer = await prisma.user.create({
        data: {
            name: "John Doe",
            email: "john@example.com",
            password: hashedPassword,
            role: "customer",
        },
    });

    console.log("Created Customer:", customer.email);

    // Create Products
    const products = [
        {
            name: "Ceiling Fan",
            description: "Energy-efficient ceiling fan with silent operation.",
            price: 199.99,
            salePrice: 149.99,
            image: "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=800&q=80",
            category: "fans",
            quantity: 50,
            isFeatured: true
        },
        {
            name: "Modular Switch Set",
            description: "Premium switches and sockets with a clean matte finish.",
            price: 59.99,
            salePrice: 49.99,
            image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800&q=80",
            category: "switches-and-sockets",
            quantity: 80,
            isFeatured: true
        },
        {
            name: "LED Bulb Pack",
            description: "Bright, long-lasting LED bulbs for every room.",
            price: 29.99,
            salePrice: 19.99,
            image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
            category: "ledlights",
            quantity: 120,
            isFeatured: false
        },
        {
            name: "Copper Wire Roll",
            description: "High-quality copper wiring for reliable installations.",
            price: 89.99,
            salePrice: 69.99,
            image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80",
            category: "wires",
            quantity: 40,
            isFeatured: false
        }
    ];

    for (const product of products) {
        await prisma.product.create({ data: product });
    }

    console.log(`Created ${products.length} products`);

    // Create Coupon
    await prisma.coupon.create({
        data: {
            code: "WELCOME10",
            discountPercentage: 10,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            userId: admin.id, // Associated with admin or generic? Schema says userId is required. Assuming admin created it.
            isActive: true
        }
    });

    console.log("Created coupon: WELCOME10");

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
