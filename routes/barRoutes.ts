import {Router} from 'express';

const data = {
    user: {
        name: 'Ivan Ivanov',
        email: 'ivanov@mail.ru'
    },
}

const barRoutes = (router: Router) => {
    const barRouter: Router = Router();

    barRouter.get('/', (req, res) => {
        res.send(JSON.stringify(data))
    });

    router.use('/api/bar', barRouter);
};

export default barRoutes;
