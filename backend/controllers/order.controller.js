import prisma from "../lib/prisma.js";

export const getCustomerOrderHistory = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id },
            include: {
                orderItems: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform structure to match frontend expectation (embedded products array via populate)
        // Original: orders.products.product (populated)
        // Prisma: orders.orderItems.product (included)
        // We need to map `orderItems` to `products` structure if frontend expects it, or keep it as `products` field in JSON.
        // Original Mongoose model had `products` array embedded. Controller returned `orders`.
        // Frontend likely iterates `order.products`.

        const formattedOrders = orders.map(order => ({
            ...order,
            products: order.orderItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            }))
        }));

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No orders found for this user",
            });
        }
        res.json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        console.error("Error in getCustomerOrderHistory controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const requestOrderReturn = async (req, res) => {
    const { form, selectedOrder } = req.body;
    try {
        const order = await prisma.order.findUnique({ where: { id: selectedOrder } });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: "You are not authorized to return this order" });
        }

        await prisma.order.update({
            where: { id: selectedOrder },
            data: {
                returnReason: form.reason,
                returnDescription: form.description || '',
                returnRequestedAt: new Date(),
                returnStatus: 'Requested',
                isReturnRequested: true
            }
        });

        res.status(200).json({ success: true, message: "Return request submitted successfully" });
    } catch (error) {
        console.error("Error in requestOrderReturn controller", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

export const orderReturnAction = async (req, res) => {
    // This function was updating Product.status but Product has no status field.
    // Commenting out for migration.

    /*
    const { pid, action } = req.body;
    if (!pid || !action) { ... }
    try {
        const result = await Product.updateOne({ _id: pid }, { status: action });
        ...
    } ...
    */
    return res.status(501).json({ success: false, msg: "Feature not implemented in migration" });
}

export const getOrderReturnHistory = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { isReturnRequested: true },
            include: {
                user: { select: { name: true, email: true } },
                orderItems: { include: { product: true } }
            }
        });

        const formattedOrders = orders.map(order => ({
            ...order,
            products: order.orderItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            })),
            returnRequest: { // Mimic old structure for frontend compatibility
                status: order.returnStatus,
                reason: order.returnReason,
                description: order.returnDescription,
                return: order.isReturnRequested
            }
        }));

        res.json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        console.error("Error in getOrderReturnHistory controller", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

export const showAllOrders = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    try {
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true, email: true } },
                    orderItems: { include: { product: true } }
                }
            }),
            prisma.order.count()
        ]);

        const formattedOrders = orders.map(order => ({
            ...order,
            products: order.orderItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price
            }))
        }));

        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({
            orders: formattedOrders,
            totalPages: totalPages
        });
    } catch (error) {
        console.error("Error in showAllOrders controller", error.message);
        return res.status(500).json({});
    }
}

export const orderReturnStatusChange = async (req, res) => {
    // Original extracted orderId from params but route param is likely :orderId
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid order ID and status"
        });
    }

    try {
        // status enum check? status is ReturnStatus enum in Prisma
        // Frontend sends string. Prisma should handle if it matches enum values.

        await prisma.order.update({
            where: { id: orderId },
            data: { returnStatus: status }
        });

        res.json({ success: true, msg: "Return request status updated successfully" });
    } catch (error) {
        console.error("Error in orderReturnStatusChange controller", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}

export const changeOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({
            success: false,
            msg: "Please provide a valid order ID and status"
        });
    }

    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: status }
        });

        return res.status(200).json({
            success: true,
            msg: "Order status updated successfully"
        });

    } catch (error) {
        console.error("Error in changeOrderStatus controller", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
}