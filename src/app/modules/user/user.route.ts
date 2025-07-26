import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserZodSchema } from "./user.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";



const router = Router()



router.post('/register' , validateRequest(createUserZodSchema), userController.createUser )
router.get('/all-users', checkAuth(...Object.values(Role)), userController.getAllUsers);
router.patch('/:id',checkAuth(...Object.values(Role)),userController.updateUser)





export const  userRoute = router