import prisma from "../lib/prisma.js";

export const getAnalyticsData = async () => {
	try {
		const totalUsers = await prisma.user.count();
		const totalProducts = await prisma.product.count();

		// Calculate total sales count and total revenue
		const salesData = await prisma.order.aggregate({
			_count: {
				id: true
			},
			_sum: {
				totalAmount: true
			}
		});

		const totalSales = salesData._count.id;
		const totalRevenue = salesData._sum.totalAmount || 0;

		return {
			users: totalUsers,
			products: totalProducts,
			totalSales,
			totalRevenue,
		};
	} catch (error) {
		throw error;
	}
};

export const getDailySalesData = async (startDate, endDate) => {
	try {
		// Using raw query for date manipulation in PostgreSQL
		const dailySalesData = await prisma.$queryRaw`
            SELECT 
                TO_CHAR("createdAt", 'YYYY-MM-DD') as _id,
                COUNT(id) as sales,
                SUM("totalAmount") as revenue
            FROM orders
            WHERE "createdAt" >= ${new Date(startDate)} 
              AND "createdAt" <= ${new Date(endDate)}
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY _id ASC
        `;

		// Note: Prisma returns BigInt for count in raw queries sometimes, or just number.
		// Need to be careful mapping. TO_CHAR output is string.

		const dateArray = getDatesInRange(startDate, endDate);

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales ? Number(foundData.sales) : 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}
