import express, {Request} from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import {join} from 'path';
import render, {ResponseWithRender} from './middlewares/render';

const port = Number(process.env.APP_SSR_PORT);
const host = process.env.APP_SSR_HOST;
const app = express();

app
    .disable('x-powered-by')
    .enable('trust proxy')
    .use(cookieParser())
    .use(compression())
    .use(express.static(join(process.env.APP_SSR_OUTPUT_PATH)))
    .use(render);

app.get('*', (req: Request, res: ResponseWithRender) => {
    const accessTokenMatch = (req.headers.cookie || '').match(/accessToken\s*=\s*(\w+)/);
    const accessToken = accessTokenMatch && accessTokenMatch[1] || null;

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
