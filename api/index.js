import app from "../backend/server.js";

app.get("/api/debug", (req, res) => {
    res.status(200).json({
        message: "API entry point reached",
        vercel: !!process.env.VERCEL,
        node_env: process.env.NODE_ENV
    });
});

export default app;
