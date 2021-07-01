import * as React from 'react';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import {NextFunction, Request, Response} from 'express';
import {StaticRouterContext} from 'react-router';
import SsrProvider from '@steroidsjs/core/providers/SsrProvider';
import {walkRoutesRecursive} from '@steroidsjs/core/ui/nav/Router/Router';
import {initRoutes} from '@steroidsjs/core/actions/router';
import {setUser} from '@steroidsjs/core/actions/auth';
import getAssets from '../utils/getAssets';
import getComponents from '../utils/getComponents';
import {ComponentsProvider} from '../../react/src/providers';

export interface ResponseWithRender extends Response {
    renderBundle: () => void;
}

interface IHTMLParams {
    bundleHTML: string,
    store: any
}

export interface IHistory {
    initialEntries: string[]
}

const getHTML = ({bundleHTML, store}: IHTMLParams): string => {
    const {css, js} = getAssets(require('_SsrStats'));

    const html = renderToStaticMarkup(
        <html>
            <head>
                {css.map((path, index) => (
                    <link key={index} href={`/${path}`} rel='stylesheet'/>
                ))}
            </head>
            <body>
                <div id='root' dangerouslySetInnerHTML={{__html: bundleHTML}}/>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.__PRELOADED_STATE__ = ${JSON.stringify(store)}`
                    }}
                />
                {js.map((path, index) => (
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
            throw new Error(`Please save application's config in variable and export it from _SsrApplication`)
        }

        const history: IHistory = {
            initialEntries: [req.url || '/']
        };

        const components = getComponents(appConfig, {req, res, history});

        const toDispatch = [
            {type: '@@redux/INIT'},
            initRoutes(
                walkRoutesRecursive({id: 'root', ...appConfig.routes()}),
            ),
            setUser(null)
        ]
        components.store.dispatch(toDispatch);

        const context: StaticRouterContext = {};

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

        const html = getHTML({bundleHTML, store: components.store.getState()});

        res
            .status(context.statusCode || 200)
            .send(html);
    }

    next();
}

