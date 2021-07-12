import {Router} from 'express';
import fooRoutes from './fooRoutes';
import barRoutes from './barRoutes';

const router: Router = Router();

fooRoutes(router);
barRoutes(router)

export default router;
