import {NextFunction, Request} from 'express';
import {ResponseWithRender} from './render';

export default (req: Request, res: ResponseWithRender, next: NextFunction) => {
    if (req.originalUrl.includes('favicon.ico')) {
        res.status(204).end()
        return;
    }
    next();
}
