"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventReviews = exports.createReview = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const review_service_1 = require("../services/review.service");
// Validasi input rating dan komentar
const reviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().max(1000).nullable().optional(),
}).strict();
// Penanganan error Review API
const handleReviewError = (error, res) => {
    if (error instanceof review_service_1.ReviewError) {
        return (0, response_1.errorResponse)(res, error.message, error.statusCode);
    }
    console.error('Review API Error:', error);
    return (0, response_1.errorResponse)(res, 'Terjadi kesalahan pada server.', 500);
};
// POST /api/events/:id/reviews
const createReview = async (req, res) => {
    const validation = reviewSchema.safeParse(req.body);
    if (!validation.success) {
        return (0, response_1.errorResponse)(res, 'Rating harus 1-5 dan komentar maksimal 1000 karakter.', 400);
    }
    if (!req.user) {
        return (0, response_1.errorResponse)(res, 'Silakan login terlebih dahulu.', 401);
    }
    try {
        const review = await (0, review_service_1.createReviewService)(req.params.id, req.user.id, validation.data.rating, validation.data.comment);
        return (0, response_1.successResponse)(res, 'Review berhasil dikirim.', review, 201);
    }
    catch (error) {
        return handleReviewError(error, res);
    }
};
exports.createReview = createReview;
// GET /api/events/:id/reviews
const getEventReviews = async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    if (!Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 50) {
        return (0, response_1.errorResponse)(res, 'Parameter page atau limit tidak valid.', 400);
    }
    try {
        const result = await (0, review_service_1.getEventReviewsService)(req.params.id, page, limit);
        return (0, response_1.successResponse)(res, 'Daftar review berhasil diambil.', {
            reviews: result.reviews,
            summary: result.summary,
        }, 200, result.pagination);
    }
    catch (error) {
        return handleReviewError(error, res);
    }
};
exports.getEventReviews = getEventReviews;
