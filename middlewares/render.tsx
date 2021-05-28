import * as React from 'react';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import {StaticRouterContext} from 'react-router';
import SsrProvider from '@steroidsjs/core/ui/nav/Router/SsrProvider';
import {walkRoutesRecursive} from '@steroidsjs/core/ui/nav/Router/Router';
import StoreComponent from '@steroidsjs/core/components/StoreComponent';
import reducers from '@steroidsjs/core/reducers';
import {initRoutes} from '@steroidsjs/core/actions/router';
import {setUser} from '@steroidsjs/core/actions/auth';
import {getAssets} from '../utils';
// @ts-ignore
import Application from '_SsrApplication';
//@ts-ignore
import stats from '_SsrStats'
//@ts-ignore
import routes from '_SsrRoutes';

const getHTML = ({bundleHTML, store}) => {
    const assets = getAssets(stats);

    const html = renderToStaticMarkup(
        <html>
            <head>
                {assets.css.map((path, index) => (
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
                {assets.js.map((path, index) => (
                    <script key={index} src={`/${path}`}/>
                ))}
            </body>
        </html>
    );

    return `<!doctype html>${html}`;
};

export default (req, res, next) => {
    res.renderBundle = () => {
        const history = {
            initialEntries: [req.url || '/']
        };

        const store = new StoreComponent({}, {
            reducers,
            history
        });

        const toDispatch = [
            {type: '@@redux/INIT'},
            initRoutes(
                walkRoutesRecursive({id: 'root', ...routes}),
            ),
            setUser(null)
        ]

        store.dispatch(toDispatch);

        const context: StaticRouterContext = {};

        const bundleHTML = renderToString(
            <SsrProvider
                history={history}
                initialState={store.getState()}
                staticContext={context}
            >
                <Application/>
            </SsrProvider>
        );

        if (context.url) {
            res.redirect(context.url);
            return;
        }

        const html = getHTML({bundleHTML, store: store.getState()});

        res
            .status(context.statusCode || 200)
            .send(html);
    }

    next();
}

