import express, {NextFunction, Request} from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import {join} from 'path';
import render, {ResponseWithRender} from './middlewares/render';
import {ignoreFavicon} from './middlewares';

const port = Number(process.env.APP_SSR_PORT);
const host = process.env.APP_SSR_HOST;
const app = express();

app
    .disable('x-powered-by')
    .enable('trust proxy')
    .use(cookieParser())
    .use(compression())
    .use(express.static(join(process.env.APP_SSR_OUTPUT_PATH)))
    .use(ignoreFavicon)
    .use(render)

app.get('*', (req: Request, res: ResponseWithRender) => {
    res.renderBundle();
});

// @ts-ignore
app.listen(port, host, (err) => {
    if (err) {
        console.error(err)
    } else {
        console.log(`Listening at http://${host}:${port}`);
    }
})
