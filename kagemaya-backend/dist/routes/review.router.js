"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// GET - Melihat daftar ulasan sebuah event
// Endpoint ini dapat diakses publik
router.get('/events/:id/reviews', review_controller_1.getEventReviews);
// POST - Mengirim rating dan ulasan event
// Hanya customer yang sudah login
router.post('/events/:id/reviews', auth_middleware_1.authenticateToken, (0, role_middleware_1.authorizeRoles)('CUSTOMER'), review_controller_1.createReview);
exports.default = router;
