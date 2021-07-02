import * as React from 'react';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import {NextFunction, Request, Response} from 'express';
import {StaticRouterContext} from 'react-router';
import {Helmet, HelmetData} from 'react-helmet';
import {ComponentsProvider, SsrProvider} from '@steroidsjs/core/providers';
import {initStore, getComponents, getHistory, getAssets, getHelmetComponent} from '../utils';

export interface ResponseWithRender extends Response {
    renderBundle: () => void;
}

interface IHTMLParams {
    bundleHTML: string,
    helmet: HelmetData,
    store: any
}

const getHTML = ({bundleHTML, store, helmet}: IHTMLParams): string => {
    const stats = getAssets(require('_SsrStats'));

    const html = renderToStaticMarkup(
        <html>
            <head>
                <meta charSet='utf-8'/>
                <meta name='viewport' content='width=device-width, initial-scale=1'/>
                {['base', 'title', 'meta', 'link', 'style', 'script'].map(tagName => getHelmetComponent(helmet, tagName))}
                {stats.css.map((path, index) => (
                    <link key={index} href={`/${path}`} rel='stylesheet'/>
                ))}
            </head>
            <body>
                <noscript>You need to enable JavaScript to run this app.</noscript>
                {getHelmetComponent(helmet, 'noscript')}
                <div id='root' dangerouslySetInnerHTML={{__html: bundleHTML}}/>
                <script dangerouslySetInnerHTML={{
                    __html: `window.__PRELOADED_STATE__ = ${JSON.stringify(store)}`
                }}/>
                {stats.js.map((path, index) => (
                    <script key={index} src={`/${path}`}/>
                ))}
            </body>
        </html>
    );

    return `<!doctype html>${html}`;
};

export default (req: Request, res: ResponseWithRender, next: NextFunction) => {
    res.renderBundle = () => {
        const {default: Application, config: appConfig} = require('_SsrApplication');
        if (!appConfig) {
            throw new Error(`Please save application's config in variable and export it from _SsrApplication`);
        }

        const history = getHistory(req.url);
        const components = getComponents(appConfig, {req, res, history});
        const context: StaticRouterContext = {};

        initStore(components.store, {routes: appConfig.routes()});

        const bundleHTML = renderToString(
            <SsrProvider
                history={history}
                staticContext={context}
            >
                <ComponentsProvider components={components}>
                    <Application/>
                </ComponentsProvider>
            </SsrProvider>
        );

        if (context.url) {
            res.redirect(context.url);
            return;
        }

        const html = getHTML({
            helmet: Helmet.rewind(),
            bundleHTML,
            store: components.store.getState()
        });

        res
            .status(context.statusCode || 200)
            .send(html);
    }

    next();
}

