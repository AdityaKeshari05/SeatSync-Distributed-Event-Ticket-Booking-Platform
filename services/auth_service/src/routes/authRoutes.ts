import { Router } from 'express';
import { signup, login } from '../controller/authController.js';

const router = Router();

router.route('/register').post(signup);
router.route('/login').post(login);

export default router;