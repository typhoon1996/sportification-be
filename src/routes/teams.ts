import { Router } from 'express';
import { TeamController } from '../controllers/TeamController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createTeamValidation,
  updateTeamValidation,
  updateMemberRoleValidation,
  transferCaptaincyValidation,
  teamQueryValidation,
  idParamValidation
} from '../validators';

const router = Router();

/**
 * @swagger
 * /api/v1/teams:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               sport:
 *                 type: string
 *               maxMembers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 50
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createTeamValidation, validate, TeamController.createTeam);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: Get all teams with optional filters
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search teams by name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 */
router.get('/', teamQueryValidation, validate, TeamController.getTeams);

/**
 * @swagger
 * /api/v1/teams/my/teams:
 *   get:
 *     summary: Get teams for authenticated user
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User teams retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my/teams', authenticate, TeamController.getMyTeams);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   get:
 *     summary: Get a specific team by ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *       404:
 *         description: Team not found
 */
router.get('/:id', idParamValidation, validate, TeamController.getTeam);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   patch:
 *     summary: Update team information (captain only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sport:
 *                 type: string
 *               maxMembers:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only captain can update team
 *       404:
 *         description: Team not found
 */
router.patch('/:id', authenticate, idParamValidation, updateTeamValidation, validate, TeamController.updateTeam);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   delete:
 *     summary: Delete team (captain only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only captain can delete team
 *       404:
 *         description: Team not found
 */
router.delete('/:id', authenticate, idParamValidation, validate, TeamController.deleteTeam);

/**
 * @swagger
 * /api/v1/teams/{id}/join:
 *   post:
 *     summary: Join a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully joined team
 *       400:
 *         description: Bad request (team full, already member, etc.)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team not found
 */
router.post('/:id/join', authenticate, idParamValidation, validate, TeamController.joinTeam);

/**
 * @swagger
 * /api/v1/teams/{id}/leave:
 *   post:
 *     summary: Leave a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left team
 *       400:
 *         description: Bad request (not a member, captain cannot leave)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team not found
 */
router.post('/:id/leave', authenticate, idParamValidation, validate, TeamController.leaveTeam);

/**
 * @swagger
 * /api/v1/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from team (captain only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only captain can remove members
 *       404:
 *         description: Team not found
 */
router.delete('/:id/members/:userId', authenticate, idParamValidation, validate, TeamController.removeMember);

/**
 * @swagger
 * /api/v1/teams/{id}/members/{userId}/role:
 *   patch:
 *     summary: Update member role (captain only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [captain, player]
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only captain can update roles
 *       404:
 *         description: Team not found
 */
router.patch('/:id/members/:userId/role', authenticate, idParamValidation, updateMemberRoleValidation, validate, TeamController.updateMemberRole);

/**
 * @swagger
 * /api/v1/teams/{id}/transfer-captaincy:
 *   post:
 *     summary: Transfer captaincy to another member (captain only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newCaptainId
 *             properties:
 *               newCaptainId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Captaincy transferred successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only captain can transfer captaincy
 *       404:
 *         description: Team not found
 */
router.post('/:id/transfer-captaincy', authenticate, idParamValidation, transferCaptaincyValidation, validate, TeamController.transferCaptaincy);

export default router;
