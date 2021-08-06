import {Router} from 'express';

const data = [
    {
        id: 1,
        title: 'Krasnoyarsk'
    },
    {
        id: 2,
        title: 'Abakan'
    },
    {
        id: 3,
        title: 'Tomsk'
    },
    {
        id: 4,
        title: 'Novokuznetsk'
    }
]

const fooRoutes = (router: Router) => {
    const fooRouter: Router = Router();

    fooRouter.get('/', (req, res) => {
        res.send(JSON.stringify(data))
    });

    router.use('/api/foo', fooRouter);
};

export default fooRoutes;
