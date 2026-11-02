"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventReviewsService = exports.createReviewService = exports.ReviewError = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
class ReviewError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ReviewError';
    }
}
exports.ReviewError = ReviewError;
// Membuat review setelah event selesai
const createReviewService = async (eventId, customerId, rating, comment) => {
    // Validasi rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ReviewError('Rating harus antara 1 sampai 5.', 400);
    }
    // Periksa keberadaan event
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw new ReviewError('Event tidak ditemukan.', 404);
    }
    // Event harus sudah selesai
    if (event.end_date.getTime() > Date.now()) {
        throw new ReviewError('Review hanya dapat diberikan setelah event selesai.', 403);
    }
    // Pengguna harus memiliki transaksi yang selesai
    const transaction = await prisma_1.prisma.transaction.findFirst({
        where: {
            event_id: eventId,
            customer_id: customerId,
            status: 'DONE',
        },
        orderBy: {
            created_at: 'desc',
        },
    });
    if (!transaction) {
        throw new ReviewError('Anda tidak memiliki transaksi selesai untuk event ini.', 403);
    }
    // Cegah review ganda untuk satu event
    const existingReview = await prisma_1.prisma.review.findUnique({
        where: {
            customer_id_event_id: {
                customer_id: customerId,
                event_id: eventId,
            },
        },
    });
    if (existingReview) {
        throw new ReviewError('Anda sudah memberikan review untuk event ini.', 409);
    }
    // Simpan review
    try {
        return await prisma_1.prisma.review.create({
            data: {
                event_id: eventId,
                customer_id: customerId,
                transaction_id: transaction.id,
                rating,
                comment: comment?.trim() || null,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true,
                    },
                },
            },
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002') {
            throw new ReviewError('Review untuk event ini sudah tersedia.', 409);
        }
        throw error;
    }
};
exports.createReviewService = createReviewService;
// Mengambil semua review berdasarkan event
const getEventReviewsService = async (eventId, page = 1, limit = 10) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true },
    });
    if (!event) {
        throw new ReviewError('Event tidak ditemukan.', 404);
    }
    const where = { event_id: eventId };
    const [reviews, summary] = await Promise.all([
        prisma_1.prisma.review.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.review.aggregate({
            where,
            _avg: { rating: true },
            _count: { _all: true },
        }),
    ]);
    const total = summary._count._all;
    return {
        reviews,
        summary: {
            total,
            average_rating: Math.round((summary._avg.rating ?? 0) * 10) / 10,
        },
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
exports.getEventReviewsService = getEventReviewsService;
