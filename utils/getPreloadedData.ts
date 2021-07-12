import {Request} from 'express';
import {matchPath} from 'react-router-dom';
import {IRouteItem, treeToList} from '@steroidsjs/core/ui/nav/Router/Router';
import {IComponents} from '@steroidsjs/core/providers/ComponentsProvider';
import {getConfigId, normalizeConfig, fetchData} from '@steroidsjs/core/hooks/useFetch';
import {IPreloadedData} from '@steroidsjs/core/providers/SsrProvider';

const addCancelTokenMock = () => {}

const getPreloadedData = (routesTree: IRouteItem[], path: Request['path'], components: IComponents): Promise<IPreloadedData> => {
    let fetchConfigs = [];

    // use `some` to imitate `<Switch>` behavior of selecting only the first to match
    treeToList(routesTree).some(route => {
        const match = matchPath(path, route);
        if (match && route.preloadData) {
            fetchConfigs = route.preloadData(match).map(config => normalizeConfig(config));
        }
        return match;
    });
    const promises = fetchConfigs.map(config => fetchData(config, components, addCancelTokenMock));

    return Promise.all(promises).then(result => result.reduce((acc, data, index) => {
        const configId = getConfigId(fetchConfigs[index]);
        acc[configId] = data;
        return acc;
    }, {}));
}

export default getPreloadedData;
