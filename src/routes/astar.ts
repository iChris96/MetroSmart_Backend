import { Router, Request, Response } from 'express'
import { astar_Controller } from '../controllers/astarController'


const router = Router();

router.route('/astar')
    .get(
        astar_Controller.getPage
    )
    .post(
        astar_Controller.algorithm.bind(astar_Controller)
    )
export default router;