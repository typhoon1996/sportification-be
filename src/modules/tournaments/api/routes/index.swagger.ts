/**
 * SWAGGER DOCUMENTATION FOR TOURNAMENTS ROUTES
 * This file contains all the Swagger/OpenAPI documentation for tournament endpoints
 * Copy these JSDoc comments above the corresponding route definitions in index.ts
 */

/**
 * @swagger
 * /tournaments:
 *   post:
 *     summary: Create a new tournament
 *     description: Create a new tournament with specified details (Any authenticated user)
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sport
 *               - format
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Summer Championship 2025
 *               sport:
 *                 type: string
 *                 example: football
 *               format:
 *                 type: string
 *                 enum: [single-elimination, double-elimination, round-robin, group-stage]
 *                 example: single-elimination
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Annual summer football tournament
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-07-01T10:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-07-15T18:00:00Z
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 128
 *                 example: 16
 *               venue:
 *                 type: string
 *                 description: Venue ID
 *               rules:
 *                 type: object
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournament created successfully
 *               data:
 *                 tournament:
 *                   id: 507f1f77bcf86cd799439011
 *                   name: Summer Championship 2025
 *                   sport: football
 *                   format: single-elimination
 *                   status: upcoming
 *                   participants: []
 *                   bracket: {}
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /tournaments:
 *   get:
 *     summary: Get all tournaments
 *     description: Retrieve a paginated list of tournaments with optional filters
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter by tournament status
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [single-elimination, double-elimination, round-robin, group-stage]
 *         description: Filter by tournament format
 *     responses:
 *       200:
 *         description: Tournaments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournaments retrieved successfully
 *               data:
 *                 tournaments:
 *                   - id: 507f1f77bcf86cd799439011
 *                     name: Summer Championship 2025
 *                     sport: football
 *                     status: upcoming
 *               meta:
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   pages: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: Get tournament by ID
 *     description: Retrieve detailed information about a specific tournament including bracket
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournament retrieved successfully
 *               data:
 *                 tournament:
 *                   id: 507f1f77bcf86cd799439011
 *                   name: Summer Championship 2025
 *                   sport: football
 *                   format: single-elimination
 *                   status: ongoing
 *                   participants: []
 *                   bracket: {}
 *                   standings: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tournaments/{id}/join:
 *   post:
 *     summary: Join a tournament
 *     description: Register the authenticated user as a participant in the tournament
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Joined tournament successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Joined tournament successfully
 *               data:
 *                 tournament:
 *                   id: 507f1f77bcf86cd799439011
 *                   participants:
 *                     - 507f1f77bcf86cd799439012
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @swagger
 * /tournaments/{id}/leave:
 *   post:
 *     summary: Leave a tournament
 *     description: Remove the authenticated user from tournament participants
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Left tournament successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Left tournament successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tournaments/{id}/start:
 *   put:
 *     summary: Start a tournament
 *     description: Initialize tournament bracket and start the tournament (Creator only)
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournament started successfully
 *               data:
 *                 tournament:
 *                   id: 507f1f77bcf86cd799439011
 *                   status: ongoing
 *                   bracket:
 *                     rounds: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @swagger
 * /tournaments/{id}:
 *   put:
 *     summary: Update tournament
 *     description: Update tournament details (Creator only)
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed, cancelled]
 *               rules:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournament updated successfully
 *               data:
 *                 tournament:
 *                   id: 507f1f77bcf86cd799439011
 *                   name: Updated Tournament Name
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /tournaments/{id}:
 *   delete:
 *     summary: Delete a tournament
 *     description: Delete a tournament (Admin/Moderator only)
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tournament deleted successfully
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
