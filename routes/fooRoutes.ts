import {Router} from 'express';

const data = ['Krasnoyarsk', 'Abakan', 'Tomsk', 'Novokuznetsk']

const fooRoutes = (router: Router) => {
    const fooRouter: Router = Router();

    fooRouter.get('/', (req, res) => {
        res.send(JSON.stringify(data))
    });

    router.use('/api/foo', fooRouter);
};

export default fooRoutes;
