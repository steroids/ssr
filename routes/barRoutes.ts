import {Router} from 'express';

const data = [
    {
        userId: 1,
        name: 'Vasiliy Pupkin',
        age: 18
    },
    {
        userId: 2,
        name: 'Petr Ivanov',
        age: 20
    }
]

const barRoutes = (router: Router) => {
    const barRouter: Router = Router();

    barRouter.get('/', (req, res) => {
        res.send(JSON.stringify(data))
    });

    router.use('/api/bar', barRouter);
};

export default barRoutes;
