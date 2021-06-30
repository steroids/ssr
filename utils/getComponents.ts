import {Request, Response} from 'express';
import ClientStorageComponent from '@steroidsjs/core/components/ClientStorageComponent';
import HtmlComponent from '@steroidsjs/core/components/HtmlComponent';
import MetaComponent from '@steroidsjs/core/components/MetaComponent';
import UiComponent from '@steroidsjs/core/components/UiComponent';
import MetricsComponent from '@steroidsjs/core/components/MetricsComponent';
import StoreComponent from '@steroidsjs/core/components/StoreComponent';
import {IHistory} from '../middlewares/render';
import detectLanguage from './detectLanguage';

enum ComponentsEnum {
    Locale = 'locale',
    Store = 'store',
    ClientStorage = 'clientStorage',
    Html = 'html',
    Meta = 'meta',
    Ui = 'ui',
    Metrics = 'metrics'
}

interface IComponents {
    [key: string]: Record<string, any>
}

interface IComponentData {
    req: Request,
    res: Response
    history: IHistory
}

const defaultComponentsConfig = {
    [ComponentsEnum.Store]: {
        className: StoreComponent,
    },
    [ComponentsEnum.ClientStorage]: {
        className: ClientStorageComponent,
    },
    [ComponentsEnum.Html]: {
        className: HtmlComponent,
    },
    [ComponentsEnum.Meta]: {
        className: MetaComponent,
    },
    [ComponentsEnum.Ui]: {
        className: UiComponent,
    },
    [ComponentsEnum.Metrics]: {
        className: MetricsComponent,
    },
}

const enrichComponentConfig = (name: string, config: Record<string, any>, data: IComponentData) => {
    const map = {
        [ComponentsEnum.Store]: () => {
            config.reducers = require('reducers').default;
            config.history = data.history;
        },
        [ComponentsEnum.Locale]: () => {
            config.language = detectLanguage(data.req);
        },
        [ComponentsEnum.ClientStorage]: () => {
            config.ssrCookie = {
                get: key => data.req.cookies[key],
                set: (key, value, options) => data.res.cookie(key, value, options),
                remove: (key, options) => data.res.clearCookie(key, options)
            }
        }
    }

    const getResult = map[name];
    if (getResult) {
        return getResult();
    }
}

const getComponents = (config: Record<string, any>, data: IComponentData): IComponents => {
    const componentsConfig = {
        ...defaultComponentsConfig,
        ...config.components,
    };

    const result = Object.entries(componentsConfig).reduce((acc, [name, value]): IComponents => {
        if (typeof value === 'function') {
            componentsConfig[name] = {className: value};
        }

        const {className, ...componentConfig} = componentsConfig[name];

        enrichComponentConfig(name, componentConfig, data);

        acc[name] = new className(acc, componentConfig);

        return acc;
    }, {});

    if (config.onInit) {
        config.onInit(result);
    }

    return result;
}

export default getComponents;
