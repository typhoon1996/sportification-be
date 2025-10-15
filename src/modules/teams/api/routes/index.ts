import {Router} from "express";
import {teamController} from "../controllers/TeamController";
import {authenticate, authorize} from "../../../../shared/middleware/auth";
import {validateRequest} from "../../../../shared/middleware/validation";
import {
  createTeamValidation,
  updateTeamValidation,
  idParamValidation,
} from "../../../../shared/validators";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: Create a new team
 *     description: Create a sports team. Any authenticated user can create a team and becomes the team captain.
 *     tags:
 *       - Teams
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Team name
 *                 example: "Thunder Strikers"
 *               description:
 *                 type: string
 *                 description: Team description
 *                 example: "Competitive football team"
 *               sport:
 *                 type: string
 *                 description: Sport type
 *                 example: "football"
 *               maxMembers:
 *                 type: integer
 *                 minimum: 2
 *                 description: Maximum number of team members
 *                 example: 20
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether team requires approval to join
 *                 example: false
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Team created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/",
  createTeamValidation,
  validateRequest,
  teamController.createTeam
);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Get all teams
 *     description: Retrieve a paginated and filterable list of teams
 *     tags:
 *       - Teams
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
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in team names
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     teams:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Team'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", teamController.getTeams);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     description: Retrieve detailed information about a specific team
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  idParamValidation,
  validateRequest,
  teamController.getTeamById
);

/**
 * @swagger
 * /api/v1/teams/{id}/join:
 *   post:
 *     summary: Join a team
 *     description: Request to join a team. Auto-approved for public teams, requires captain approval for private teams.
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Successfully joined team or join request sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Successfully joined team"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Conflict - Already a member or team is full
 */
router.post(
  "/:id/join",
  idParamValidation,
  validateRequest,
  teamController.joinTeam
);

/**
 * @swagger
 * /api/v1/teams/{id}/leave:
 *   post:
 *     summary: Leave a team
 *     description: Leave a team. Team captain cannot leave unless they transfer captainship.
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Successfully left team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Successfully left team"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/leave",
  idParamValidation,
  validateRequest,
  teamController.leaveTeam
);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   put:
 *     summary: Update team
 *     description: Update team details. Only team captain can update.
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
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
 *                 description: Team name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Team description
 *               maxMembers:
 *                 type: integer
 *                 minimum: 2
 *                 description: Maximum number of members
 *               isPrivate:
 *                 type: boolean
 *                 description: Whether team requires approval to join
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     team:
 *                       $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Team updated successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  "/:id",
  idParamValidation,
  updateTeamValidation,
  validateRequest,
  teamController.updateTeam
);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   delete:
 *     summary: Delete team
 *     description: Delete a team. Only admins and moderators can delete teams.
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Team deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  idParamValidation,
  validateRequest,
  authorize(["admin", "moderator"]),
  teamController.deleteTeam
);

export default router;
